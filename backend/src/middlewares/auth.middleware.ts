import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import prisma from '../config/prisma';
import { sendError } from '../utils/response';
import { Role } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  username: string;
  email: string;
  role: Role;
  isBanned: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const authenticateJwt = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 'Authorization token missing or invalid', 401);
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      id: string;
      username: string;
      role: Role;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isBanned: true
      }
    });

    if (!user) {
      sendError(res, 'User no longer exists', 401);
      return;
    }

    if (user.isBanned) {
      sendError(res, 'Your account has been suspended by an administrator', 403);
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    sendError(res, 'Invalid or expired token', 401);
  }
};

