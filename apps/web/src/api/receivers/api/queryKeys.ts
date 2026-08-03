import type { GetReceiversParams } from '../types';

export const receiverKeys = {
    all: ['receivers'] as const,
    list: (params: GetReceiversParams = {}) => ['receivers', 'list', params] as const,
    detail: (id: string) => ['receivers', 'detail', id] as const,
};
