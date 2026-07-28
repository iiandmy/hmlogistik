import type { TransferFileDto } from './types';
import { TransferNotFoundError } from './get-transfer-by-id';

export async function getTransferFiles(id: string): Promise<TransferFileDto[]> {
    const response = await fetch(`/api/transfers/${id}/files`);

    if (response.status === 404) {
        throw new TransferNotFoundError();
    }

    if (!response.ok) {
        throw new Error('Не удалось загрузить файлы отправки');
    }

    return response.json() as Promise<TransferFileDto[]>;
}
