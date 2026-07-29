// TODO: implement when backend is ready
import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { aviaTransfersCacheConfig } from './cache';
import { aviaTransfersApi } from './client';
import { aviaTransferKeys } from './queryKeys';

export const useAviaTransfersList = (
    params?: object,
    options?: UseQueryOptions<never>,
): UseQueryResult<never> => useQuery({
    queryKey: aviaTransferKeys.list(),
    queryFn: () => aviaTransfersApi.getAll(),
    enabled: false, // disabled until backend is ready
    ...aviaTransfersCacheConfig.list,
    ...options,
});

export const useAviaTransferDetail = (
    params: { id: string },
    options?: UseQueryOptions<never>,
): UseQueryResult<never> => useQuery({
    queryKey: aviaTransferKeys.detail(params.id),
    queryFn: () => aviaTransfersApi.getById(params.id),
    enabled: false, // disabled until backend is ready
    ...aviaTransfersCacheConfig.detail,
    ...options,
});
