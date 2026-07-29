export const TRANSFERS_ENDPOINT = '/api/transfers';

export const DEFAULT_TRANSFERS_QUERY = {
    page: 1,
    limit: 10,
    sortBy: 'createdAt' as const,
    order: 'desc' as const,
    q: '',
};
