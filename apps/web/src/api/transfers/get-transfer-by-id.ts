import type { GetTransferByIdResponse } from './types';

export class TransferNotFoundError extends Error {
    constructor(message = 'Transfer not found') {
        super(message);
        this.name = 'TransferNotFoundError';
    }
}

export async function getTransferById(id: string): Promise<GetTransferByIdResponse> {
    const response = await fetch(`/api/transfers/${id}`);

    if (response.status === 404) {
        throw new TransferNotFoundError();
    }

    if (!response.ok) {
        throw new Error('Не удалось загрузить отправку');
    }

    return response.json() as Promise<GetTransferByIdResponse>;
}
