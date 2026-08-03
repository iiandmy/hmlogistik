import type {
    CreateAviaTransferInput,
    GetAviaTransferByIdResponse,
    GetAviaTransfersParams,
    GetAviaTransfersResponse,
    UpdateAviaTransferInput,
} from '../types';
import { AVIA_TRANSFERS_ENDPOINT, DEFAULT_AVIA_TRANSFERS_QUERY } from './constants';
import { AviaTransferNotFoundError } from './errors';

export const aviaTransfersApi = {
    async getAll(params: GetAviaTransfersParams = {}): Promise<GetAviaTransfersResponse> {
        const query = {
            ...DEFAULT_AVIA_TRANSFERS_QUERY,
            ...params,
        };

        const searchParams = new URLSearchParams({
            page: String(query.page),
            limit: String(query.limit),
            sortBy: query.sortBy,
            order: query.order,
            q: query.q ?? '',
        });

        const response = await fetch(`${AVIA_TRANSFERS_ENDPOINT}?${searchParams.toString()}`);

        if (!response.ok) {
            throw new Error('Не удалось загрузить авиаперевозки');
        }

        return response.json() as Promise<GetAviaTransfersResponse>;
    },

    async getById(id: string): Promise<GetAviaTransferByIdResponse> {
        const response = await fetch(`${AVIA_TRANSFERS_ENDPOINT}/${id}`);

        if (response.status === 404) {
            throw new AviaTransferNotFoundError();
        }

        if (!response.ok) {
            throw new Error('Не удалось загрузить авиаперевозку');
        }

        return response.json() as Promise<GetAviaTransferByIdResponse>;
    },

    async create(input: CreateAviaTransferInput): Promise<void> {
        const response = await fetch(AVIA_TRANSFERS_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(input.payload),
        });

        if (!response.ok) {
            throw new Error('Не удалось создать авиаперевозку');
        }
    },

    async update(id: string, input: UpdateAviaTransferInput): Promise<void> {
        const response = await fetch(`${AVIA_TRANSFERS_ENDPOINT}/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(input.payload),
        });

        if (response.status === 404) {
            throw new AviaTransferNotFoundError();
        }

        if (!response.ok) {
            throw new Error('Не удалось обновить авиаперевозку');
        }
    },
};
