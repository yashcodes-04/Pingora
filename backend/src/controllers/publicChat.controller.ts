import { Request, Response } from 'express';
import { PublicChatService } from '../services/publicChat.service';
import { sendSuccess, sendError } from '../utils/response';

export class PublicChatController {
  static async getMessages(req: Request, res: Response): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

      const result = await PublicChatService.getPublicMessages({ page, limit });
      sendSuccess(res, result, 'Public messages retrieved');
    } catch (error: any) {
      sendError(res, error.message, 500);
    }
  }

  static async postMessage(req: Request, res: Response): Promise<void> {
    try {
      const { content } = req.body;
      const message = await PublicChatService.postPublicMessage(req.user!.id, content);
      sendSuccess(res, message, 'Public message posted', 201);
    } catch (error: any) {
      sendError(res, error.message, 400);
    }
  }

  static async deleteMessage(req: Request, res: Response): Promise<void> {
    try {
      const messageId = String(req.params.messageId);
      const isAdmin = req.user?.role === 'ADMIN';
      const deleted = await PublicChatService.deletePublicMessage(
        messageId,
        req.user!.id,
        isAdmin
      );
      sendSuccess(res, deleted, 'Message deleted');
    } catch (error: any) {
      sendError(res, error.message, 403);
    }
  }
}
