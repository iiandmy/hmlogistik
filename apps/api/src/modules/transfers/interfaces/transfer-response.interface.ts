export interface TransferResponse {
    id: number;
    createdAt: string | null;
    shippedAt: string | null;
    transporter: string;
    receiver: string;
    container: string | null;
    price: number;
    cargo: string;
}

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface PaginatedTransfersResponse {
    items: TransferResponse[];
    pagination: PaginationMeta;
}
