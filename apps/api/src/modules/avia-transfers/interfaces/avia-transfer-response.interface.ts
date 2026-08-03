export interface AviaTransferCargoDataResponse {
    cargoSpaces: number;
    volume: number;
    weight: number;
}

export interface AviaTransferReceiverResponse {
    id: number;
    name: string;
    isPlaceholder: boolean;
}

export interface AviaTransferTransporterResponse {
    id: number;
    name: string;
    type: 'Avia';
    isPlaceholder: boolean;
}

export interface AviaTransferResponse {
    id: number;
    departedAt: string | null;
    invoiceNumber: string | null;
    cargoData: AviaTransferCargoDataResponse;
    usdRate: number | null;
    cnyRate: number | null;
    legacyTransporter: string | null;
    legacyReceiver: string | null;
    transporter: AviaTransferTransporterResponse;
    receivers: AviaTransferReceiverResponse[];
}

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface PaginatedAviaTransfersResponse {
    items: AviaTransferResponse[];
    pagination: PaginationMeta;
}
