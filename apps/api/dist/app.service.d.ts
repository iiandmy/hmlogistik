interface GetAllTransfersParams {
    page: number;
    limit: number;
    sortBy: 'createdAt' | 'shippedAt';
    order: 'asc' | 'desc';
    priceMin: number | null;
    priceMax: number | null;
    q: string | null;
}
export declare class AppService {
    getAllTransfers(params: GetAllTransfersParams): Promise<{
        items: {
            id: number;
            createdAt: string | null;
            shippedAt: string | null;
            transporter: string;
            receiver: string;
            container: string | null;
            price: number;
            cargo: string;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
}
export {};
