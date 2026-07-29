import type { GetTransfersParams } from '../types';

export const transferKeys = {
    all: ['transfers'] as const,
    list: (params: GetTransfersParams) => ['transfers', 'list', params] as const,
    detail: (id: string) => ['transfers', 'detail', id] as const,
};
