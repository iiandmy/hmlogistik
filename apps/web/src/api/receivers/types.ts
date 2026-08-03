export interface ReceiverDto {
    id: number;
    name: string;
    isPlaceholder: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ReceiversListResponse {
    items: ReceiverDto[];
}

export interface GetReceiversParams {
    q?: string;
}

export interface CreateReceiverPayload {
    name: string;
}

export interface UpdateReceiverPayload {
    name?: string;
}
