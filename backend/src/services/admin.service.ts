import prisma from '../config/prisma';

export class AdminService {
  static async getDashboardStats() {
    const [
      totalUsers,
      bannedUsers,
      mutedUsers,
      totalConversations,
      totalDirectMessages,
      totalPublicMessages,
      recentAuditLogs
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isBanned: true } }),
      prisma.user.count({ where: { isMutedInPublic: true } }),
      prisma.conversation.count(),
      prisma.message.count(),
      prisma.publicMessage.count(),
      prisma.auditLog.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          admin: {
            select: { id: true, username: true }
          }
        }
      })
    ]);

    return {
      users: {
        total: totalUsers,
        active: totalUsers - bannedUsers,
        banned: bannedUsers,
        mutedInPublic: mutedUsers
      },
      chats: {
        conversations: totalConversations,
        directMessages: totalDirectMessages,
        publicMessages: totalPublicMessages
      },
      recentAuditLogs
    };
  }

  static async listUsers(params: {
    search?: string;
    page?: number;
    limit?: number;
    role?: 'USER' | 'ADMIN';
    isBanned?: boolean;
  }) {
    const { search = '', page = 1, limit = 20, role, isBanned } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (role) where.role = role;
    if (isBanned !== undefined) where.isBanned = isBanned;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          email: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
          role: true,
          isBanned: true,
          isMutedInPublic: true,
          lastSeenAt: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.user.count({ where })
    ]);

    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  static async setBanStatus(adminId: string, targetUserId: string, isBanned: boolean, reason?: string) {
    if (adminId === targetUserId) {
      throw new Error('Admin cannot ban themselves');
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { isBanned },
      select: { id: true, username: true, isBanned: true }
    });

    await prisma.auditLog.create({
      data: {
        adminId,
        action: isBanned ? 'BAN_USER' : 'UNBAN_USER',
        targetId: targetUserId,
        details: reason || `Admin set ban status to ${isBanned}`
      }
    });

    return updatedUser;
  }

  static async setMuteStatus(adminId: string, targetUserId: string, isMuted: boolean, reason?: string) {
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { isMutedInPublic: isMuted },
      select: { id: true, username: true, isMutedInPublic: true }
    });

    await prisma.auditLog.create({
      data: {
        adminId,
        action: isMuted ? 'MUTE_USER_PUBLIC' : 'UNMUTE_USER_PUBLIC',
        targetId: targetUserId,
        details: reason || `Admin set public mute to ${isMuted}`
      }
    });

    return updatedUser;
  }

  static async deletePublicMessage(adminId: string, messageId: string, reason?: string) {
    const deleted = await prisma.publicMessage.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        deletedBy: adminId
      }
    });

    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'DELETE_PUBLIC_MESSAGE',
        targetId: messageId,
        details: reason || 'Inappropriate public message removed by admin'
      }
    });

    return deleted;
  }

  static async getAuditLogs(params: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          admin: {
            select: { id: true, username: true }
          }
        }
      }),
      prisma.auditLog.count()
    ]);

    return {
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }
}

