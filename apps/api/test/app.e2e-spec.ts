import type { INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, it, jest } from '@jest/globals';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { MinioService } from './../src/providers/minio/minio.service';
import { PrismaService } from './../src/providers/prisma/prisma.service';

describe('App (e2e)', () => {
    let app: INestApplication;

    const mockPrismaService = {
        $connect: jest.fn<() => Promise<void>>(),
        $disconnect: jest.fn<() => Promise<void>>(),
        $on: jest.fn(),
        $use: jest.fn(),
        $transaction: jest.fn(),
        transfer: {
            findMany: jest.fn<() => Promise<unknown[]>>().mockResolvedValue([]),
            findUnique: jest.fn<() => Promise<null>>().mockResolvedValue(null),
            findFirst: jest.fn<() => Promise<null>>().mockResolvedValue(null),
            create: jest.fn<() => Promise<object>>().mockResolvedValue({}),
            update: jest.fn<() => Promise<object>>().mockResolvedValue({}),
            delete: jest.fn<() => Promise<object>>().mockResolvedValue({}),
            count: jest.fn<() => Promise<number>>().mockResolvedValue(0),
        },
        aviaTransfer: {
            findMany: jest.fn<() => Promise<unknown[]>>().mockResolvedValue([]),
            findUnique: jest.fn<() => Promise<null>>().mockResolvedValue(null),
            findFirst: jest.fn<() => Promise<null>>().mockResolvedValue(null),
            create: jest.fn<() => Promise<object>>().mockResolvedValue({}),
            update: jest.fn<() => Promise<object>>().mockResolvedValue({}),
            delete: jest.fn<() => Promise<object>>().mockResolvedValue({}),
            count: jest.fn<() => Promise<number>>().mockResolvedValue(0),
        },
        transferFile: {
            findMany: jest.fn<() => Promise<unknown[]>>().mockResolvedValue([]),
            findUnique: jest.fn<() => Promise<null>>().mockResolvedValue(null),
            findFirst: jest.fn<() => Promise<null>>().mockResolvedValue(null),
            create: jest.fn<() => Promise<object>>().mockResolvedValue({}),
            update: jest.fn<() => Promise<object>>().mockResolvedValue({}),
            delete: jest.fn<() => Promise<object>>().mockResolvedValue({}),
            count: jest.fn<() => Promise<number>>().mockResolvedValue(0),
        },
    };

    const mockMinioService = {
        ensureBucket: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
        upload: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
        getSignedUrl: jest
            .fn<() => Promise<string>>()
            .mockResolvedValue('http://mock-signed-url'),
        delete: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
        deleteMultiple: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    };

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider(PrismaService)
            .useValue(mockPrismaService)
            .overrideProvider(MinioService)
            .useValue(mockMinioService)
            .compile();

        app = moduleFixture.createNestApplication();
        app.setGlobalPrefix('api');
        await app.init();
    });

    it('GET /api/transfers returns 200', () => {
        return request(app.getHttpServer()).get('/api/transfers').expect(200);
    });

    it('GET /api/transfers accepts supported query params', () => {
        return request(app.getHttpServer())
            .get('/api/transfers')
            .query({
                page: '1',
                limit: '10',
                sortBy: 'createdAt',
                order: 'desc',
                q: 'test',
            })
            .expect(200);
    });

    it('GET /api/avia-transfers returns 200', () => {
        return request(app.getHttpServer()).get('/api/avia-transfers').expect(200);
    });

    it('GET /api/avia-transfers accepts supported query params', () => {
        return request(app.getHttpServer())
            .get('/api/avia-transfers')
            .query({
                page: '1',
                limit: '10',
                sortBy: 'departedAt',
                order: 'desc',
                q: 'test',
            })
            .expect(200);
    });

    afterEach(async () => {
        await app.close();
    });
});
