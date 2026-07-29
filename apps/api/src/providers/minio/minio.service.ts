import type { OnModuleDestroy } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

@Injectable()
export class MinioService implements OnModuleDestroy {
    private readonly client: Minio.Client;
    private readonly defaultBucket: string;

    constructor(private readonly configService: ConfigService) {
        const endpoint = this.configService.get<string>('minio.endpoint')!;
        const port = this.configService.get<number>('minio.port')!;
        const accessKey = this.configService.get<string>('minio.accessKey')!;
        const secretKey = this.configService.get<string>('minio.secretKey')!;
        const useSSL = this.configService.get<boolean>('minio.useSSL')!;
        this.defaultBucket = this.configService.get<string>('minio.bucket')!;

        this.client = new Minio.Client({
            endPoint: endpoint,
            port,
            accessKey,
            secretKey,
            useSSL,
        });
    }

    async onModuleDestroy(): Promise<void> {
    // Minio.Client doesn't have a close/disconnect method in the current API
    }

    async ensureBucket(bucket: string = this.defaultBucket): Promise<void> {
        const exists = await this.client.bucketExists(bucket);
        if (!exists) {
            await this.client.makeBucket(bucket);
        }
    }

    async upload(
        buffer: Buffer,
        objectPath: string,
        mimeType: string,
        bucket: string = this.defaultBucket,
    ): Promise<void> {
        await this.ensureBucket(bucket);
        await this.client.putObject(bucket, objectPath, buffer, buffer.length, {
            'Content-Type': mimeType,
        });
    }

    async getSignedUrl(
        objectPath: string,
        ttlSeconds: number = 60,
        bucket: string = this.defaultBucket,
    ): Promise<string> {
        return this.client.presignedGetObject(bucket, objectPath, ttlSeconds);
    }

    async delete(
        objectPath: string,
        bucket: string = this.defaultBucket,
    ): Promise<void> {
        await this.client.removeObject(bucket, objectPath);
    }

    async deleteMultiple(
        objectPaths: string[],
        bucket: string = this.defaultBucket,
    ): Promise<void> {
        if (objectPaths.length === 0) {
            return;
        }
        await this.client.removeObjects(bucket, objectPaths);
    }
}
