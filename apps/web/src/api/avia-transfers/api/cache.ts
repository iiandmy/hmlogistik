// TODO: implement when backend is ready
export const aviaTransfersCacheConfig = {
    list: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
    },
    detail: {
        staleTime: 60_000,
        gcTime: 10 * 60_000,
    },
};
