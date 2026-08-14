import type { Dayjs } from 'dayjs';

export interface TransferFormValues {
    id: number;
    createdAt: Dayjs | null;
    shippedAt: Dayjs | null;
    declarationDate: Dayjs | null;
    actDate: Dayjs | null;
    transporterId: number | null;
    receiverIds: number[];
    container: string;
    price: string;
    cargo: string;
}
