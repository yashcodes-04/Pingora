import prisma from '../config/prisma';
import { logger } from '../utils/logger';

class PresenceManager {
  // Map of userId -> Set of socketIds (user may have multiple tabs/devices)
  private userSockets: Map<string, Set<string>> = new Map();
  // Map of socketId -> userId
  private socketToUser: Map<string, string> = new Map();

  addUserSocket(userId: string, socketId: string): boolean {
    this.socketToUser.set(socketId, userId);

    const existing = this.userSockets.get(userId);
    if (!existing) {
      this.userSockets.set(userId, new Set([socketId]));
      return true; // Newly became online
    } else {
      existing.add(socketId);
      return false; // Already online on another connection
    }
  }

  async removeSocket(socketId: string): Promise<{ userId?: string; becameOffline: boolean }> {
    const userId = this.socketToUser.get(socketId);
    if (!userId) {
      return { becameOffline: false };
    }

    this.socketToUser.delete(socketId);
    const sockets = this.userSockets.get(userId);

    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);

        // Persist last seen in DB
        try {
          await prisma.user.update({
            where: { id: userId },
            data: { lastSeenAt: new Date() }
          });
        } catch (error: any) {
          logger.warn(`Failed to update lastSeenAt for ${userId}:`, error.message);
        }

        return { userId, becameOffline: true };
      }
    }

    return { userId, becameOffline: false };
  }

  isUserOnline(userId: string): boolean {
    const sockets = this.userSockets.get(userId);
    return !!sockets && sockets.size > 0;
  }

  getUserSockets(userId: string): string[] {
    const sockets = this.userSockets.get(userId);
    return sockets ? Array.from(sockets) : [];
  }

  getActiveUserCount(): number {
    return this.userSockets.size;
  }
}

export const presence = new PresenceManager();

