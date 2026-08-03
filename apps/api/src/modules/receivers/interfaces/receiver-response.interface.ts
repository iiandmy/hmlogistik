export interface ReceiverResponse {
    id: number;
    name: string;
    isPlaceholder: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ReceiversListResponse {
    items: ReceiverResponse[];
}
