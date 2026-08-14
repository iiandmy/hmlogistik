import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import type { TransferPaymentDetailsDto, UpdateTransferPaymentDetailsPayload } from '../types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { transferKeys } from '~api/transfers';
import { transferPaymentDetailsApi } from './client';
import { transferPaymentDetailsKeys } from './queryKeys';

export const useUpdateTransferPaymentDetails = (
    params: { transferId: string },
    options?: UseMutationOptions<TransferPaymentDetailsDto, Error, UpdateTransferPaymentDetailsPayload>,
): UseMutationResult<TransferPaymentDetailsDto, Error, UpdateTransferPaymentDetailsPayload> => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: payload => transferPaymentDetailsApi.updateByTransferId(params.transferId, payload),
        onSuccess: (...args) => {
            queryClient.invalidateQueries({ queryKey: transferPaymentDetailsKeys.detail(params.transferId) });
            queryClient.invalidateQueries({ queryKey: transferKeys.detail(params.transferId) });
            queryClient.invalidateQueries({ queryKey: transferKeys.all });
            options?.onSuccess?.(...args);
        },
    });
};
