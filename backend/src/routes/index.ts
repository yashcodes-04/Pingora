import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import avatarRoutes from './avatar.routes';
import chatRoutes from './chat.routes';
import publicChatRoutes from './publicChat.routes';
import adminRoutes from './admin.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/avatars', avatarRoutes);
router.use('/chats', chatRoutes);
router.use('/public-chat', publicChatRoutes);
router.use('/admin', adminRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Pingora Backend API'
  });
});

export default router;

