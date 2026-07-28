import type { UpdateTransferInput } from './types';
import { TransferNotFoundError } from './get-transfer-by-id';

export async function updateTransfer(id: string, input: UpdateTransferInput): Promise<void> {
    const formData = new FormData();
    formData.append('payload', JSON.stringify(input.payload));
    for (const file of input.files) {
        formData.append('files', file);
    }
    formData.append('removedFileIds', JSON.stringify(input.removedFileIds));

    const response = await fetch(`/api/transfers/${id}`, {
        method: 'PATCH',
        body: formData,
    });

    if (response.status === 404) {
        throw new TransferNotFoundError();
    }

    if (!response.ok) {
        throw new Error('Не удалось обновить отправку');
    }
}
