import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Response } from 'express';

@UseGuards(JwtAuthGuard)
@Controller('files')
export class FilesController {
  constructor(private filesService: FilesService) {}

  @Get('storage')
  async getStorageUsage(@Request() req) {
    return this.filesService.getStorageUsage(req.user.id);
  }

  @Get()
  async getItems(
    @Query('parentId') parentId: string,
    @Query('query') query: string,
    @Request() req,
  ) {
    let parent: string | null = null;
    if (parentId === 'all') {
      parent = 'all';
    } else if (parentId && parentId !== 'null' && parentId !== 'undefined') {
      parent = parentId;
    }
    return this.filesService.getItems(parent, req.user.id, query);
  }

  @Post('folder')
  async createFolder(
    @Body('name') name: string,
    @Body('parentId') parentId: string,
    @Request() req,
  ) {
    const parent = parentId === 'null' || !parentId ? null : parentId;
    return this.filesService.createFolder(name, parent, req.user.id);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('parentId') parentId: string,
    @Request() req,
  ) {
    const parent = parentId === 'null' || !parentId ? null : parentId;
    return this.filesService.uploadFile(file, parent, req.user.id);
  }

  @Get('download/:id')
  async downloadFile(@Param('id') id: string, @Res() res: Response) {
    return this.filesService.downloadFile(id, res);
  }

  @Delete(':id')
  async deleteItem(@Param('id') id: string) {
    return this.filesService.deleteItem(id);
  }

  @Patch(':id/rename')
  async renameItem(@Param('id') id: string, @Body('name') name: string) {
    return this.filesService.renameItem(id, name);
  }

  @Patch(':id/move')
  async moveItem(@Param('id') id: string, @Body('targetFolderId') targetFolderId: string) {
    const target = targetFolderId === 'null' || !targetFolderId ? null : targetFolderId;
    return this.filesService.moveItem(id, target);
  }

  @Patch(':id/star')
  async toggleStar(@Param('id') id: string) {
    return this.filesService.toggleStar(id);
  }
}
