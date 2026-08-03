import type { Dayjs } from 'dayjs';

export interface AviaCargoData {
    weight: number;
    volume: number;
    cargoSpaces: number;
}

export interface AviaTransferReceiverDto {
    id: number;
    name: string;
    isPlaceholder: boolean;
}

export interface AviaTransferTransporterDto {
    id: number;
    name: string;
    type: 'Avia';
    isPlaceholder: boolean;
}

export interface AviaTransferDto {
    id: number;
    departedAt: string | null;
    invoiceNumber: string | null;
    cargoData: AviaCargoData;
    usdRate: number | null;
    cnyRate: number | null;
    legacyTransporter: string | null;
    legacyReceiver: string | null;
    transporter: AviaTransferTransporterDto;
    receivers: AviaTransferReceiverDto[];
}

export interface AviaTransferFormValues {
    id: number;
    departedAt: Dayjs | null;
    invoiceNumber: string;
    cargoData: {
        weight: number | null;
        volume: number | null;
        cargoSpaces: number | null;
    };
    usdRate: number | null;
    cnyRate: number | null;
    transporterId: number | null;
    receiverIds: number[];
}

export interface GetAviaTransfersParams {
    page?: number;
    limit?: number;
    sortBy?: 'departedAt';
    order?: 'asc' | 'desc';
    q?: string;
}

export interface AviaTransfersPagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface GetAviaTransfersResponse {
    items: AviaTransferDto[];
    pagination: AviaTransfersPagination;
}

export type GetAviaTransferByIdResponse = AviaTransferDto;

export interface CreateAviaTransferPayload {
    departedAt: string | null;
    invoiceNumber: string | null;
    cargoData: AviaCargoData;
    usdRate: number | null;
    cnyRate: number | null;
    transporterId: number;
    receiverIds: number[];
}

export interface CreateAviaTransferInput {
    payload: CreateAviaTransferPayload;
}

export interface UpdateAviaTransferPayload extends Partial<CreateAviaTransferPayload> {}

export interface UpdateAviaTransferInput {
    payload: UpdateAviaTransferPayload;
}
