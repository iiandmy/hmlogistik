// TODO: implement when backend is ready
export class CargoNotFoundError extends Error {
    constructor(message = 'Cargo not found') {
        super(message);
        this.name = 'CargoNotFoundError';
    }
}

export const CargoErrorCode = {
    NOT_FOUND: 'NOT_FOUND',
    FETCH_FAILED: 'FETCH_FAILED',
} as const;
