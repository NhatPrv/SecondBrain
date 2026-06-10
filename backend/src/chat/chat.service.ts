import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async getConversations(userId: string) {
    // Check if self-conversation (Saved Messages) exists
    // It is a direct chat where the only member is the user themselves
    const selfMembership = await this.prisma.conversationMember.findFirst({
      where: {
        userId,
        conversation: {
          type: 'direct',
          members: {
            every: {
              userId,
            },
          },
        },
      },
    });

    if (!selfMembership) {
      const selfConv = await this.prisma.conversation.create({
        data: {
          name: 'Saved Messages',
          type: 'direct',
          color: 'bg-chart-1',
          initials: 'SM',
          pinned: false,
        },
      });

      await this.prisma.conversationMember.create({
        data: {
          conversationId: selfConv.id,
          userId,
        },
      });

      // Seed default messages for Maya
      if (userId === 'maya') {
        const initialSelfMessages = [
          { text: "Idea: build a shared family recipe book inside Second Brain.", pinned: false },
          { text: "Wifi password for the cabin: bluemountain2024", pinned: true },
          { text: "Remember to renew Leo's passport before August.", pinned: false },
          { text: "Grocery list: oat milk, eggs, spinach, coffee, bananas.", pinned: false },
          { text: "Dentist appointment moved to Thursday 3pm.", pinned: false },
          { text: "Book idea: \"The Quiet Garden\" — start outline this weekend.", pinned: false },
          { text: "Gift ideas for Mom: gardening gloves, a good book, spa day.", pinned: true },
        ];
        
        for (const msg of initialSelfMessages) {
          await this.prisma.message.create({
            data: {
              conversationId: selfConv.id,
              authorId: userId,
              text: msg.text,
              pinned: msg.pinned,
            },
          });
        }
      }
    }

    // Find all conversations where the user is a member
    const memberships = await this.prisma.conversationMember.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            members: {
              include: {
                user: true,
              },
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: {
                author: true,
              },
            },
          },
        },
      },
    });

    const conversations = memberships.map((m) => {
      const c = m.conversation;
      const lastMsg = c.messages[0];
      
      let lastText = '';
      let lastTime = '';
      if (lastMsg) {
        if (c.type === 'group') {
          lastText = `${lastMsg.author.name.split(' ')[0]}: ${lastMsg.text}`;
        } else {
          lastText = lastMsg.text;
        }
        
        // Format time
        lastTime = this.formatTime(lastMsg.createdAt);
      }

      // Default values
      let name = c.name;
      let initials = c.initials;
      let color = c.color;
      let online = false;

      // Direct chats should display the other user's info
      if (c.type === 'direct') {
        const otherMember = c.members.find((member) => member.userId !== userId);
        if (otherMember) {
          const u = otherMember.user;
          name = u.name;
          initials = u.initials;
          color = u.color;
          online = u.online;
        }
      }

      return {
        id: c.id,
        name,
        type: c.type,
        initials,
        color,
        online: c.type === 'direct' ? online : undefined,
        members: c.type === 'group' ? c.members.length : undefined,
        last: lastText || 'No messages yet',
        time: lastTime,
        unread: 0, // Mock unread for demo, can be expanded
        pinned: c.pinned,
      };
    });

    // Sort pinned conversations first, then by last message time / update time
    return conversations.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return 0; // maintain database order / updatedAt order
    });
  }

  async getOrCreateDirectConversation(userId: string, targetUserId: string) {
    // 1. Check if direct conversation already exists between userId and targetUserId
    // If targetUserId === userId, it's Saved Messages
    const existing = await this.prisma.conversation.findFirst({
      where: {
        type: 'direct',
        members: {
          every: {
            userId: { in: [userId, targetUserId] }
          }
        }
      },
      include: {
        members: {
          include: {
            user: true
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            author: true
          }
        }
      }
    });

    // Make sure it has correct membership count to distinguish self-chat from regular 2-user direct chat
    const selfChatExpected = userId === targetUserId;
    if (existing) {
      const isSelfChat = existing.members.length === 1;
      if (isSelfChat === selfChatExpected) {
        return this.formatConversationForUser(existing, userId);
      }
    }

    // 2. Create new direct conversation if not exists
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId }
    });
    if (!targetUser) throw new NotFoundException('Target user not found');

    const newConv = await this.prisma.conversation.create({
      data: {
        name: targetUser.name,
        type: 'direct',
        color: targetUser.color || 'bg-chart-2',
        initials: targetUser.initials || 'US',
        pinned: false,
      }
    });

    // Add members
    if (selfChatExpected) {
      await this.prisma.conversationMember.create({
        data: { conversationId: newConv.id, userId }
      });
    } else {
      await this.prisma.conversationMember.createMany({
        data: [
          { conversationId: newConv.id, userId: userId },
          { conversationId: newConv.id, userId: targetUserId }
        ]
      });
    }

    const fullConv = await this.prisma.conversation.findUnique({
      where: { id: newConv.id },
      include: {
        members: {
          include: {
            user: true
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            author: true
          }
        }
      }
    });

    return this.formatConversationForUser(fullConv!, userId);
  }

  private formatConversationForUser(c: any, userId: string) {
    const lastMsg = c.messages?.[0];
    let lastText = '';
    let lastTime = '';
    if (lastMsg) {
      if (c.type === 'group') {
        lastText = `${lastMsg.author.name.split(' ')[0]}: ${lastMsg.text}`;
      } else {
        lastText = lastMsg.text;
      }
      lastTime = this.formatTime(lastMsg.createdAt);
    }

    let name = c.name;
    let initials = c.initials;
    let color = c.color;
    let online = false;

    if (c.type === 'direct') {
      const otherMember = c.members.find((member: any) => member.userId !== userId);
      if (otherMember) {
        const u = otherMember.user;
        name = u.name;
        initials = u.initials;
        color = u.color;
        online = u.online;
      }
    }

    return {
      id: c.id,
      name,
      type: c.type,
      initials,
      color,
      online: c.type === 'direct' ? online : undefined,
      members: c.type === 'group' ? c.members.length : undefined,
      last: lastText || 'No messages yet',
      time: lastTime,
      unread: 0,
      pinned: c.pinned,
    };
  }

  async getMessages(conversationId: string, currentUserId: string) {
    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: {
        author: true,
        replyTo: {
          include: {
            author: true,
          },
        },
        reactions: {
          include: {
            user: true,
          },
        },
      },
    });

    return messages.map((m) => {
      // Group reactions
      const reactionGroups: Record<string, { emoji: string; count: number; reacted: boolean }> = {};
      m.reactions.forEach((r) => {
        if (!reactionGroups[r.emoji]) {
          reactionGroups[r.emoji] = { emoji: r.emoji, count: 0, reacted: false };
        }
        reactionGroups[r.emoji].count += 1;
        if (r.userId === currentUserId) {
          reactionGroups[r.emoji].reacted = true;
        }
      });

      return {
        id: m.id,
        authorId: m.authorId,
        authorName: m.author.name,
        initials: m.author.initials,
        color: m.author.color,
        text: m.text,
        time: this.formatTime(m.createdAt),
        self: m.authorId === currentUserId,
        reactions: Object.values(reactionGroups),
        reactors: m.reactions.map((r) => ({
          userId: r.userId,
          userName: r.user.name,
          initials: r.user.initials,
          color: r.user.color,
          emoji: r.emoji,
        })),
        replyTo: m.replyTo
          ? { author: m.replyTo.author.name, text: m.replyTo.text }
          : undefined,
        pinned: m.pinned,
      };
    });
  }

  async createMessage(conversationId: string, authorId: string, text: string, replyToId?: string) {
    // Save message in DB
    const message = await this.prisma.message.create({
      data: {
        conversationId,
        authorId,
        text,
        replyToId: replyToId || null,
      },
      include: {
        author: true,
        replyTo: {
          include: {
            author: true,
          },
        },
      },
    });

    // Update conversation updatedAt
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return {
      id: message.id,
      authorId: message.authorId,
      authorName: message.author.name,
      initials: message.author.initials,
      color: message.author.color,
      text: message.text,
      time: this.formatTime(message.createdAt),
      self: false, // will be evaluated on client
      reactions: [],
      replyTo: message.replyTo
        ? { author: message.replyTo.author.name, text: message.replyTo.text }
        : undefined,
      pinned: message.pinned,
    };
  }

  async toggleReaction(messageId: string, userId: string, emoji: string) {
    const existingReactions = await this.prisma.reaction.findMany({
      where: { messageId, userId },
    });

    const sameReaction = existingReactions.find((r) => r.emoji === emoji);

    if (existingReactions.length > 0) {
      await this.prisma.reaction.deleteMany({
        where: {
          id: {
            in: existingReactions.map((r) => r.id),
          },
        },
      });
    }

    if (!sameReaction) {
      await this.prisma.reaction.create({
        data: { messageId, userId, emoji },
      });
    }

    // Return the updated list of reactions and reactors for this message
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        reactions: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!message) throw new NotFoundException('Message not found');

    const reactionGroups: Record<string, { emoji: string; count: number; reacted: boolean }> = {};
    message.reactions.forEach((r) => {
      if (!reactionGroups[r.emoji]) {
        reactionGroups[r.emoji] = { emoji: r.emoji, count: 0, reacted: false };
      }
      reactionGroups[r.emoji].count += 1;
      if (r.userId === userId) {
        reactionGroups[r.emoji].reacted = true;
      }
    });

    const reactors = message.reactions.map((r) => ({
      userId: r.userId,
      userName: r.user.name,
      initials: r.user.initials,
      color: r.user.color,
      emoji: r.emoji,
    }));

    return {
      reactions: Object.values(reactionGroups),
      reactors,
    };
  }

  async togglePinMessage(messageId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });
    if (!message) throw new NotFoundException('Message not found');

    return this.prisma.message.update({
      where: { id: messageId },
      data: { pinned: !message.pinned },
    });
  }

  async createGroupConversation(name: string, memberIds: string[], currentUserId: string) {
    const initials = name
      .split(' ')
      .filter(Boolean)
      .map((word) => word[0].toUpperCase())
      .slice(0, 2)
      .join('');

    const colors = ['bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4', 'bg-chart-5'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    const conversation = await this.prisma.conversation.create({
      data: {
        name,
        type: 'group',
        color,
        initials: initials || 'GR',
        pinned: false,
      },
    });

    // Add all specified members
    await this.prisma.conversationMember.createMany({
      data: memberIds.map((userId) => ({
        conversationId: conversation.id,
        userId,
      })),
    });

    const fullConv = await this.prisma.conversation.findUnique({
      where: { id: conversation.id },
      include: {
        members: {
          include: {
            user: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            author: true,
          },
        },
      },
    });

    return this.formatConversationForUser(fullConv!, currentUserId);
  }

  async setUserOnlineStatus(userId: string, online: boolean) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { online },
      select: {
        id: true,
        name: true,
        online: true,
      },
    });
  }

  private formatTime(date: Date): string {
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = new Date(now.setDate(now.getDate() - 1)).toDateString() === date.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    if (isYesterday) {
      return 'Yesterday';
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}
