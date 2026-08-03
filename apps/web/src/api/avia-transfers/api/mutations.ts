import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import type { CreateAviaTransferInput, UpdateAviaTransferInput } from '../types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { aviaTransfersApi } from './client';
import { aviaTransferKeys } from './queryKeys';

export const useCreateAviaTransfer = (
    options?: UseMutationOptions<void, Error, CreateAviaTransferInput>,
): UseMutationResult<void, Error, CreateAviaTransferInput> => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: CreateAviaTransferInput) => aviaTransfersApi.create(input),
        onSuccess: (...args) => {
            queryClient.invalidateQueries({ queryKey: aviaTransferKeys.all });
            options?.onSuccess?.(...args);
        },
    });
};

export const useUpdateAviaTransfer = (
    params: { id: string },
    options?: UseMutationOptions<void, Error, UpdateAviaTransferInput>,
): UseMutationResult<void, Error, UpdateAviaTransferInput> => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: UpdateAviaTransferInput) => aviaTransfersApi.update(params.id, input),
        onSuccess: (...args) => {
            queryClient.invalidateQueries({ queryKey: aviaTransferKeys.detail(params.id) });
            queryClient.invalidateQueries({ queryKey: aviaTransferKeys.all });
            options?.onSuccess?.(...args);
        },
    });
};
