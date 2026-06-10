import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { NotesService } from './notes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('notes')
export class NotesController {
  constructor(private notesService: NotesService) {}

  @Get()
  async findAll(@Request() req, @Query('category') category?: string) {
    return this.notesService.findAll(req.user.id, category);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.notesService.findOne(id);
  }

  @Post()
  async create(
    @Request() req,
    @Body()
    body: {
      title: string;
      body: string;
      category: string;
      color: string;
      tags?: string[];
      pinned?: boolean;
    },
  ) {
    return this.notesService.create(req.user.id, body);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      body?: string;
      category?: string;
      color?: string;
      tags?: string[];
      pinned?: boolean;
    },
  ) {
    return this.notesService.update(id, body);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.notesService.delete(id);
  }

  @Patch(':id/pin')
  async togglePin(@Param('id') id: string) {
    return this.notesService.togglePin(id);
  }
}
