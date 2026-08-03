import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { GetTransportersParams, TransporterDto, TransportersListResponse } from '../types';
import { useQuery } from '@tanstack/react-query';
import { transportersCacheConfig } from './cache';
import { transportersApi } from './client';
import { transporterKeys } from './queryKeys';

export const useTransportersList = (
    params: GetTransportersParams = {},
    options?: UseQueryOptions<TransportersListResponse>,
): UseQueryResult<TransportersListResponse> => useQuery({
    queryKey: transporterKeys.list(params),
    queryFn: () => transportersApi.getAll(params),
    ...transportersCacheConfig.list,
    ...options,
});

export const useTransporterDetail = (
    params: { id: string },
    options?: UseQueryOptions<TransporterDto>,
): UseQueryResult<TransporterDto> => useQuery({
    queryKey: transporterKeys.detail(params.id),
    queryFn: () => transportersApi.getById(params.id),
    ...transportersCacheConfig.list,
    retry: (failureCount, error) => {
        if (error.name === 'TransporterNotFoundError') {
            return false;
        }
        return failureCount < 1;
    },
    ...options,
});
