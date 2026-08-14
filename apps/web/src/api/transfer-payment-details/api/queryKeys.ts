export const transferPaymentDetailsKeys = {
    all: ['transfer-payment-details'] as const,
    list: (params: { status?: 'paid' | 'unpaid' }) => ['transfer-payment-details', 'list', params] as const,
    detail: (transferId: string) => ['transfer-payment-details', 'detail', transferId] as const,
};
