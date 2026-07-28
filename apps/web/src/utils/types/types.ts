import type { Dayjs } from 'dayjs';

export interface Transfer {
    id: number;
    createdAt: Dayjs | null;
    shippedAt: Dayjs | null;
    transporter: string;
    receiver: string;
    container: string;
    price: string;
    cargo: string;
}
