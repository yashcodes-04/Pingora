import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || req.user.role !== 'ADMIN') {
    sendError(res, 'Access denied. Administrator privileges required.', 403);
    return;
  }
  next();
};

