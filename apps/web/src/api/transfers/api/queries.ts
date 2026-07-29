import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { GetTransferByIdResponse, GetTransfersParams, GetTransfersResponse } from '../types';
import { useQuery } from '@tanstack/react-query';
import { transfersCacheConfig } from './cache';
import { transfersApi } from './client';
import { transferKeys } from './queryKeys';

export const useTransfersList = (
    params: GetTransfersParams = {},
    options?: UseQueryOptions<GetTransfersResponse>,
): UseQueryResult<GetTransfersResponse> => useQuery({
    queryKey: transferKeys.list(params),
    queryFn: () => transfersApi.getAll(params),
    ...transfersCacheConfig.list,
    ...options,
});

export const useTransferDetail = (
    params: { id: string },
    options?: UseQueryOptions<GetTransferByIdResponse>,
): UseQueryResult<GetTransferByIdResponse> => useQuery({
    queryKey: transferKeys.detail(params.id),
    queryFn: () => transfersApi.getById(params.id),
    ...transfersCacheConfig.detail,
    retry: (failureCount, error) => {
        if (error.name === 'TransferNotFoundError') {
            return false;
        }
        return failureCount < 1;
    },
    ...options,
});
