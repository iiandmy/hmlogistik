import type { GetTransportersParams } from '../types';

export const transporterKeys = {
    all: ['transporters'] as const,
    list: (params: GetTransportersParams = {}) => ['transporters', 'list', params] as const,
    detail: (id: string) => ['transporters', 'detail', id] as const,
};
