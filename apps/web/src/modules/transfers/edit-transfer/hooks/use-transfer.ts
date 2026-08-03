import type { TransferFormValues } from '~utils/types/types';
import { mapTransferDtoToForm, useTransferDetail } from '~api/transfers';

interface UseTransferResult {
    transfer: TransferFormValues | null;
    files: import('~api/transfers').TransferFileDto[];
    isLoading: boolean;
    isError: boolean;
}

export const useTransfer = (id: string): UseTransferResult => {
    const { data, isLoading, isError } = useTransferDetail({ id });

    if (isError || !data) {
        return {
            transfer: null,
            files: [],
            isLoading,
            isError,
        };
    }

    const { transfer, files } = mapTransferDtoToForm(data);

    return {
        transfer,
        files,
        isLoading,
        isError: false,
    };
};
