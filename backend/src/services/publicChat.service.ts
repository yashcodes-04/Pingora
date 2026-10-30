import prisma from '../config/prisma';

export class PublicChatService {
  static async getPublicMessages(params: { page?: number; limit?: number }) {
    const { page = 1, limit = 50 } = params;
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      prisma.publicMessage.findMany({
        where: { isDeleted: false },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              role: true
            }
          }
        }
      }),
      prisma.publicMessage.count({ where: { isDeleted: false } })
    ]);

    return {
      messages: messages.reverse(),
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  static async postPublicMessage(senderId: string, content: string) {
    const user = await prisma.user.findUnique({
      where: { id: senderId },
      select: { id: true, isBanned: true, isMutedInPublic: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.isBanned) {
      throw new Error('User account is suspended');
    }

    if (user.isMutedInPublic) {
      throw new Error('You have been muted in the public chat room by a moderator');
    }

    const message = await prisma.publicMessage.create({
      data: {
        senderId,
        content: content.trim()
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            role: true
          }
        }
      }
    });

    return message;
  }

  static async deletePublicMessage(messageId: string, requestedByUserId: string, isAdmin: boolean) {
    const message = await prisma.publicMessage.findUnique({
      where: { id: messageId }
    });

    if (!message) {
      throw new Error('Message not found');
    }

    if (message.senderId !== requestedByUserId && !isAdmin) {
      throw new Error('Not authorized to delete this message');
    }

    return prisma.publicMessage.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        deletedBy: requestedByUserId
      }
    });
  }
}

