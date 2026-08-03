import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

export interface ParsedMultipartBody<T> {
    dto: T;
    removedFileIds: number[];
}

@Injectable()
export class ParseMultipartBodyPipe<T extends object> implements PipeTransform {
    constructor(private readonly dtoClass: new () => T) {}

    async transform(
        value: Record<string, unknown>,
    ): Promise<ParsedMultipartBody<T>> {
        const rawPayload = value.payload;
        if (typeof rawPayload !== 'string') {
            throw new BadRequestException('`payload` must be a JSON string.');
        }

        let parsedPayload: unknown;
        try {
            parsedPayload = JSON.parse(rawPayload);
        }
        catch {
            throw new BadRequestException('`payload` must be a valid JSON string.');
        }

        const dtoInstance = plainToInstance(this.dtoClass, parsedPayload);
        const errors = await validate(dtoInstance);

        if (errors.length > 0) {
            const messages = errors.map((err) => {
                const constraints = err.constraints ?? {};
                return Object.values(constraints).join(', ');
            });
            throw new BadRequestException(messages.join('; '));
        }

        let removedFileIds: number[] = [];
        const rawRemovedFileIds = value.removedFileIds;
        if (typeof rawRemovedFileIds === 'string') {
            try {
                const parsed = JSON.parse(rawRemovedFileIds);
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

        return { dto: dtoInstance, removedFileIds };
    }
}
