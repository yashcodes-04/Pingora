import http from 'http';
import express, { Application } from 'express';
import cors from 'cors';
import { env } from './config/env';
import prisma from './config/prisma';
import routes from './routes';
import { errorHandler } from './middlewares/error.middleware';
import { initSocketServer } from './socket';
import { logger } from './utils/logger';

const app: Application = express();
const server = http.createServer(app);

// Middlewares
const allowedOrigins = env.CLIENT_ORIGIN.split(',').map((o) => o.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

// API Routes
app.use('/api/v1', routes);

// Global Error Handler
app.use(errorHandler);

// Initialize Socket.io
initSocketServer(server);

// Start Server
const PORT = parseInt(env.PORT, 10) || 5000;
server.listen(PORT, () => {
  logger.info(`🚀 Pingora Backend Server is running on port ${PORT}`);
  logger.info(`📡 Socket.io engine initialized and listening for connections`);
  logger.info(`✨ Mode: ${env.NODE_ENV}`);
});

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down server gracefully...');
  server.close(async () => {
    logger.info('HTTP & WebSocket server closed.');
    await prisma.$disconnect();
    logger.info('Prisma disconnected.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export { app, server };

