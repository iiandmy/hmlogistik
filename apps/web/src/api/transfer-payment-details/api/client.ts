import type { TransferPaymentDetailsDto, UpdateTransferPaymentDetailsPayload } from '../types';
import { getResponseErrorMessage } from '~utils/lib/get-response-error-message';
import { TRANSFER_PAYMENT_DETAILS_ENDPOINT } from './constants';

export const transferPaymentDetailsApi = {
    async getByTransferId(transferId: string): Promise<TransferPaymentDetailsDto> {
        const response = await fetch(`${TRANSFER_PAYMENT_DETAILS_ENDPOINT}/${transferId}`);

        if (!response.ok) {
            throw new Error(await getResponseErrorMessage(response, 'Не удалось загрузить данные об оплате'));
        }

        return response.json() as Promise<TransferPaymentDetailsDto>;
    },

    async updateByTransferId(
        transferId: string,
        payload: UpdateTransferPaymentDetailsPayload,
    ): Promise<TransferPaymentDetailsDto> {
        const response = await fetch(`${TRANSFER_PAYMENT_DETAILS_ENDPOINT}/${transferId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(await getResponseErrorMessage(response, 'Не удалось обновить данные об оплате'));
        }

        return response.json() as Promise<TransferPaymentDetailsDto>;
    },
};
