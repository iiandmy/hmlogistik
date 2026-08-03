import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import type {
    CreateTransporterPayload,
    TransporterDto,
    UpdateTransporterPayload,
} from '../types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { transportersApi } from './client';
import { transporterKeys } from './queryKeys';

export const useCreateTransporter = (
    options?: UseMutationOptions<TransporterDto, Error, CreateTransporterPayload>,
): UseMutationResult<TransporterDto, Error, CreateTransporterPayload> => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateTransporterPayload) => transportersApi.create(payload),
        onSuccess: (...args) => {
            queryClient.invalidateQueries({ queryKey: transporterKeys.all });
            options?.onSuccess?.(...args);
        },
    });
};

export const useUpdateTransporter = (
    params: { id: string },
    options?: UseMutationOptions<TransporterDto, Error, UpdateTransporterPayload>,
): UseMutationResult<TransporterDto, Error, UpdateTransporterPayload> => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: UpdateTransporterPayload) => transportersApi.update(params.id, payload),
        onSuccess: (...args) => {
            queryClient.invalidateQueries({ queryKey: transporterKeys.all });
            queryClient.invalidateQueries({ queryKey: transporterKeys.detail(params.id) });
            options?.onSuccess?.(...args);
        },
    });
};
