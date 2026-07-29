import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import type { CreateTransferInput, UpdateTransferInput } from '../types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { transfersApi } from './client';
import { transferKeys } from './queryKeys';

export const useCreateTransfer = (
    options?: UseMutationOptions<void, Error, CreateTransferInput>,
): UseMutationResult<void, Error, CreateTransferInput> => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: CreateTransferInput) => transfersApi.create(input),
        onSuccess: (...args) => {
            queryClient.invalidateQueries({ queryKey: transferKeys.all });
            options?.onSuccess?.(...args);
        },
    });
};

export const useUpdateTransfer = (
    params: { id: string },
    options?: UseMutationOptions<void, Error, UpdateTransferInput>,
): UseMutationResult<void, Error, UpdateTransferInput> => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: UpdateTransferInput) => transfersApi.update(params.id, input),
        onSuccess: (...args) => {
            queryClient.invalidateQueries({ queryKey: transferKeys.detail(params.id) });
            queryClient.invalidateQueries({ queryKey: transferKeys.all });
            options?.onSuccess?.(...args);
        },
    });
};
