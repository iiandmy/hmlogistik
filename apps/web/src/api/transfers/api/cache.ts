export const transfersCacheConfig = {
    list: {
        staleTime: 30_000, // 30 seconds
        gcTime: 5 * 60_000, // 5 minutes
    },
    detail: {
        staleTime: 60_000, // 1 minute
        gcTime: 10 * 60_000, // 10 minutes
    },
};
