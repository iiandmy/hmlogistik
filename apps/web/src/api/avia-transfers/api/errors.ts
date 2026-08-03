export class AviaTransferNotFoundError extends Error {
    constructor(message = 'Отправка авиа не найдена') {
        super(message);
        this.name = 'AviaTransferNotFoundError';
    }
}

export const AviaTransferErrorCode = {
    NOT_FOUND: 'NOT_FOUND',
    CREATE_FAILED: 'CREATE_FAILED',
    UPDATE_FAILED: 'UPDATE_FAILED',
    FETCH_FAILED: 'FETCH_FAILED',
} as const;
