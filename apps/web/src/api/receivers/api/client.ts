import type {
    CreateReceiverPayload,
    GetReceiversParams,
    ReceiverDto,
    ReceiversListResponse,
    UpdateReceiverPayload,
} from '../types';
import { RECEIVERS_ENDPOINT } from './constants';
import { ReceiverNotFoundError } from './errors';

export const receiversApi = {
    async getAll(params: GetReceiversParams = {}): Promise<ReceiversListResponse> {
        const searchParams = new URLSearchParams();
        if (params.q) {
            searchParams.set('q', params.q);
        }

        const suffix = searchParams.size > 0 ? `?${searchParams.toString()}` : '';
        const response = await fetch(`${RECEIVERS_ENDPOINT}${suffix}`);

        if (!response.ok) {
            throw new Error('Не удалось загрузить получателей');
        }

        return response.json() as Promise<ReceiversListResponse>;
    },

    async getById(id: string): Promise<ReceiverDto> {
        const response = await fetch(`${RECEIVERS_ENDPOINT}/${id}`);

        if (response.status === 404) {
            throw new ReceiverNotFoundError('Получатель не найден');
        }

        if (!response.ok) {
            throw new Error('Не удалось загрузить получателя');
        }

        return response.json() as Promise<ReceiverDto>;
    },

    async create(payload: CreateReceiverPayload): Promise<ReceiverDto> {
        const response = await fetch(RECEIVERS_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error('Не удалось создать получателя');
        }

        return response.json() as Promise<ReceiverDto>;
    },

    async update(id: string, payload: UpdateReceiverPayload): Promise<ReceiverDto> {
        const response = await fetch(`${RECEIVERS_ENDPOINT}/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (response.status === 404) {
            throw new ReceiverNotFoundError('Получатель не найден');
        }

        if (!response.ok) {
            throw new Error('Не удалось обновить получателя');
        }

        return response.json() as Promise<ReceiverDto>;
    },
};
