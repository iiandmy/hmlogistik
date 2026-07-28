import type { GetTransfersParams, GetTransfersResponse } from './types';

const DEFAULT_TRANSFERS_QUERY: Required<GetTransfersParams> = {
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    order: 'desc',
    q: '',
};

export async function getTransfers(params: GetTransfersParams = {}): Promise<GetTransfersResponse> {
    const query = {
        ...DEFAULT_TRANSFERS_QUERY,
        ...params,
    };

    const searchParams = new URLSearchParams({
        page: String(query.page),
        limit: String(query.limit),
        sortBy: query.sortBy,
        order: query.order,
        q: query.q ?? '',
    });

    // const response = await fetch(`/api`);
    const response = await fetch(`/api/transfers?${searchParams.toString()}`);

    if (!response.ok) {
        throw new Error('Не удалось загрузить отправки');
    }

    return response.json() as Promise<GetTransfersResponse>;
}

export { DEFAULT_TRANSFERS_QUERY };
