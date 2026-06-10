import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { UseGuards, Logger } from '@nestjs/common';
import { WsJwtGuard } from '../auth/ws-jwt.guard';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  
  // Track active connection timeouts for user offline statuses
  private offlineTimeouts = new Map<string, NodeJS.Timeout>();

  constructor(
    private chatService: ChatService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const authHeader = client.handshake.headers.authorization || client.handshake.auth?.token;
      if (!authHeader) {
        client.disconnect();
        return;
      }

      const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
      const secret = this.configService.get<string>('JWT_SECRET');
      const payload = this.jwtService.verify(token, { secret });
      
      client['user'] = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
      };

      const userId = payload.sub;
      this.logger.log(`Client connected: ${userId} (${client.id})`);

      // Clear any pending offline timeout for this user
      if (this.offlineTimeouts.has(userId)) {
        clearTimeout(this.offlineTimeouts.get(userId));
        this.offlineTimeouts.delete(userId);
      }

      // Set user online
      await this.chatService.setUserOnlineStatus(userId, true);
      this.server.emit('user_status', { userId, online: true });

      // Join client to their personal room
      client.join(`user_${userId}`);
    } catch (err) {
      this.logger.warn(`Connection validation failed: ${err.message}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const user = client['user'];
    if (!user) return;

    const userId = user.id;
    this.logger.log(`Client disconnected: ${userId} (${client.id})`);

    // Set offline after a short delay to handle page refreshes / navigation smoothly
    const timeout = setTimeout(async () => {
      await this.chatService.setUserOnlineStatus(userId, false);
      this.server.emit('user_status', { userId, online: false });
      this.offlineTimeouts.delete(userId);
    }, 5000);

    this.offlineTimeouts.set(userId, timeout);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('join_conversation')
  handleJoinConversation(
    @MessageBody('conversationId') conversationId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`conversation_${conversationId}`);
    this.logger.log(`User ${client['user'].id} joined room conversation_${conversationId}`);
    return { status: 'joined', conversationId };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('leave_conversation')
  handleLeaveConversation(
    @MessageBody('conversationId') conversationId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`conversation_${conversationId}`);
    this.logger.log(`User ${client['user'].id} left room conversation_${conversationId}`);
    return { status: 'left', conversationId };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody() data: { conversationId: string; text: string; replyToId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client['user'];
    const message = await this.chatService.createMessage(
      data.conversationId,
      user.id,
      data.text,
      data.replyToId,
    );

    // Broadcast message to everyone in the conversation (including sender)
    this.server.to(`conversation_${data.conversationId}`).emit('new_message', {
      conversationId: data.conversationId,
      message,
    });

    // Also trigger update conversation lists for real-time order adjustment
    this.server.emit('conversation_update', {
      conversationId: data.conversationId,
      lastMessage: message,
    });

    return message;
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: { conversationId: string; isTyping: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client['user'];
    
    // Broadcast typing indicator to everyone else in the conversation
    client.to(`conversation_${data.conversationId}`).emit('user_typing', {
      conversationId: data.conversationId,
      userId: user.id,
      name: user.name,
      isTyping: data.isTyping,
    });
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('toggle_reaction')
  async handleToggleReaction(
    @MessageBody() data: { messageId: string; emoji: string; conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client['user'];
    const result = await this.chatService.toggleReaction(
      data.messageId,
      user.id,
      data.emoji,
    );

    // Broadcast reaction updates to the room
    this.server.to(`conversation_${data.conversationId}`).emit('reaction_update', {
      messageId: data.messageId,
      reactions: result.reactions,
      reactors: result.reactors,
    });

    return result.reactions;
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('toggle_pin')
  async handleTogglePin(
    @MessageBody() data: { messageId: string; conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const message = await this.chatService.togglePinMessage(data.messageId);
    
    // Broadcast pin event
    this.server.to(`conversation_${data.conversationId}`).emit('pin_update', {
      messageId: data.messageId,
      pinned: message.pinned,
      text: message.text,
    });

    return message;
  }
}
