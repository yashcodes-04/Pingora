import { Router } from 'express';
import { z } from 'zod';
import { AdminController } from '../controllers/admin.controller';
import { authenticateJwt } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/admin.middleware';
import { validate } from '../middlewares/validate.middleware';

const router = Router();

const setBanSchema = z.object({
  isBanned: z.boolean(),
  reason: z.string().optional()
});

const setMuteSchema = z.object({
  isMuted: z.boolean(),
  reason: z.string().optional()
});

const deleteMessageSchema = z.object({
  reason: z.string().optional()
});

router.use(authenticateJwt, requireAdmin);

// Dashboard overview
router.get('/dashboard', AdminController.getDashboardStats);

// User moderation
router.get('/users', AdminController.listUsers);
router.patch('/users/:userId/ban', validate(setBanSchema), AdminController.setBanStatus);
router.patch('/users/:userId/mute', validate(setMuteSchema), AdminController.setMuteStatus);

// Public chat moderation
router.delete('/public-messages/:messageId', validate(deleteMessageSchema), AdminController.deletePublicMessage);

// Audit logs
router.get('/audit-logs', AdminController.getAuditLogs);

export default router;

