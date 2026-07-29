// TODO: implement when backend is ready
export class ReceiverNotFoundError extends Error {
    constructor(message = 'Receiver not found') {
        super(message);
        this.name = 'ReceiverNotFoundError';
    }
}

export const ReceiverErrorCode = {
    NOT_FOUND: 'NOT_FOUND',
    FETCH_FAILED: 'FETCH_FAILED',
} as const;
