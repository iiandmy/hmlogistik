// TODO: implement when backend is ready
import { TRANSPORTERS_ENDPOINT } from './constants';

export const transportersApi = {
    async getAll(): Promise<never> {
        throw new Error(`${TRANSPORTERS_ENDPOINT} is not implemented yet`);
    },
};
