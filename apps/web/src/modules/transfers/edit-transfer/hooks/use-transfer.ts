import type { TransferFormValues } from '~utils/types/types';
import { mapTransferDtoToForm, useTransferDetail } from '~api/transfers';

interface UseTransferResult {
    transfer: TransferFormValues | null;
    transferMeta: {
        id: number;
        shippedAt: string | null;
        paymentAlert: import('~api/transfers').TransferDto['paymentAlert'];
        isReceiversEditable: boolean;
        isPriceEditable: boolean;
    } | null;
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
            transferMeta: null,
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
        transferMeta: {
            id: data.id,
            shippedAt: data.shippedAt,
            paymentAlert: data.paymentAlert,
            isReceiversEditable: data.isReceiversEditable,
            isPriceEditable: data.isPriceEditable,
        },
        legacyTransporterName: data.legacyTransporter,
        legacyReceiverName: data.legacyReceiver,
        files,
        isLoading,
        isError: false,
    };
};
