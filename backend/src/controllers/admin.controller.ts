import { Request, Response } from 'express';
import { AdminService } from '../services/admin.service';
import { sendSuccess, sendError } from '../utils/response';

export class AdminController {
  static async getDashboardStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await AdminService.getDashboardStats();
      sendSuccess(res, stats, 'Admin dashboard statistics');
    } catch (error: any) {
      sendError(res, error.message, 500);
    }
  }

  static async listUsers(req: Request, res: Response): Promise<void> {
    try {
      const search = (req.query.search as string) || '';
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const role = req.query.role as 'USER' | 'ADMIN' | undefined;
      const isBanned = req.query.isBanned !== undefined ? req.query.isBanned === 'true' : undefined;

      const result = await AdminService.listUsers({ search, page, limit, role, isBanned });
      sendSuccess(res, result, 'Users list retrieved for admin');
    } catch (error: any) {
      sendError(res, error.message, 500);
    }
  }

  static async setBanStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = String(req.params.userId);
      const { isBanned, reason } = req.body;
      const result = await AdminService.setBanStatus(req.user!.id, userId, Boolean(isBanned), reason);
      sendSuccess(res, result, `User ban status updated to ${isBanned}`);
    } catch (error: any) {
      sendError(res, error.message, 400);
    }
  }

  static async setMuteStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = String(req.params.userId);
      const { isMuted, reason } = req.body;
      const result = await AdminService.setMuteStatus(req.user!.id, userId, Boolean(isMuted), reason);
      sendSuccess(res, result, `User public mute status updated to ${isMuted}`);
    } catch (error: any) {
      sendError(res, error.message, 400);
    }
  }

  static async deletePublicMessage(req: Request, res: Response): Promise<void> {
    try {
      const messageId = String(req.params.messageId);
      const { reason } = req.body;
      const result = await AdminService.deletePublicMessage(req.user!.id, messageId, reason);
      sendSuccess(res, result, 'Public message deleted by administrator');
    } catch (error: any) {
      sendError(res, error.message, 400);
    }
  }

  static async getAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await AdminService.getAuditLogs({ page, limit });
      sendSuccess(res, result, 'Audit logs retrieved');
    } catch (error: any) {
      sendError(res, error.message, 500);
    }
  }
}
