import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotesService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, category?: string) {
    const whereClause: any = { userId };
    
    if (category && category !== 'All Notes') {
      whereClause.category = category;
    }

    return this.prisma.note.findMany({
      where: whereClause,
      orderBy: [
        { pinned: 'desc' },
        { updatedAt: 'desc' },
      ],
    });
  }

  async findOne(id: string) {
    const note = await this.prisma.note.findUnique({
      where: { id },
    });
    if (!note) {
      throw new NotFoundException('Note not found');
    }
    return note;
  }

  async create(
    userId: string,
    data: { title: string; body: string; category: string; color: string; tags?: string[]; pinned?: boolean },
  ) {
    return this.prisma.note.create({
      data: {
        title: data.title || 'Untitled',
        body: data.body || '',
        category: data.category || 'Personal',
        color: data.color || 'bg-chart-1',
        tags: data.tags || [],
        pinned: data.pinned || false,
        userId,
      },
    });
  }

  async update(
    id: string,
    data: { title?: string; body?: string; category?: string; color?: string; tags?: string[]; pinned?: boolean },
  ) {
    const note = await this.prisma.note.findUnique({
      where: { id },
    });
    if (!note) throw new NotFoundException('Note not found');

    return this.prisma.note.update({
      where: { id },
      data: {
        title: data.title !== undefined ? data.title : note.title,
        body: data.body !== undefined ? data.body : note.body,
        category: data.category !== undefined ? data.category : note.category,
        color: data.color !== undefined ? data.color : note.color,
        tags: data.tags !== undefined ? data.tags : note.tags,
        pinned: data.pinned !== undefined ? data.pinned : note.pinned,
      },
    });
  }

  async delete(id: string) {
    const note = await this.prisma.note.findUnique({
      where: { id },
    });
    if (!note) throw new NotFoundException('Note not found');

    await this.prisma.note.delete({
      where: { id },
    });
    return { success: true };
  }

  async togglePin(id: string) {
    const note = await this.prisma.note.findUnique({
      where: { id },
    });
    if (!note) throw new NotFoundException('Note not found');

    return this.prisma.note.update({
      where: { id },
      data: { pinned: !note.pinned },
    });
  }
}
