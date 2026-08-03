import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import type {
    CreateReceiverPayload,
    ReceiverDto,
    UpdateReceiverPayload,
} from '../types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { receiversApi } from './client';
import { receiverKeys } from './queryKeys';

export const useCreateReceiver = (
    options?: UseMutationOptions<ReceiverDto, Error, CreateReceiverPayload>,
): UseMutationResult<ReceiverDto, Error, CreateReceiverPayload> => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateReceiverPayload) => receiversApi.create(payload),
        onSuccess: (...args) => {
            queryClient.invalidateQueries({ queryKey: receiverKeys.all });
            options?.onSuccess?.(...args);
        },
    });
};

export const useUpdateReceiver = (
    params: { id: string },
    options?: UseMutationOptions<ReceiverDto, Error, UpdateReceiverPayload>,
): UseMutationResult<ReceiverDto, Error, UpdateReceiverPayload> => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: UpdateReceiverPayload) => receiversApi.update(params.id, payload),
        onSuccess: (...args) => {
            queryClient.invalidateQueries({ queryKey: receiverKeys.all });
            queryClient.invalidateQueries({ queryKey: receiverKeys.detail(params.id) });
            options?.onSuccess?.(...args);
        },
    });
};
