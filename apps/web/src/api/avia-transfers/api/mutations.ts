// TODO: implement when backend is ready
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { aviaTransfersApi } from './client';
import { aviaTransferKeys } from './queryKeys';

export const useCreateAviaTransfer = (
    options?: UseMutationOptions<never, Error, void>,
): UseMutationResult<never, Error, void> => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => aviaTransfersApi.create(),
        onSuccess: (...args) => {
            queryClient.invalidateQueries({ queryKey: aviaTransferKeys.all });
            options?.onSuccess?.(...args);
        },
    });
};

export const useUpdateAviaTransfer = (
    params: { id: string },
    options?: UseMutationOptions<never, Error, void>,
): UseMutationResult<never, Error, void> => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => aviaTransfersApi.update(),
        onSuccess: (...args) => {
            queryClient.invalidateQueries({ queryKey: aviaTransferKeys.detail(params.id) });
            queryClient.invalidateQueries({ queryKey: aviaTransferKeys.all });
            options?.onSuccess?.(...args);
        },
    });
};
