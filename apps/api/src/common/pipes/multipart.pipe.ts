import type { PipeTransform } from '@nestjs/common';
import type { UploadedFile } from '../../modules/files/interfaces/transfer-file-response.interface';
import { BadRequestException, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

export interface MultipartParsedResult<T> {
    payload: T;
    files: UploadedFile[];
    removedFileIds: number[];
}

@Injectable()
export class MultipartPipe<T extends object> implements PipeTransform {
    constructor(private readonly dtoClass: new () => T) {}

    async transform(value: unknown): Promise<MultipartParsedResult<T>> {
        if (
            !(value instanceof Object)
            || !('payload' in (value as Record<string, unknown>))
        ) {
            throw new BadRequestException(
                'Multipart form data with `payload` field is required.',
            );
        }

        const raw = value as Record<string, unknown>;

        // Parse payload JSON
        let rawPayload: unknown;
        try {
            rawPayload = JSON.parse(raw.payload as string);
        }
        catch {
            throw new BadRequestException('`payload` must be a valid JSON string.');
        }

        // Validate with class-validator
        const dtoInstance = plainToInstance(this.dtoClass, rawPayload);
        const errors = await validate(dtoInstance);

        if (errors.length > 0) {
            const messages = errors.map((err) => {
                const constraints = err.constraints ?? {};
                return Object.values(constraints).join(', ');
            });
            throw new BadRequestException(messages.join('; '));
        }

        // Extract files
        const files: UploadedFile[] = (raw.files ?? []) as UploadedFile[];

        // Extract removedFileIds
        let removedFileIds: number[] = [];
        if (raw.removedFileIds) {
            try {
                const parsed = JSON.parse(raw.removedFileIds as string);
                if (Array.isArray(parsed)) {
                    removedFileIds = parsed.filter(
                        (id: unknown): id is number =>
                            typeof id === 'number' && Number.isInteger(id) && id > 0,
                    );
                }
            }
            catch {
                throw new BadRequestException(
                    '`removedFileIds` must be a valid JSON array.',
                );
            }
        }

        return {
            payload: dtoInstance,
            files,
            removedFileIds,
        };
    }
}
