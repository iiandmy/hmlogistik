import type {
    CreateTransporterPayload,
    GetTransportersParams,
    TransporterDto,
    TransportersListResponse,
    UpdateTransporterPayload,
} from '../types';
import { TRANSPORTERS_ENDPOINT } from './constants';
import { TransporterNotFoundError } from './errors';

export const transportersApi = {
    async getAll(params: GetTransportersParams = {}): Promise<TransportersListResponse> {
        const searchParams = new URLSearchParams();
        if (params.type) {
            searchParams.set('type', params.type);
        }
        if (params.q) {
            searchParams.set('q', params.q);
        }

        const suffix = searchParams.size > 0 ? `?${searchParams.toString()}` : '';
        const response = await fetch(`${TRANSPORTERS_ENDPOINT}${suffix}`);

        if (!response.ok) {
            throw new Error('Не удалось загрузить перевозчиков');
        }

        return response.json() as Promise<TransportersListResponse>;
    },

    async getById(id: string): Promise<TransporterDto> {
        const response = await fetch(`${TRANSPORTERS_ENDPOINT}/${id}`);

        if (response.status === 404) {
            throw new TransporterNotFoundError('Перевозчик не найден');
        }

        if (!response.ok) {
            throw new Error('Не удалось загрузить перевозчика');
        }

        return response.json() as Promise<TransporterDto>;
    },

    async create(payload: CreateTransporterPayload): Promise<TransporterDto> {
        const response = await fetch(TRANSPORTERS_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error('Не удалось создать перевозчика');
        }

        return response.json() as Promise<TransporterDto>;
    },

    async update(id: string, payload: UpdateTransporterPayload): Promise<TransporterDto> {
        const response = await fetch(`${TRANSPORTERS_ENDPOINT}/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (response.status === 404) {
            throw new TransporterNotFoundError('Перевозчик не найден');
        }

        if (!response.ok) {
            throw new Error('Не удалось обновить перевозчика');
        }

        return response.json() as Promise<TransporterDto>;
    },
};
