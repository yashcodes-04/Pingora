import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { sendError } from '../utils/response';

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message
        }));
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: issues
        });
        return;
      }
      sendError(res, 'Internal validation error', 500);
    }
  };
};

export const validateQuery = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.query = await schema.parseAsync(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message
        }));
        res.status(400).json({
          success: false,
          message: 'Query parameter validation failed',
          errors: issues
        });
        return;
      }
      sendError(res, 'Internal validation error', 500);
    }
  };
};

