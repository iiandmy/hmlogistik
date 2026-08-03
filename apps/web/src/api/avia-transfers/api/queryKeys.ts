import type { GetAviaTransfersParams } from '../types';

export const aviaTransferKeys = {
    all: ['avia-transfers'] as const,
    list: (params: GetAviaTransfersParams = {}) => ['avia-transfers', 'list', params] as const,
    detail: (id: string) => ['avia-transfers', 'detail', id] as const,
};
