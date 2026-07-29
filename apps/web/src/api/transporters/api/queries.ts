// TODO: implement when backend is ready
import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { transportersCacheConfig } from './cache';
import { transportersApi } from './client';
import { transporterKeys } from './queryKeys';

export const useTransportersList = (
    _params?: object,
    options?: UseQueryOptions<never>,
): UseQueryResult<never> => useQuery({
    queryKey: transporterKeys.all,
    queryFn: () => transportersApi.getAll(),
    enabled: false,
    ...transportersCacheConfig.list,
    ...options,
});
