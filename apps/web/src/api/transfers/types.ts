export interface TransferDto {
    id: number;
    createdAt: string | null;
    shippedAt: string | null;
    transporter: string;
    receiver: string;
    container: string | null;
    price: number;
    cargo: string;
}

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

export interface TransferFileDto {
    id: number;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    createdAt: string;
    downloadUrl: string;
}

export interface CreateTransferInput {
    payload: CreateTransferPayload;
    files: File[];
}

export interface UpdateTransferInput {
    payload: UpdateTransferPayload;
    files: File[];
    removedFileIds: number[];
}
