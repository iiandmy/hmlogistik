import type { Buffer } from 'node:buffer';

export interface TransferFileResponse {
    id: number;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    createdAt: string;
    downloadUrl: string;
}

export interface UploadedFile {
    buffer: Buffer;
    originalName: string;
    mimeType: string;
    size: number;
}
