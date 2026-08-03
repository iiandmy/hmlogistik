export type TransporterType = 'Rail' | 'Avia';

export interface TransporterDelayExceptionDto {
    receiver: {
        id: number;
        name: string;
        isPlaceholder: boolean;
    };
    paymentDelayDays: number;
}

export interface TransporterDto {
    id: number;
    name: string;
    type: TransporterType;
    isPlaceholder: boolean;
    paymentDelayDays: number | null;
    paymentDelayExceptions: TransporterDelayExceptionDto[];
    createdAt: string;
    updatedAt: string;
}

export interface TransportersListResponse {
    items: TransporterDto[];
}

export interface GetTransportersParams {
    type?: TransporterType;
    q?: string;
}

export interface CreateTransporterPayload {
    name: string;
    type: TransporterType;
    paymentDelayDays: number | null;
    paymentDelayExceptions: Array<{
        receiverId: number;
        paymentDelayDays: number;
    }>;
}

export interface UpdateTransporterPayload {
    name?: string;
    paymentDelayDays?: number | null;
    paymentDelayExceptions?: Array<{
        receiverId: number;
        paymentDelayDays: number;
    }>;
}
