import prisma from '../config/prisma';

export class UserService {
  static async searchUsers(params: {
    query: string;
    currentUserId: string;
    page?: number;
    limit?: number;
  }) {
    const { query, currentUserId, page = 1, limit = 20 } = params;
    const cleanQuery = query.replace(/^@/, '').toLowerCase().trim();
    const skip = (page - 1) * limit;

    if (!cleanQuery) {
      return { users: [], total: 0, page, totalPages: 0 };
    }

    const where = {
      isBanned: false,
      id: { not: currentUserId },
      OR: [
        { username: { contains: cleanQuery, mode: 'insensitive' as const } },
        { displayName: { contains: cleanQuery, mode: 'insensitive' as const } }
      ]
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          heygenAvatarId: true,
          bio: true,
          lastSeenAt: true
        },
        orderBy: { username: 'asc' },
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

  static async getUserByUsername(username: string) {
    const clean = username.replace(/^@/, '').toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { username: clean },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        heygenAvatarId: true,
        bio: true,
        lastSeenAt: true,
        createdAt: true,
        isBanned: true
      }
    });

    if (!user || user.isBanned) {
      throw new Error('User not found');
    }

    return user;
  }

  static async updateProfile(
    userId: string,
    data: {
      displayName?: string;
      bio?: string;
      avatarUrl?: string;
      heygenAvatarId?: string;
    }
  ) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.displayName !== undefined ? { displayName: data.displayName } : {}),
        ...(data.bio !== undefined ? { bio: data.bio } : {}),
        ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {}),
        ...(data.heygenAvatarId !== undefined ? { heygenAvatarId: data.heygenAvatarId } : {})
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        heygenAvatarId: true,
        bio: true,
        lastSeenAt: true,
        updatedAt: true
      }
    });
  }
}

