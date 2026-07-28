import type { Transfer } from '~utils/types/types';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { getTransferById, TransferNotFoundError } from '~api/transfers';
import 'dayjs/locale/ru';

dayjs.locale('ru');

interface UseTransferResult {
    transfer: Transfer | null;
    isLoading: boolean;
    isError: boolean;
}

export function useTransfer(id: string): UseTransferResult {
    const { data, isLoading, error } = useQuery({
        queryKey: ['transfer', id],
        queryFn: async () => getTransferById(id),
        retry: c => c < 1,
    });

    if (error instanceof TransferNotFoundError) {
        return {
            transfer: null,
            isLoading: false,
            isError: true,
        };
    }

    if (!data) {
        return {
            transfer: null,
            isLoading,
            isError: Boolean(error),
        };
    }

    return {
        transfer: {
            ...data,
            container: data.container ?? '',
            price: String(data.price),
            createdAt: data.createdAt ? dayjs(data.createdAt) : null,
            shippedAt: data.shippedAt ? dayjs(data.shippedAt) : null,
        },
        isLoading,
        isError: false,
    };
}
