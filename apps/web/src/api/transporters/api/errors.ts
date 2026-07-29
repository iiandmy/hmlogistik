// TODO: implement when backend is ready
export class TransporterNotFoundError extends Error {
    constructor(message = 'Transporter not found') {
        super(message);
        this.name = 'TransporterNotFoundError';
    }
}

export const TransporterErrorCode = {
    NOT_FOUND: 'NOT_FOUND',
    FETCH_FAILED: 'FETCH_FAILED',
} as const;
