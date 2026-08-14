import type {
    CreateTransferInput,
    GetTransferByIdResponse,
    GetTransfersParams,
    GetTransfersResponse,
    UpdateTransferInput,
} from '../types';
import { getResponseErrorMessage } from '~utils/lib/get-response-error-message';
import { TRANSFERS_ENDPOINT } from './constants';
import { TransferNotFoundError } from './errors';

export const transfersApi = {
    async getAll(params: GetTransfersParams = {}): Promise<GetTransfersResponse> {
        const query = {
            page: 1,
            limit: 10,
            sortBy: 'createdAt' as const,
            order: 'desc' as const,
            q: '',
            ...params,
        };

        const searchParams = new URLSearchParams({
            page: String(query.page),
            limit: String(query.limit),
            sortBy: query.sortBy,
            order: query.order,
            q: query.q ?? '',
        });

        const response = await fetch(`${TRANSFERS_ENDPOINT}?${searchParams.toString()}`);

        if (!response.ok) {
            throw new Error(await getResponseErrorMessage(response, 'Не удалось загрузить отправки'));
        }

        return response.json() as Promise<GetTransfersResponse>;
    },

    async getById(id: string): Promise<GetTransferByIdResponse> {
        const response = await fetch(`${TRANSFERS_ENDPOINT}/${id}`);

        if (response.status === 404) {
            throw new TransferNotFoundError();
        }

        if (!response.ok) {
            throw new Error(await getResponseErrorMessage(response, 'Не удалось загрузить отправку'));
        }

        return response.json() as Promise<GetTransferByIdResponse>;
    },

    async create(input: CreateTransferInput): Promise<void> {
        const formData = new FormData();
        formData.append('payload', JSON.stringify(input.payload));
        for (const file of input.files) {
            formData.append('files', file);
        }

        const response = await fetch(TRANSFERS_ENDPOINT, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(await getResponseErrorMessage(response, 'Не удалось создать отправку'));
        }
    },

    async update(id: string, input: UpdateTransferInput): Promise<void> {
        const formData = new FormData();
        formData.append('payload', JSON.stringify(input.payload));
        for (const file of input.files) {
            formData.append('files', file);
        }
        formData.append('removedFileIds', JSON.stringify(input.removedFileIds));

        const response = await fetch(`${TRANSFERS_ENDPOINT}/${id}`, {
            method: 'PATCH',
            body: formData,
        });

        if (response.status === 404) {
            throw new TransferNotFoundError();
        }

        if (!response.ok) {
            throw new Error(await getResponseErrorMessage(response, 'Не удалось обновить отправку'));
        }
    },
};
