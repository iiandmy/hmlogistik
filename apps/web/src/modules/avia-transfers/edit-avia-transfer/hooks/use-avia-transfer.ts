import type { AviaTransferFormValues } from '~api/avia-transfers';
import { mapAviaTransferDtoToForm, useAviaTransferDetail } from '~api/avia-transfers';

interface UseAviaTransferResult {
    transfer: AviaTransferFormValues | null;
    legacyTransporterName: string | null;
    legacyReceiverName: string | null;
    isLoading: boolean;
    isError: boolean;
}

export const useAviaTransfer = (id: string): UseAviaTransferResult => {
    const { data, isLoading, isError } = useAviaTransferDetail({ id });

    if (isError || !data) {
        return {
            transfer: null,
            legacyTransporterName: null,
            legacyReceiverName: null,
            isLoading,
            isError,
        };
    }

    return {
        transfer: mapAviaTransferDtoToForm(data),
        legacyTransporterName: data.legacyTransporter,
        legacyReceiverName: data.legacyReceiver,
        isLoading,
        isError: false,
    };
};
