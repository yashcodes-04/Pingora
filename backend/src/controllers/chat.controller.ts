import { Request, Response } from 'express';
import { ChatService } from '../services/chat.service';
import { UserService } from '../services/user.service';
import { sendSuccess, sendError } from '../utils/response';

export class ChatController {
  static async getConversations(req: Request, res: Response): Promise<void> {
    try {
      const conversations = await ChatService.getUserConversations(req.user!.id);
      sendSuccess(res, conversations, 'Conversations retrieved');
    } catch (error: any) {
      sendError(res, error.message, 500);
    }
  }

  static async startDirectChatByUsername(req: Request, res: Response): Promise<void> {
    try {
      const { username } = req.body;
      const targetUser = await UserService.getUserByUsername(username);

      if (targetUser.id === req.user!.id) {
        sendError(res, 'Cannot start conversation with yourself', 400);
        return;
      }

      const conversation = await ChatService.getOrCreateDirectConversation(
        req.user!.id,
        targetUser.id
      );

      sendSuccess(res, conversation, 'Conversation started or retrieved');
    } catch (error: any) {
      sendError(res, error.message, 400);
    }
  }

  static async getMessages(req: Request, res: Response): Promise<void> {
    try {
      const conversationId = String(req.params.conversationId);
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

      const result = await ChatService.getConversationMessages({
        conversationId,
        userId: req.user!.id,
        page,
        limit
      });

      sendSuccess(res, result, 'Messages retrieved');
    } catch (error: any) {
      sendError(res, error.message, 400);
    }
  }

  static async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const conversationId = String(req.params.conversationId);
      const { content, messageType, mediaUrl } = req.body;

      const message = await ChatService.sendDirectMessage({
        senderId: req.user!.id,
        conversationId,
        content,
        messageType,
        mediaUrl
      });

      sendSuccess(res, message, 'Message sent', 201);
    } catch (error: any) {
      sendError(res, error.message, 400);
    }
  }

  static async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const conversationId = String(req.params.conversationId);
      const result = await ChatService.markConversationAsRead(conversationId, req.user!.id);
      sendSuccess(res, result, 'Messages marked as read');
    } catch (error: any) {
      sendError(res, error.message, 400);
    }
  }
}
