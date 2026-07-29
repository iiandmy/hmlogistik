// TODO: implement when backend is ready
export const aviaTransferKeys = {
    all: ['avia-transfers'] as const,
    list: (params?: Record<string, unknown>) => ['avia-transfers', 'list', params] as const,
    detail: (id: string) => ['avia-transfers', 'detail', id] as const,
};
