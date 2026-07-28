import { jest } from '@jest/globals';

/**
 * Mock for @hmlogistik/database package.
 * Jest cannot parse the ESM dist output of this package,
 * so we redirect imports to this CommonJS-compatible mock.
 */

export class PrismaClient {
    $connect(): Promise<void> {
        return Promise.resolve();
    }

    $disconnect(): Promise<void> {
        return Promise.resolve();
    }

    $on(): PrismaClient {
        return this;
    }

    $use(): PrismaClient {
        return this;
    }

    $transaction(fn: (client: PrismaClient) => Promise<unknown>): Promise<unknown> {
        return Promise.resolve(fn(this));
    }

    transfer = createModelMock();
    transferFile = createModelMock();
}

function createModelMock(): Record<string, jest.Mock> {
    return {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        count: jest.fn(),
        upsert: jest.fn(),
    };
}

export const Prisma = {
    ModelName: {
        Transfer: 'Transfer' as const,
        TransferFile: 'TransferFile' as const,
    },
};
