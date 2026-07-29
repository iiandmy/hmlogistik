import type { Transfer as PrismaTransfer } from '@hmlogistik/database';
import type { Dayjs } from 'dayjs';

export type Transfer = Omit<PrismaTransfer, 'id' | 'createdAt' | 'shippedAt' | 'price' | 'files'> & {
    id: number;
    createdAt: Dayjs | null;
    shippedAt: Dayjs | null;
    container: string;
    price: string;
};
