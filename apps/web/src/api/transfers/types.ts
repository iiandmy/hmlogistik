import type { Transfer, TransferFile } from '@hmlogistik/database';

export type TransferFileDto = Omit<TransferFile, 'id' | 'transferId' | 'sizeBytes' | 'createdAt' | 'transfer'> & {
    id: number;
    sizeBytes: number;
    createdAt: string;
    downloadUrl: string;
};

export type TransferDto = Omit<Transfer, 'id' | 'createdAt' | 'shippedAt' | 'price' | 'files'> & {
    id: number;
    createdAt: string | null;
    shippedAt: string | null;
    price: number;
    files: TransferFileDto[];
};

export interface TransfersPagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface GetTransfersParams {
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'shippedAt';
    order?: 'asc' | 'desc';
    q?: string;
}

export interface GetTransfersResponse {
    items: TransferDto[];
    pagination: TransfersPagination;
}

export type GetTransferByIdResponse = TransferDto;

export interface CreateTransferPayload {
    createdAt?: string | null;
    shippedAt?: string | null;
    transporter: string;
    receiver: string;
    container?: string | null;
    price: number;
    cargo: string;
}

export type UpdateTransferPayload = Partial<CreateTransferPayload>;

export interface CreateTransferInput {
    payload: CreateTransferPayload;
    files: File[];
}

export interface UpdateTransferInput {
    payload: UpdateTransferPayload;
    files: File[];
    removedFileIds: number[];
}
