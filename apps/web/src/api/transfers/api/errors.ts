export class TransferNotFoundError extends Error {
    constructor(message = 'Transfer not found') {
        super(message);
        this.name = 'TransferNotFoundError';
    }
}

export const TransferErrorCode = {
    NOT_FOUND: 'NOT_FOUND',
    CREATE_FAILED: 'CREATE_FAILED',
    UPDATE_FAILED: 'UPDATE_FAILED',
    FETCH_FAILED: 'FETCH_FAILED',
} as const;
