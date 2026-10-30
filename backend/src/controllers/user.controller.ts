import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { sendSuccess, sendError } from '../utils/response';

export class UserController {
  static async searchUsers(req: Request, res: Response): Promise<void> {
    try {
      const query = (req.query.q as string) || '';
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await UserService.searchUsers({
        query,
        currentUserId: req.user!.id,
        page,
        limit
      });

      sendSuccess(res, result, 'Users retrieved');
    } catch (error: any) {
      sendError(res, error.message, 500);
    }
  }

  static async getProfileByUsername(req: Request, res: Response): Promise<void> {
    try {
      const username = String(req.params.username);
      const user = await UserService.getUserByUsername(username);
      sendSuccess(res, user, 'User found');
    } catch (error: any) {
      sendError(res, error.message, 404);
    }
  }

  static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const { displayName, bio, avatarUrl, heygenAvatarId } = req.body;
      const updated = await UserService.updateProfile(req.user!.id, {
        displayName,
        bio,
        avatarUrl,
        heygenAvatarId
      });
      sendSuccess(res, updated, 'Profile updated successfully');
    } catch (error: any) {
      sendError(res, error.message, 400);
    }
  }
}
