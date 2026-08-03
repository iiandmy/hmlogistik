import type { TransporterType } from '@hmlogistik/database';

export interface TransporterDelayRuleResponse {
    receiver: {
        id: number;
        name: string;
        isPlaceholder: boolean;
    };
    paymentDelayDays: number;
}

export interface TransporterResponse {
    id: number;
    name: string;
    type: TransporterType;
    isPlaceholder: boolean;
    paymentDelayDays: number | null;
    paymentDelayExceptions: TransporterDelayRuleResponse[];
    createdAt: string;
    updatedAt: string;
}

export interface TransportersListResponse {
    items: TransporterResponse[];
}
