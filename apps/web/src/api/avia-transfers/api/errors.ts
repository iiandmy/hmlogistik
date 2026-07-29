// TODO: implement when backend is ready
export class AviaTransferNotFoundError extends Error {
    constructor(message = 'Avia transfer not found') {
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
