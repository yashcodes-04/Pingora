import { Router } from 'express';
import { z } from 'zod';
import { UserController } from '../controllers/user.controller';
import { authenticateJwt } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';

const router = Router();

const updateProfileSchema = z.object({
  displayName: z.string().max(50).optional(),
  bio: z.string().max(250).optional(),
  avatarUrl: z.string().url().optional(),
  heygenAvatarId: z.string().optional()
});

router.use(authenticateJwt);

// User search & profiles
router.get('/search', UserController.searchUsers);
router.get('/:username', UserController.getProfileByUsername);
router.patch('/profile', validate(updateProfileSchema), UserController.updateProfile);

export default router;

