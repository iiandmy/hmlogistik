import type {
    GetTransferPaymentOverviewParams,
    TransferPaymentDetailsDto,
    TransferPaymentOverviewListResponse,
    UpdateTransferPaymentDetailsPayload,
} from '../types';
import { getResponseErrorMessage } from '~utils/lib/get-response-error-message';
import { TRANSFER_PAYMENT_DETAILS_ENDPOINT } from './constants';

export const transferPaymentDetailsApi = {
    async getAll(params: GetTransferPaymentOverviewParams = {}): Promise<TransferPaymentOverviewListResponse> {
        const searchParams = new URLSearchParams();

        if (params.status) {
            searchParams.set('status', params.status);
        }

        const query = searchParams.toString();
        const response = await fetch(
            query.length > 0
                ? `${TRANSFER_PAYMENT_DETAILS_ENDPOINT}?${query}`
                : TRANSFER_PAYMENT_DETAILS_ENDPOINT,
        );

        if (!response.ok) {
            throw new Error(await getResponseErrorMessage(response, 'Не удалось загрузить оплаты'));
        }

        return response.json() as Promise<TransferPaymentOverviewListResponse>;
    },

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
