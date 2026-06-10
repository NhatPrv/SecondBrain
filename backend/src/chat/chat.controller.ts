import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Get('conversations')
  async getConversations(@Request() req) {
    return this.chatService.getConversations(req.user.id);
  }

  @Post('conversations/direct')
  async getOrCreateDirectConversation(@Body('targetUserId') targetUserId: string, @Request() req) {
    return this.chatService.getOrCreateDirectConversation(req.user.id, targetUserId);
  }

  @Post('conversations/group')
  async createGroup(
    @Body('name') name: string,
    @Body('memberIds') memberIds: string[],
    @Request() req
  ) {
    const allMembers = Array.from(new Set([...memberIds, req.user.id]));
    return this.chatService.createGroupConversation(name, allMembers, req.user.id);
  }

  @Get('conversations/:id/messages')
  async getMessages(@Param('id') conversationId: string, @Request() req) {
    return this.chatService.getMessages(conversationId, req.user.id);
  }
}
