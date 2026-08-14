import type { TransferFileResponse } from '../../files/interfaces/transfer-file-response.interface';

export interface TransferReceiverResponse {
    id: number;
    name: string;
    isPlaceholder: boolean;
}

export interface TransferDelayRuleResponse {
    receiverId: number;
    receiverName: string;
    paymentDelayDays: number;
}

export interface TransferTransporterResponse {
    id: number;
    name: string;
    type: 'Rail';
    isPlaceholder: boolean;
    paymentDelayDays: number;
    paymentDelayExceptions: TransferDelayRuleResponse[];
}

export interface TransferResponse {
    id: number;
    createdAt: string | null;
    shippedAt: string | null;
    declarationDate: string | null;
    actDate: string | null;
    legacyTransporter: string | null;
    legacyReceiver: string | null;
    transporter: TransferTransporterResponse;
    receivers: TransferReceiverResponse[];
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
