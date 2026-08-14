export const transferPaymentDetailsKeys = {
    all: ['transfer-payment-details'] as const,
    detail: (transferId: string) => ['transfer-payment-details', 'detail', transferId] as const,
};
