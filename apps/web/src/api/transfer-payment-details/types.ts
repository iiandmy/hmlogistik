export interface TransferPaymentAlertDto {
    shouldShow: boolean;
    overdueReceivers: Array<{
        receiverId: number;
        receiverName: string;
    }>;
}

export interface TransferPaymentShareDto {
    receiverId: number;
    receiverName: string;
    amount: number | null;
    paidAmount: number;
    remainingAmount: number | null;
    isFullyPaid: boolean;
}

export interface TransferPaymentEntryDto {
    id: number;
    receiverId: number;
    receiverName: string;
    amount: number;
    paidAt: string;
    createdAt: string;
}

export interface TransferPaymentDetailsDto {
    transferId: number;
    transporter: {
        id: number;
        name: string;
    };
    totalDebt: number;
    totalPaid: number;
    totalRemaining: number;
    sharesLocked: boolean;
    sharesAssigned: boolean;
    shares: TransferPaymentShareDto[];
    payments: TransferPaymentEntryDto[];
    paymentAlert: TransferPaymentAlertDto;
}

export interface TransferPaymentOverviewReceiverDto {
    receiverId: number;
    receiverName: string;
    remainingAmount: number | null;
}

export interface TransferPaymentOverviewItemDto {
    transferId: number;
    cargo: string;
    transporterName: string;
    receivers: TransferPaymentOverviewReceiverDto[];
    isPaid: boolean;
}

export interface TransferPaymentOverviewListResponse {
    items: TransferPaymentOverviewItemDto[];
}

export interface GetTransferPaymentOverviewParams {
    status?: 'paid' | 'unpaid';
}

export interface UpdateTransferPaymentDetailsPayload {
    shares?: Array<{
        receiverId: number;
        amount: number | null;
    }>;
    newPayments?: Array<{
        receiverId: number;
        amount: number;
        paidAt: string;
    }>;
}
