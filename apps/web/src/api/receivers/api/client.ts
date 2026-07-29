// TODO: implement when backend is ready
import { RECEIVERS_ENDPOINT } from './constants';

export const receiversApi = {
    async getAll(): Promise<never> {
        throw new Error(`${RECEIVERS_ENDPOINT} is not implemented yet`);
    },
};
