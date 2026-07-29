// TODO: implement when backend is ready
import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { cargoCacheConfig } from './cache';
import { cargoApi } from './client';
import { cargoKeys } from './queryKeys';

export const useCargoList = (
    params?: object,
    options?: UseQueryOptions<never>,
): UseQueryResult<never> => useQuery({
    queryKey: cargoKeys.all,
    queryFn: () => cargoApi.getAll(),
    enabled: false,
    ...cargoCacheConfig.list,
    ...options,
});
