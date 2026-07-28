import type { Dayjs } from 'dayjs';

export interface CargoData {
    weight: number;
    volume: number;
    cargoSpaces: number;
}

export interface AviaTransfer {
    id: number;
    departedAt?: Dayjs | null;
    invoiceNumber?: string;
    cargoData: CargoData;
    usdRate?: number;
    cnyRate?: number;
    transporter: string;
    receiver: string;
}
