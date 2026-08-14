import type { TransferFile } from '@hmlogistik/database';

export type TransferFileDto = Omit<TransferFile, 'id' | 'transferId' | 'sizeBytes' | 'createdAt' | 'transfer'> & {
    id: number;
    sizeBytes: number;
    createdAt: string;
    downloadUrl: string;
};

export interface TransferReceiverDto {
    id: number;
    name: string;
    isPlaceholder: boolean;
}

export interface TransferTransporterDelayDto {
    receiverId: number;
    receiverName: string;
    paymentDelayDays: number;
}

export interface TransferTransporterDto {
    id: number;
    name: string;
    type: 'Rail';
    isPlaceholder: boolean;
    paymentDelayDays: number;
    paymentDelayExceptions: TransferTransporterDelayDto[];
}

export interface TransferDto {
    id: number;
    createdAt: string | null;
    shippedAt: string | null;
    declarationDate: string | null;
    actDate: string | null;
    legacyTransporter: string | null;
    legacyReceiver: string | null;
    transporter: TransferTransporterDto;
    receivers: TransferReceiverDto[];
    container: string | null;
    price: number;
    cargo: string;
    files: TransferFileDto[];
}

interface DatasourceFlags {
    shouldShowShippedAlert: boolean;
    exceptionFlags: {
        [key: string]: boolean;
    };
}

export interface TransferDatasource extends TransferDto, DatasourceFlags {
    key: number;
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
    declarationDate?: string | null;
    actDate?: string | null;
    transporterId: number;
    receiverIds: number[];
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
