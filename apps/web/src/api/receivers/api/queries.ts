// TODO: implement when backend is ready
import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { receiversCacheConfig } from './cache';
import { receiversApi } from './client';
import { receiverKeys } from './queryKeys';

export const useReceiversList = (
    _params?: object,
    options?: UseQueryOptions<never>,
): UseQueryResult<never> => useQuery({
    queryKey: receiverKeys.all,
    queryFn: () => receiversApi.getAll(),
    enabled: false,
    ...receiversCacheConfig.list,
    ...options,
});
