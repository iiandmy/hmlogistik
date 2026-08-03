import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { GetAviaTransferByIdResponse, GetAviaTransfersParams, GetAviaTransfersResponse } from '../types';
import { useQuery } from '@tanstack/react-query';
import { aviaTransfersCacheConfig } from './cache';
import { aviaTransfersApi } from './client';
import { aviaTransferKeys } from './queryKeys';

export const useAviaTransfersList = (
    params: GetAviaTransfersParams = {},
    options?: UseQueryOptions<GetAviaTransfersResponse>,
): UseQueryResult<GetAviaTransfersResponse> => useQuery({
    queryKey: aviaTransferKeys.list(params),
    queryFn: () => aviaTransfersApi.getAll(params),
    ...aviaTransfersCacheConfig.list,
    ...options,
});

export const useAviaTransferDetail = (
    params: { id: string },
    options?: UseQueryOptions<GetAviaTransferByIdResponse>,
): UseQueryResult<GetAviaTransferByIdResponse> => useQuery({
    queryKey: aviaTransferKeys.detail(params.id),
    queryFn: () => aviaTransfersApi.getById(params.id),
    ...aviaTransfersCacheConfig.detail,
    retry: (failureCount, error) => {
        if (error.name === 'AviaTransferNotFoundError') {
            return false;
        }

        return failureCount < 1;
    },
    ...options,
});
