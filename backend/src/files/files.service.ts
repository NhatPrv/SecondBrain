import { Injectable, Logger, OnModuleInit, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { google, drive_v3 } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';
import { Response } from 'express';

@Injectable()
export class FilesService implements OnModuleInit {
  private readonly logger = new Logger(FilesService.name);
  private driveClient: drive_v3.Drive | null = null;
  private useGoogleDrive = false;
  private driveFolderId = '';
  private localUploadDir = '';
  // Cache per-user Google Drive folder IDs: userId -> driveId
  private userFolderCache: Map<string, string> = new Map();

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.localUploadDir = path.join(process.cwd(), 'uploads');
  }

  async onModuleInit() {
    // Ensure local upload directory exists
    if (!fs.existsSync(this.localUploadDir)) {
      fs.mkdirSync(this.localUploadDir, { recursive: true });
    }

    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    const refreshToken = this.configService.get<string>('GOOGLE_REFRESH_TOKEN');
    this.driveFolderId = this.configService.get<string>('GOOGLE_DRIVE_FOLDER_ID') || '';

    // Prioritize OAuth2 Credentials (using the user's account directly)
    if (clientId && clientSecret && refreshToken) {
      try {
        const oauth2Client = new google.auth.OAuth2(
          clientId,
          clientSecret,
          'http://localhost:3005/oauth2callback'
        );

        oauth2Client.setCredentials({
          refresh_token: refreshToken,
        });

        this.driveClient = google.drive({ version: 'v3', auth: oauth2Client });
        this.useGoogleDrive = true;
        this.logger.log('Google Drive API client initialized successfully using OAuth2.');

        // Search for the "SecondBrain" folder if ID is not set
        if (!this.driveFolderId) {
          this.logger.log('GOOGLE_DRIVE_FOLDER_ID not set. Searching for folder "SecondBrain"...');
          await this.discoverFolderId();
        }
      } catch (err) {
        this.logger.error('Failed to initialize Google Drive OAuth2 client: ' + err.message);
        this.logger.warn('Falling back to checking Service Account.');
      }
    }

    // Fallback to Service Account if OAuth2 initialization was not successful/provided
    if (!this.useGoogleDrive) {
      const clientEmail = this.configService.get<string>('GOOGLE_SERVICE_ACCOUNT_EMAIL');
      let privateKey = this.configService.get<string>('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY');

      if (clientEmail && privateKey) {
        try {
          privateKey = privateKey.replace(/\\n/g, '\n');

          const auth = new google.auth.JWT(
            clientEmail,
            null,
            privateKey,
            ['https://www.googleapis.com/auth/drive'],
          );

          this.driveClient = google.drive({ version: 'v3', auth });
          this.useGoogleDrive = true;
          this.logger.log('Google Drive API client initialized successfully using Service Account.');

          if (!this.driveFolderId) {
            this.logger.log('GOOGLE_DRIVE_FOLDER_ID not set. Searching for folder "SecondBrain"...');
            await this.discoverFolderId();
          }
        } catch (err) {
          this.logger.error('Failed to initialize Google Drive JWT client: ' + err.message);
          this.logger.warn('Falling back to local disk storage mode.');
        }
      } else {
        this.logger.warn('Google Drive credentials not provided. Running in local fallback mode.');
      }
    }
  }

  private async discoverFolderId() {
    if (!this.driveClient) return;
    try {
      const response = await this.driveClient.files.list({
        q: "mimeType = 'application/vnd.google-apps.folder' and name = 'SecondBrain' and trashed = false",
        fields: 'files(id, name)',
        spaces: 'drive',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });
      const files = response.data.files;
      if (files && files.length > 0) {
        this.driveFolderId = files[0].id || '';
        this.logger.log(`Found folder "SecondBrain" with ID: ${this.driveFolderId}`);
      } else {
        this.logger.warn('Could not find folder "SecondBrain" in Google Drive. Files will be uploaded to root directory.');
      }
    } catch (err) {
      this.logger.error(`Error searching for folder "SecondBrain": ${err.message}`);
    }
  }

  async getItems(parentId: string | null, userId: string, query?: string) {
    let whereClause: any = {
      userId: userId,
    };
    
    if (parentId !== 'all') {
      whereClause.parentId = parentId;
    }
    
    // If a search query is provided, search globally across all files for this user
    if (query && query.trim() !== '') {
      whereClause.name = {
        contains: query,
        mode: 'insensitive',
      };
      // Remove parentId filter when searching globally
      delete whereClause.parentId;
    }

    const items = await this.prisma.driveItem.findMany({
      where: whereClause,
      orderBy: [
        { kind: 'asc' }, // Folders first
        { name: 'asc' },
      ],
    });

    return items;
  }

  async createFolder(name: string, parentId: string | null, userId: string) {
    let googleDriveId: string | null = null;

    if (this.useGoogleDrive && this.driveClient) {
      try {
        // Resolve parent Drive ID:
        // - If parentId is set, find its Drive ID (fallback to user folder)
        // - If parentId is null (root level), use the user's personal folder
        let resolvedParent: string;
        if (parentId) {
          resolvedParent = await this.getGoogleDriveId(parentId);
        } else {
          resolvedParent = await this.getOrCreateUserFolder(userId);
        }

        const fileMetadata: any = {
          name,
          mimeType: 'application/vnd.google-apps.folder',
        };
        if (resolvedParent) {
          fileMetadata.parents = [resolvedParent];
        }

        const folder = await this.driveClient.files.create({
          requestBody: fileMetadata,
          fields: 'id',
          supportsAllDrives: true,
        });

        googleDriveId = folder.data.id || null;
        this.logger.log(`Created folder in Google Drive. Folder ID: ${googleDriveId}`);
      } catch (err) {
        this.logger.error(`Failed to create folder in Google Drive: ${err.message}`);
      }
    }

    return this.prisma.driveItem.create({
      data: {
        name,
        kind: 'folder',
        modified: this.formatModifiedDate(new Date()),
        parentId,
        googleDriveId,
        userId,
      },
    });
  }

  async getStorageUsage(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { storageLimit: true },
    });

    const limitBytes = user?.storageLimit ?? 107374182400; // default 100GB

    const usage = await this.prisma.driveItem.aggregate({
      where: {
        userId,
        kind: { not: 'folder' },
      },
      _sum: {
        sizeBytes: true,
      },
    });

    const usedBytes = usage._sum.sizeBytes ?? 0;

    return {
      usedBytes,
      limitBytes,
      percentage: limitBytes > 0 ? (usedBytes / limitBytes) * 100 : 0,
    };
  }

  async uploadFile(file: Express.Multer.File, parentId: string | null, userId: string) {
    // Check storage limits first
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { storageLimit: true },
    });
    const limitBytes = user?.storageLimit ?? 107374182400; // default 100GB

    const usage = await this.prisma.driveItem.aggregate({
      where: {
        userId,
        kind: { not: 'folder' },
      },
      _sum: {
        sizeBytes: true,
      },
    });
    const usedBytes = usage._sum.sizeBytes ?? 0;

    if (usedBytes + file.size > limitBytes) {
      throw new BadRequestException(
        `Vượt quá giới hạn dung lượng lưu trữ cho phép! Bạn đã dùng ${this.formatSize(usedBytes)} / ${this.formatSize(limitBytes)}.`
      );
    }

    let googleDriveId: string | null = null;
    const kind = this.guessKind(file.originalname);
    const sizeStr = this.formatSize(file.size);

    if (this.useGoogleDrive && this.driveClient) {
      try {
        // Resolve parent Drive ID:
        // - If parentId is set, find its Drive ID (fallback to user folder)
        // - If parentId is null (root level), use the user's personal folder
        let resolvedParent: string;
        if (parentId) {
          resolvedParent = await this.getGoogleDriveId(parentId);
        } else {
          resolvedParent = await this.getOrCreateUserFolder(userId);
        }

        const fileMetadata: any = {
          name: file.originalname,
        };
        if (resolvedParent) {
          fileMetadata.parents = [resolvedParent];
        }

        const media = {
          mimeType: file.mimetype,
          body: Readable.from(file.buffer),
        };

        const driveFile = await this.driveClient.files.create({
          requestBody: fileMetadata,
          media: media,
          fields: 'id',
          supportsAllDrives: true,
        });

        googleDriveId = driveFile.data.id || null;
        this.logger.log(`Uploaded file to Google Drive. File ID: ${googleDriveId}`);
      } catch (err) {
        this.logger.error(`Google Drive upload failed: ${err.message}. Saving locally.`);
        googleDriveId = null;
      }
    }

    // Local fallback: write to disk if not uploaded to Google Drive
    if (!googleDriveId) {
      const filename = `${Date.now()}-${file.originalname}`;
      const filepath = path.join(this.localUploadDir, filename);
      fs.writeFileSync(filepath, file.buffer);
      googleDriveId = filename; // We use the filename as local storage ID
    }

    return this.prisma.driveItem.create({
      data: {
        name: file.originalname,
        kind,
        size: sizeStr,
        sizeBytes: file.size,
        modified: 'Just now',
        parentId,
        googleDriveId,
        userId,
      },
    });
  }

  async downloadFile(id: string, res: Response) {
    const item = await this.prisma.driveItem.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException('File not found');
    }
    if (item.kind === 'folder') {
      throw new BadRequestException('Cannot download a folder');
    }

    const driveId = item.googleDriveId;

    if (this.useGoogleDrive && this.driveClient && driveId && !driveId.includes('-')) {
      try {
        const fileMeta = await this.driveClient.files.get({
          fileId: driveId,
          fields: 'name, mimeType',
          supportsAllDrives: true,
        });

        res.setHeader('Content-Type', fileMeta.data.mimeType || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${item.name}"`);

        const driveResponse = await this.driveClient.files.get(
          { fileId: driveId, alt: 'media', supportsAllDrives: true },
          { responseType: 'stream' },
        );

        (driveResponse.data as Readable).pipe(res);
        return;
      } catch (err) {
        this.logger.error(`Google Drive download failed: ${err.message}. Checking local backup.`);
      }
    }

    // Local fallback download
    if (driveId) {
      const filepath = path.join(this.localUploadDir, driveId);
      if (fs.existsSync(filepath)) {
        res.setHeader('Content-Disposition', `attachment; filename="${item.name}"`);
        const filestream = fs.createReadStream(filepath);
        filestream.pipe(res);
        return;
      }
    }

    throw new NotFoundException('File data not found in either Google Drive or local storage');
  }

  async deleteItem(id: string) {
    const item = await this.prisma.driveItem.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    await this.deleteItemRecursive(item);
    return { success: true };
  }

  private async deleteItemRecursive(item: any) {
    if (item.kind === 'folder') {
      // Find all children
      const children = await this.prisma.driveItem.findMany({
        where: { parentId: item.id },
      });

      for (const child of children) {
        await this.deleteItemRecursive(child);
      }
    }

    const driveId = item.googleDriveId;

    // Delete physically
    if (this.useGoogleDrive && this.driveClient && driveId && !driveId.includes('-')) {
      try {
        await this.driveClient.files.delete({ fileId: driveId, supportsAllDrives: true });
      } catch (err) {
        this.logger.error(`Failed to delete file from Google Drive: ${err.message}`);
      }
    } else if (driveId) {
      // Local fallback file deletion
      const filepath = path.join(this.localUploadDir, driveId);
      if (fs.existsSync(filepath)) {
        try {
          fs.unlinkSync(filepath);
        } catch (err) {
          this.logger.error(`Failed to delete local file: ${err.message}`);
        }
      }
    }

    // Delete database entry
    await this.prisma.driveItem.delete({
      where: { id: item.id },
    });
  }

  async renameItem(id: string, name: string) {
    const item = await this.prisma.driveItem.findUnique({
      where: { id },
    });
    if (!item) throw new NotFoundException('Item not found');

    const driveId = item.googleDriveId;

    if (this.useGoogleDrive && this.driveClient && driveId && !driveId.includes('-')) {
      try {
        await this.driveClient.files.update({
          fileId: driveId,
          requestBody: { name },
          supportsAllDrives: true,
        });
      } catch (err) {
        this.logger.error(`Failed to rename file in Google Drive: ${err.message}`);
      }
    }

    return this.prisma.driveItem.update({
      where: { id },
      data: { name },
    });
  }

  async moveItem(id: string, targetFolderId: string | null) {
    const item = await this.prisma.driveItem.findUnique({
      where: { id },
    });
    if (!item) throw new NotFoundException('Item not found');

    const driveId = item.googleDriveId;

    if (this.useGoogleDrive && this.driveClient && driveId && !driveId.includes('-')) {
      try {
        const newParentDriveId = targetFolderId 
          ? await this.getGoogleDriveId(targetFolderId) 
          : this.driveFolderId;
          
        // Retrieve current parents to remove them
        const file = await this.driveClient.files.get({
          fileId: driveId,
          fields: 'parents',
          supportsAllDrives: true,
        });
        const previousParents = file.data.parents?.join(',') || '';

        await this.driveClient.files.update({
          fileId: driveId,
          addParents: newParentDriveId || undefined,
          removeParents: previousParents || undefined,
          fields: 'id, parents',
          supportsAllDrives: true,
        });
      } catch (err) {
        this.logger.error(`Failed to move file in Google Drive: ${err.message}`);
      }
    }

    return this.prisma.driveItem.update({
      where: { id },
      data: { parentId: targetFolderId },
    });
  }

  async toggleStar(id: string) {
    const item = await this.prisma.driveItem.findUnique({
      where: { id },
    });
    if (!item) throw new NotFoundException('Item not found');

    return this.prisma.driveItem.update({
      where: { id },
      data: { starred: !item.starred },
    });
  }

  private async getGoogleDriveId(databaseId: string): Promise<string> {
    const item = await this.prisma.driveItem.findUnique({
      where: { id: databaseId },
    });
    // If the DB item has no googleDriveId (e.g. seeded mock data),
    // fallback to the root shared folder so uploads still land on Drive
    return item?.googleDriveId || this.driveFolderId;
  }

  /**
   * Find or create a personal folder for the user inside the root "SecondBrain/" folder.
   * Structure: SecondBrain/ → <UserName>/
   * Results are cached in memory so we only query/create once per server lifecycle.
   */
  private async getOrCreateUserFolder(userId: string): Promise<string> {
    // Check cache first
    if (this.userFolderCache.has(userId)) {
      return this.userFolderCache.get(userId)!;
    }

    if (!this.driveClient || !this.driveFolderId) {
      return this.driveFolderId;
    }

    // Lookup user name from database
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const folderName = user?.name || userId;

    try {
      // Search for existing folder with this name inside SecondBrain/
      const searchResult = await this.driveClient.files.list({
        q: `mimeType = 'application/vnd.google-apps.folder' and name = '${folderName.replace(/'/g, "\\'")}' and '${this.driveFolderId}' in parents and trashed = false`,
        fields: 'files(id, name)',
        spaces: 'drive',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });

      const existingFolders = searchResult.data.files;
      if (existingFolders && existingFolders.length > 0) {
        const folderId = existingFolders[0].id!;
        this.userFolderCache.set(userId, folderId);
        this.logger.log(`Found existing user folder "${folderName}" with ID: ${folderId}`);
        return folderId;
      }

      // Create a new personal folder inside SecondBrain/
      const newFolder = await this.driveClient.files.create({
        requestBody: {
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [this.driveFolderId],
        },
        fields: 'id',
        supportsAllDrives: true,
      });

      const newFolderId = newFolder.data.id!;
      this.userFolderCache.set(userId, newFolderId);
      this.logger.log(`Created new user folder "${folderName}" with ID: ${newFolderId}`);
      return newFolderId;
    } catch (err) {
      this.logger.error(`Failed to get/create user folder for "${folderName}": ${err.message}`);
      // Fallback to root SecondBrain folder
      return this.driveFolderId;
    }
  }

  private guessKind(name: string): string {
    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'].includes(ext)) return 'image';
    if (ext === 'pdf') return 'pdf';
    if (['doc', 'docx', 'txt', 'rtf'].includes(ext)) return 'doc';
    if (['xls', 'xlsx', 'csv', 'sheet'].includes(ext)) return 'sheet';
    if (['mp4', 'mov', 'webm', 'avi'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'm4a', 'aac'].includes(ext)) return 'audio';
    return 'file';
  }

  private formatSize(bytes: number): string {
    if (!bytes) return '0 KB';
    const kb = bytes / 1024;
    if (kb < 1024) return `${Math.max(1, Math.round(kb))} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  }

  private formatModifiedDate(date: Date): string {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}
