import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { TransferPaymentDetailsDto } from '../types';
import { useQuery } from '@tanstack/react-query';
import { transferPaymentDetailsApi } from './client';
import { transferPaymentDetailsKeys } from './queryKeys';

export const useTransferPaymentDetails = (
    params: { transferId: string },
    options?: Partial<UseQueryOptions<TransferPaymentDetailsDto>>,
): UseQueryResult<TransferPaymentDetailsDto> => useQuery({
    ...options,
    queryKey: transferPaymentDetailsKeys.detail(params.transferId),
    queryFn: () => transferPaymentDetailsApi.getByTransferId(params.transferId),
});
