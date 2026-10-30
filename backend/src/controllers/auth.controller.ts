import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { sendSuccess, sendError } from '../utils/response';
import prisma from '../config/prisma';

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { username, email, password, displayName, avatarUrl, role } = req.body;
      const result = await AuthService.register({
        username,
        email,
        password,
        displayName,
        avatarUrl,
        role
      });
      sendSuccess(res, result, 'Registration successful', 201);
    } catch (error: any) {
      sendError(res, error.message, 400);
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { identifier, password } = req.body;
      const result = await AuthService.login(identifier, password);
      sendSuccess(res, result, 'Login successful');
    } catch (error: any) {
      sendError(res, error.message, 401);
    }
  }

  static async getMe(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401);
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          username: true,
          email: true,
          displayName: true,
          avatarUrl: true,
          heygenAvatarId: true,
          bio: true,
          role: true,
          isBanned: true,
          isMutedInPublic: true,
          lastSeenAt: true,
          createdAt: true
        }
      });

      sendSuccess(res, user, 'Profile retrieved');
    } catch (error: any) {
      sendError(res, error.message, 500);
    }
  }
}

