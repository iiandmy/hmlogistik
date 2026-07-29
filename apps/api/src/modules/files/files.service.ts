import { MinioService } from '../../providers/minio/minio.service';
import { PrismaService } from '../../providers/prisma/prisma.service';
import type {
    TransferFileResponse,
    UploadedFile,
} from './interfaces/transfer-file-response.interface';
import { randomUUID } from 'node:crypto';
import { Injectable, NotFoundException } from '@nestjs/common';

const MAX_FILES_PER_ENTITY = 10;
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
const SIGNED_URL_TTL_SECONDS = 60;
const ALLOWED_MIME_TYPES = new Set([
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

@Injectable()
export class FilesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly minio: MinioService,
    ) {}

    validateFiles(files: UploadedFile[]): string | null {
        if (files.length > MAX_FILES_PER_ENTITY) {
            return `A transfer can include at most ${MAX_FILES_PER_ENTITY} files.`;
        }

        for (const file of files) {
            if (file.size > MAX_FILE_SIZE_BYTES) {
                return `File "${file.originalName}" exceeds the maximum size of 20MB.`;
            }
            if (!ALLOWED_MIME_TYPES.has(file.mimeType)) {
                return `File "${file.originalName}" has unsupported type "${file.mimeType}".`;
            }
        }

        return null;
    }

    private buildStoragePath(
        entityType: string,
        entityId: number,
        originalName: string,
    ): string {
        const sanitized = originalName.trim().replaceAll(/[^\w.-]/g, '_') || 'file';
        return `${entityType}s/${entityId}/${randomUUID()}-${sanitized}`;
    }

    async uploadFiles(
        entityType: string,
        entityId: number,
        files: UploadedFile[],
    ): Promise<void> {
        if (files.length === 0) {
            return;
        }

        const uploadedPaths: string[] = [];
        const metadataRows: Array<{
            transferId: bigint;
            storagePath: string;
            originalName: string;
            mimeType: string;
            sizeBytes: bigint;
        }> = [];

        try {
            for (const file of files) {
                const storagePath = this.buildStoragePath(
                    entityType,
                    entityId,
                    file.originalName,
                );
                await this.minio.upload(file.buffer, storagePath, file.mimeType);
                uploadedPaths.push(storagePath);
                metadataRows.push({
                    transferId: BigInt(entityId),
                    storagePath,
                    originalName: file.originalName,
                    mimeType: file.mimeType,
                    sizeBytes: BigInt(file.size),
                });
            }

            await this.prisma.transferFile.createMany({ data: metadataRows });
        }
        catch (error) {
            // Cleanup uploaded files on failure
            if (uploadedPaths.length > 0) {
                await this.minio.deleteMultiple(uploadedPaths).catch(() => {});
            }
            throw error;
        }
    }

    async getFilesByEntity(
        entityType: string,
        entityId: number,
    ): Promise<TransferFileResponse[]> {
        const rows = await this.prisma.transferFile.findMany({
            where: { transferId: BigInt(entityId) },
            orderBy: { createdAt: 'desc' },
        });

        const response: TransferFileResponse[] = [];

        for (const row of rows) {
            const downloadUrl = await this.minio.getSignedUrl(
                row.storagePath,
                SIGNED_URL_TTL_SECONDS,
            );

            response.push({
                id: Number(row.id),
                originalName: row.originalName,
                mimeType: row.mimeType,
                sizeBytes: Number(row.sizeBytes),
                createdAt: row.createdAt.toISOString(),
                downloadUrl,
            });
        }

        return response;
    }

    async deleteFilesByIds(
        entityType: string,
        entityId: number,
        fileIds: number[],
    ): Promise<void> {
        if (fileIds.length === 0) {
            return;
        }

        const rows = await this.prisma.transferFile.findMany({
            where: {
                id: { in: fileIds.map(id => BigInt(id)) },
                transferId: BigInt(entityId),
            },
            select: { id: true, storagePath: true },
        });

        if (rows.length !== fileIds.length) {
            throw new NotFoundException(
                'Some files were not found for this transfer.',
            );
        }

        const storagePaths = rows.map(row => row.storagePath);

        await this.minio.deleteMultiple(storagePaths);

        await this.prisma.transferFile.deleteMany({
            where: {
                id: { in: rows.map(row => row.id) },
            },
        });
    }

    async countFilesByEntity(entityId: number): Promise<number> {
        return this.prisma.transferFile.count({
            where: { transferId: BigInt(entityId) },
        });
    }
}
