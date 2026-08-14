export interface TransferPaymentAlertReceiverResponse {
    receiverId: number;
    receiverName: string;
}

export interface TransferPaymentOverviewReceiverResponse {
    receiverId: number;
    receiverName: string;
    remainingAmount: number | null;
}

export interface TransferPaymentOverviewItemResponse {
    transferId: number;
    cargo: string;
    transporterName: string;
    receivers: TransferPaymentOverviewReceiverResponse[];
    isPaid: boolean;
}

export interface TransferPaymentOverviewListResponse {
    items: TransferPaymentOverviewItemResponse[];
}

export interface TransferPaymentAlertResponse {
    shouldShow: boolean;
    overdueReceivers: TransferPaymentAlertReceiverResponse[];
}

export interface TransferPaymentShareResponse {
    receiverId: number;
    receiverName: string;
    amount: number | null;
    paidAmount: number;
    remainingAmount: number | null;
    isFullyPaid: boolean;
}

export interface TransferPaymentEntryResponse {
    id: number;
    receiverId: number;
    receiverName: string;
    amount: number;
    paidAt: string;
    createdAt: string;
}

export interface TransferPaymentDetailsResponse {
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
    shares: TransferPaymentShareResponse[];
    payments: TransferPaymentEntryResponse[];
    paymentAlert: TransferPaymentAlertResponse;
}
