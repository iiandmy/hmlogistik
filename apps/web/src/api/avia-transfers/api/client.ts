// TODO: implement when backend is ready
import { AVIA_TRANSFERS_ENDPOINT } from './constants';

export const aviaTransfersApi = {
    async getAll(): Promise<never> {
        throw new Error(`${AVIA_TRANSFERS_ENDPOINT} is not implemented yet`);
    },

    async getById(_id: string): Promise<never> {
        throw new Error(`${AVIA_TRANSFERS_ENDPOINT} is not implemented yet`);
    },

    async create(): Promise<never> {
        throw new Error(`${AVIA_TRANSFERS_ENDPOINT} is not implemented yet`);
    },

    async update(): Promise<never> {
        throw new Error(`${AVIA_TRANSFERS_ENDPOINT} is not implemented yet`);
    },
};
