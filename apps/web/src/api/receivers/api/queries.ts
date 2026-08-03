import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { GetReceiversParams, ReceiverDto, ReceiversListResponse } from '../types';
import { useQuery } from '@tanstack/react-query';
import { receiversCacheConfig } from './cache';
import { receiversApi } from './client';
import { receiverKeys } from './queryKeys';

export const useReceiversList = (
    params: GetReceiversParams = {},
    options?: UseQueryOptions<ReceiversListResponse>,
): UseQueryResult<ReceiversListResponse> => useQuery({
    queryKey: receiverKeys.list(params),
    queryFn: () => receiversApi.getAll(params),
    ...receiversCacheConfig.list,
    ...options,
});

export const useReceiverDetail = (
    params: { id: string },
    options?: UseQueryOptions<ReceiverDto>,
): UseQueryResult<ReceiverDto> => useQuery({
    queryKey: receiverKeys.detail(params.id),
    queryFn: () => receiversApi.getById(params.id),
    ...receiversCacheConfig.list,
    retry: (failureCount, error) => {
        if (error.name === 'ReceiverNotFoundError') {
            return false;
        }
        return failureCount < 1;
    },
    ...options,
});
