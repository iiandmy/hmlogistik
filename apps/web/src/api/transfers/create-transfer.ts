import type { CreateTransferInput } from './types';

export async function createTransfer(input: CreateTransferInput): Promise<void> {
    const formData = new FormData();
    formData.append('payload', JSON.stringify(input.payload));
    for (const file of input.files) {
        formData.append('files', file);
    }

    const response = await fetch('/api/transfers', {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        throw new Error('Не удалось создать отправку');
    }
}
