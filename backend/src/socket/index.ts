import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import prisma from '../config/prisma';
import { logger } from '../utils/logger';
import { SOCKET_EVENTS } from './events';
import { presence } from './presence';
import { registerChatHandlers } from './handlers/chat.handler';
import { registerPublicChatHandlers } from './handlers/publicChat.handler';

export let ioInstance: Server | null = null;

export const initSocketServer = (httpServer: HttpServer): Server => {
  const allowedOrigins = env.CLIENT_ORIGIN.split(',').map((o) => o.trim());

  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true
    },
    pingTimeout: 30000,
    pingInterval: 25000
  });

  ioInstance = io;

  // Authentication Middleware for Socket.io
  io.use(async (socket: Socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace(/^Bearer\s+/, '');

      if (!token) {
        return next(new Error('Authentication error: Token not provided'));
      }

      const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string };

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          role: true,
          isBanned: true
        }
      });

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      if (user.isBanned) {
        return next(new Error('Authentication error: User is banned'));
      }

      socket.data.user = user;
      next();
    } catch (err: any) {
      logger.warn('Socket authentication failed:', err.message);
      next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user;
    logger.info(`⚡ Socket connected: ${user.username} (${socket.id})`);

    // Track presence
    const becameOnline = presence.addUserSocket(user.id, socket.id);
    if (becameOnline) {
      // Broadcast online status to others
      socket.broadcast.emit(SOCKET_EVENTS.PRESENCE_ONLINE, {
        userId: user.id,
        username: user.username
      });
    }

    // Join private user room (for direct notifications and messages)
    socket.join(`user:${user.id}`);

    // Register Chat and Public Chat handlers
    registerChatHandlers(io, socket);
    registerPublicChatHandlers(io, socket);

    // Disconnect handler
    socket.on('disconnect', async () => {
      logger.info(`🔌 Socket disconnected: ${user.username} (${socket.id})`);
      const { becameOffline } = await presence.removeSocket(socket.id);

      if (becameOffline) {
        io.emit(SOCKET_EVENTS.PRESENCE_OFFLINE, {
          userId: user.id,
          lastSeenAt: new Date().toISOString()
        });
      }
    });
  });

  return io;
};

