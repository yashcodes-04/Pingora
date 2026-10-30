import { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS } from '../events';
import { ChatService } from '../../services/chat.service';
import { logger } from '../../utils/logger';

export const registerChatHandlers = (io: Server, socket: Socket) => {
  const currentUser = socket.data.user;

  // Join a specific conversation room for real-time updates
  socket.on(SOCKET_EVENTS.CHAT_JOIN_CONVERSATION, ({ conversationId }: { conversationId: string }) => {
    if (!conversationId) return;
    socket.join(`conv:${conversationId}`);
    logger.debug(`Socket ${socket.id} joined conversation room conv:${conversationId}`);
  });

  // Leave conversation room
  socket.on(SOCKET_EVENTS.CHAT_LEAVE_CONVERSATION, ({ conversationId }: { conversationId: string }) => {
    if (!conversationId) return;
    socket.leave(`conv:${conversationId}`);
  });

  // Send Direct Message
  socket.on(
    SOCKET_EVENTS.CHAT_SEND_MESSAGE,
    async (
      data: {
        conversationId: string;
        content: string;
        messageType?: any;
        mediaUrl?: string;
        recipientId?: string;
      },
      callback?: (response: any) => void
    ) => {
      try {
        const { conversationId, content, messageType, mediaUrl, recipientId } = data;

        if (!conversationId || !content?.trim()) {
          if (callback) callback({ success: false, error: 'Invalid message payload' });
          return;
        }

        const message = await ChatService.sendDirectMessage({
          senderId: currentUser.id,
          conversationId,
          content: content.trim(),
          messageType,
          mediaUrl
        });

        // 1. Emit to everyone in the conversation room
        io.to(`conv:${conversationId}`).emit(SOCKET_EVENTS.CHAT_NEW_MESSAGE, {
          message,
          conversationId
        });

        // 2. Also emit to recipient's personal user room so they receive it even if not viewing that chat
        if (recipientId) {
          io.to(`user:${recipientId}`).emit(SOCKET_EVENTS.CHAT_NEW_MESSAGE, {
            message,
            conversationId
          });
        }

        if (callback) callback({ success: true, message });
      } catch (error: any) {
        logger.error('Error in CHAT_SEND_MESSAGE handler:', error.message);
        if (callback) callback({ success: false, error: error.message });
      }
    }
  );

  // Typing indicators
  socket.on(
    SOCKET_EVENTS.CHAT_TYPING_START,
    ({ conversationId, recipientId }: { conversationId: string; recipientId: string }) => {
      if (conversationId) {
        socket.to(`conv:${conversationId}`).emit(SOCKET_EVENTS.CHAT_TYPING_START, {
          conversationId,
          userId: currentUser.id,
          username: currentUser.username
        });
      }
      if (recipientId) {
        socket.to(`user:${recipientId}`).emit(SOCKET_EVENTS.CHAT_TYPING_START, {
          conversationId,
          userId: currentUser.id,
          username: currentUser.username
        });
      }
    }
  );

  socket.on(
    SOCKET_EVENTS.CHAT_TYPING_STOP,
    ({ conversationId, recipientId }: { conversationId: string; recipientId: string }) => {
      if (conversationId) {
        socket.to(`conv:${conversationId}`).emit(SOCKET_EVENTS.CHAT_TYPING_STOP, {
          conversationId,
          userId: currentUser.id
        });
      }
      if (recipientId) {
        socket.to(`user:${recipientId}`).emit(SOCKET_EVENTS.CHAT_TYPING_STOP, {
          conversationId,
          userId: currentUser.id
        });
      }
    }
  );

  // Mark message as read
  socket.on(
    SOCKET_EVENTS.CHAT_MESSAGE_READ,
    async ({ conversationId }: { conversationId: string }) => {
      try {
        if (!conversationId) return;
        await ChatService.markConversationAsRead(conversationId, currentUser.id);

        socket.to(`conv:${conversationId}`).emit(SOCKET_EVENTS.CHAT_MESSAGE_READ, {
          conversationId,
          readerId: currentUser.id
        });
      } catch (err: any) {
        logger.warn('Error marking messages read:', err.message);
      }
    }
  );
};

