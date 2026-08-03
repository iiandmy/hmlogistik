import type { TransferFormValues } from '~utils/types/types';
import { mapTransferDtoToForm, useTransferDetail } from '~api/transfers';

interface UseTransferResult {
    transfer: TransferFormValues | null;
    legacyTransporterName: string | null;
    legacyReceiverName: string | null;
    files: import('~api/transfers').TransferFileDto[];
    isLoading: boolean;
    isError: boolean;
}

export const useTransfer = (id: string): UseTransferResult => {
    const { data, isLoading, isError } = useTransferDetail({ id });

    if (isError || !data) {
        return {
            transfer: null,
            legacyTransporterName: null,
            legacyReceiverName: null,
            files: [],
            isLoading,
            isError,
        };
    }

    const { transfer, files } = mapTransferDtoToForm(data);

    return {
        transfer,
        legacyTransporterName: data.legacyTransporter,
        legacyReceiverName: data.legacyReceiver,
        files,
        isLoading,
        isError: false,
    };
};
