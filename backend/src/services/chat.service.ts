import prisma from '../config/prisma';
import { MessageType, MessageStatus } from '@prisma/client';

export class ChatService {
  static async getOrCreateDirectConversation(userId1: string, userId2: string) {
    if (userId1 === userId2) {
      throw new Error('Cannot start a direct conversation with yourself');
    }

    // Find if a direct conversation already exists between both users
    const existing = await prisma.conversation.findFirst({
      where: {
        type: 'DIRECT',
        AND: [
          { participants: { some: { userId: userId1 } } },
          { participants: { some: { userId: userId2 } } }
        ]
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                lastSeenAt: true
              }
            }
          }
        }
      }
    });

    if (existing) {
      return existing;
    }

    // Create new direct conversation
    return prisma.conversation.create({
      data: {
        type: 'DIRECT',
        participants: {
          create: [
            { userId: userId1 },
            { userId: userId2 }
          ]
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                lastSeenAt: true
              }
            }
          }
        }
      }
    });
  }

  static async getUserConversations(userId: string) {
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId }
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                lastSeenAt: true
              }
            }
          }
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            senderId: true,
            content: true,
            messageType: true,
            status: true,
            createdAt: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Format for easier client consumption
    return conversations.map((conv) => {
      const otherParticipant = conv.participants.find((p) => p.userId !== userId)?.user;
      const myParticipant = conv.participants.find((p) => p.userId === userId);
      const lastMessage = conv.messages[0] || null;

      return {
        id: conv.id,
        type: conv.type,
        updatedAt: conv.updatedAt,
        otherUser: otherParticipant || null,
        lastMessage,
        lastReadAt: myParticipant?.lastReadAt
      };
    });
  }

  static async getConversationMessages(params: {
    conversationId: string;
    userId: string;
    page?: number;
    limit?: number;
  }) {
    const { conversationId, userId, page = 1, limit = 50 } = params;
    const skip = (page - 1) * limit;

    // Verify participant
    const isParticipant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId
        }
      }
    });

    if (!isParticipant) {
      throw new Error('Not authorized to view messages in this conversation');
    }

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: {
          conversationId,
          isDeleted: false
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true
            }
          }
        }
      }),
      prisma.message.count({
        where: {
          conversationId,
          isDeleted: false
        }
      })
    ]);

    // Return messages in chronological order (oldest to newest)
    return {
      messages: messages.reverse(),
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  static async sendDirectMessage(params: {
    senderId: string;
    conversationId: string;
    content: string;
    messageType?: MessageType;
    mediaUrl?: string;
  }) {
    const { senderId, conversationId, content, messageType = 'TEXT', mediaUrl } = params;

    // Verify participation
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: senderId
        }
      }
    });

    if (!participant) {
      throw new Error('Sender is not a participant in this conversation');
    }

    // Create message and touch conversation updatedAt
    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId,
          senderId,
          content,
          messageType,
          mediaUrl,
          status: 'SENT'
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true
            }
          }
        }
      }),
      prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() }
      })
    ]);

    return message;
  }

  static async markConversationAsRead(conversationId: string, userId: string) {
    await prisma.$transaction([
      // Update participant's lastReadAt
      prisma.conversationParticipant.update({
        where: {
          conversationId_userId: {
            conversationId,
            userId
          }
        },
        data: { lastReadAt: new Date() }
      }),
      // Mark unread messages sent by others in this conversation as READ
      prisma.message.updateMany({
        where: {
          conversationId,
          senderId: { not: userId },
          status: { not: 'READ' }
        },
        data: { status: 'READ' }
      })
    ]);

    return { success: true };
  }
}

