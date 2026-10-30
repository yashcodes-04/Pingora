import { Router } from 'express';
import { z } from 'zod';
import { AvatarController } from '../controllers/avatar.controller';
import { authenticateJwt } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';

const router = Router();

const selectAvatarSchema = z.object({
  avatarId: z.string().min(1, 'Avatar ID is required'),
  avatarName: z.string().optional(),
  scriptText: z.string().optional(),
  applyToProfile: z.boolean().optional().default(true)
});

router.use(authenticateJwt);

// HeyGen Avatar endpoints
router.get('/heygen/list', AvatarController.listHeyGenAvatars);
router.post('/heygen/select', validate(selectAvatarSchema), AvatarController.generateOrSelectAvatar);

export default router;

