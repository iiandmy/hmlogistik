import type { AviaTransferFormValues } from '~api/avia-transfers';
import { mapAviaTransferDtoToForm, useAviaTransferDetail } from '~api/avia-transfers';

interface UseAviaTransferResult {
    transfer: AviaTransferFormValues | null;
    isLoading: boolean;
    isError: boolean;
}

export const useAviaTransfer = (id: string): UseAviaTransferResult => {
    const { data, isLoading, isError } = useAviaTransferDetail({ id });

    if (isError || !data) {
        return {
            transfer: null,
            isLoading,
            isError,
        };
    }

    return {
        transfer: mapAviaTransferDtoToForm(data),
        isLoading,
        isError: false,
    };
};
