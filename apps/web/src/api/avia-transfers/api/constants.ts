export const AVIA_TRANSFERS_ENDPOINT = '/api/avia-transfers';

export const DEFAULT_AVIA_TRANSFERS_QUERY = {
    page: 1,
    limit: 10,
    sortBy: 'createdAt' as const,
    order: 'desc' as const,
    q: '',
};
