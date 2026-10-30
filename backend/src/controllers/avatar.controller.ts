import { Request, Response } from 'express';
import { HeyGenService } from '../services/heygen.service';
import { UserService } from '../services/user.service';
import { sendSuccess, sendError } from '../utils/response';

export class AvatarController {
  static async listHeyGenAvatars(req: Request, res: Response): Promise<void> {
    try {
      const avatars = await HeyGenService.listAvatars();
      sendSuccess(res, avatars, 'HeyGen AI avatars retrieved');
    } catch (error: any) {
      sendError(res, error.message, 500);
    }
  }

  static async generateOrSelectAvatar(req: Request, res: Response): Promise<void> {
    try {
      const { avatarId, avatarName, scriptText, applyToProfile = true } = req.body;
      const result = await HeyGenService.generateCustomAvatar({
        avatarId,
        avatarName,
        scriptText
      });

      if (applyToProfile && req.user) {
        await UserService.updateProfile(req.user.id, {
          avatarUrl: result.avatarUrl,
          heygenAvatarId: result.avatarId
        });
      }

      sendSuccess(res, result, 'HeyGen AI avatar configured and applied');
    } catch (error: any) {
      sendError(res, error.message, 400);
    }
  }
}

