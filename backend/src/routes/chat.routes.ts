import { Router } from 'express';
import { z } from 'zod';
import { ChatController } from '../controllers/chat.controller';
import { authenticateJwt } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';

const router = Router();

const startChatSchema = z.object({
  username: z.string().min(1, 'Target username is required')
});

const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message content cannot be empty'),
  messageType: z.enum(['TEXT', 'IMAGE', 'AUDIO', 'VIDEO', 'FILE']).optional().default('TEXT'),
  mediaUrl: z.string().url().optional()
});

router.use(authenticateJwt);

// List active conversations
router.get('/conversations', ChatController.getConversations);

// Start or get direct conversation by username
router.post('/start', validate(startChatSchema), ChatController.startDirectChatByUsername);

// Get messages for conversation
router.get('/conversations/:conversationId/messages', ChatController.getMessages);

// Send message via REST endpoint
router.post('/conversations/:conversationId/messages', validate(sendMessageSchema), ChatController.sendMessage);

// Mark conversation messages as read
router.post('/conversations/:conversationId/read', ChatController.markAsRead);

export default router;

