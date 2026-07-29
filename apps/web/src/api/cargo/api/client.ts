// TODO: implement when backend is ready
import { CARGO_ENDPOINT } from './constants';

export const cargoApi = {
    async getAll(): Promise<never> {
        throw new Error(`${CARGO_ENDPOINT} is not implemented yet`);
    },
};
