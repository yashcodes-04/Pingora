import { Router } from 'express';
import { z } from 'zod';
import { PublicChatController } from '../controllers/publicChat.controller';
import { authenticateJwt } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';

const router = Router();

const postPublicMessageSchema = z.object({
  content: z.string().min(1, 'Message content cannot be empty').max(1000, 'Message cannot exceed 1000 characters')
});

router.use(authenticateJwt);

// Public chat history
router.get('/messages', PublicChatController.getMessages);

// Post to public chat
router.post('/messages', validate(postPublicMessageSchema), PublicChatController.postMessage);

// Delete message (moderator or author)
router.delete('/messages/:messageId', PublicChatController.deleteMessage);

export default router;

