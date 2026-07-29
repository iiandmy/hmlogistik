import type { TransferFileResponse } from '../../files/interfaces/transfer-file-response.interface';

export interface TransferResponse {
    id: number;
    createdAt: string | null;
    shippedAt: string | null;
    transporter: string;
    receiver: string;
    container: string | null;
    price: number;
    cargo: string;
    files: TransferFileResponse[];
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
