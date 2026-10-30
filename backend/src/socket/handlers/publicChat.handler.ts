import { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS } from '../events';
import { PublicChatService } from '../../services/publicChat.service';
import { logger } from '../../utils/logger';

const PUBLIC_ROOM = 'room:public';

export const registerPublicChatHandlers = (io: Server, socket: Socket) => {
  const currentUser = socket.data.user;

  // Join public chat room
  socket.on(SOCKET_EVENTS.PUBLIC_JOIN, () => {
    socket.join(PUBLIC_ROOM);
    logger.debug(`User ${currentUser.username} (${socket.id}) joined public room`);
  });

  // Leave public chat room
  socket.on(SOCKET_EVENTS.PUBLIC_LEAVE, () => {
    socket.leave(PUBLIC_ROOM);
    logger.debug(`User ${currentUser.username} (${socket.id}) left public room`);
  });

  // Send Public Message
  socket.on(
    SOCKET_EVENTS.PUBLIC_SEND_MESSAGE,
    async (
      data: { content: string },
      callback?: (response: any) => void
    ) => {
      try {
        if (!data.content?.trim()) {
          if (callback) callback({ success: false, error: 'Message cannot be empty' });
          return;
        }

        const message = await PublicChatService.postPublicMessage(currentUser.id, data.content);

        // Broadcast to all clients in the public room
        io.to(PUBLIC_ROOM).emit(SOCKET_EVENTS.PUBLIC_NEW_MESSAGE, { message });

        if (callback) callback({ success: true, message });
      } catch (error: any) {
        logger.warn(`Failed to post public message from ${currentUser.username}:`, error.message);
        if (callback) callback({ success: false, error: error.message });
      }
    }
  );
};

