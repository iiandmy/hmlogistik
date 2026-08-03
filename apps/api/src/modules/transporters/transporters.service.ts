import type { Prisma, TransporterType } from '@hmlogistik/database';
import type { CreateTransporterDto } from './dto/create-transporter.dto';
import type { QueryTransportersDto } from './dto/query-transporters.dto';
import type { UpdateTransporterDto } from './dto/update-transporter.dto';
import type {
    TransporterResponse,
    TransportersListResponse,
} from './interfaces/transporter-response.interface';
import { TransporterType as TransporterTypeEnum } from '@hmlogistik/database';
import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../providers/prisma/prisma.service';

interface TransporterRow {
    id: bigint;
    name: string;
    type: TransporterType;
    isPlaceholder: boolean;
    paymentDelayDays: number | null;
    createdAt: Date;
    updatedAt: Date;
    delayRules: Array<{
        paymentDelayDays: number;
        receiver: {
            id: bigint;
            name: string;
            isPlaceholder: boolean;
        };
    }>;
}

@Injectable()
export class TransportersService {
    constructor(private readonly prisma: PrismaService) {}

    private validatePayload(
        type: TransporterType,
        paymentDelayDays: number | null | undefined,
        paymentDelayExceptions: Array<{ receiverId: number; paymentDelayDays: number }> | undefined,
    ): void {
        if (type === TransporterTypeEnum.Rail) {
            if (paymentDelayDays === null || paymentDelayDays === undefined) {
                throw new BadRequestException('Rail transporter requires payment delay');
            }
            return;
        }

        if (paymentDelayDays !== null && paymentDelayDays !== undefined) {
            throw new BadRequestException('Avia transporter cannot have payment delay');
        }

        if ((paymentDelayExceptions?.length ?? 0) > 0) {
            throw new BadRequestException('Avia transporter cannot have payment delay exceptions');
        }
    }

    private mapRowToResponse(row: TransporterRow): TransporterResponse {
        return {
            id: Number(row.id),
            name: row.name,
            type: row.type,
            isPlaceholder: row.isPlaceholder,
            paymentDelayDays: row.paymentDelayDays,
            paymentDelayExceptions: row.delayRules.map(rule => ({
                receiver: {
                    id: Number(rule.receiver.id),
                    name: rule.receiver.name,
                    isPlaceholder: rule.receiver.isPlaceholder,
                },
                paymentDelayDays: rule.paymentDelayDays,
            })),
            createdAt: row.createdAt.toISOString(),
            updatedAt: row.updatedAt.toISOString(),
        };
    }

    async findAll(query: QueryTransportersDto): Promise<TransportersListResponse> {
        const searchQuery = query.q?.trim() ?? '';
        const where: Prisma.TransporterWhereInput = {
            ...(query.type ? { type: query.type } : {}),
            ...(searchQuery.length > 0
                ? { name: { contains: searchQuery, mode: 'insensitive' } }
                : {}),
        };

        const rows = await this.prisma.transporter.findMany({
            where,
            include: {
                delayRules: {
                    include: {
                        receiver: true,
                    },
                    orderBy: {
                        receiver: {
                            name: 'asc',
                        },
                    },
                },
            },
            orderBy: [
                { isPlaceholder: 'asc' },
                { name: 'asc' },
            ],
        });

        return {
            items: rows.map(row => this.mapRowToResponse(row)),
        };
    }

    async findById(id: number): Promise<TransporterResponse> {
        const row = await this.prisma.transporter.findUnique({
            where: { id },
            include: {
                delayRules: {
                    include: {
                        receiver: true,
                    },
                    orderBy: {
                        receiver: {
                            name: 'asc',
                        },
                    },
                },
            },
        });

        if (!row) {
            throw new NotFoundException('Transporter not found');
        }

        return this.mapRowToResponse(row);
    }

    async create(dto: CreateTransporterDto): Promise<TransporterResponse> {
        const name = dto.name.trim();
        this.validatePayload(dto.type, dto.paymentDelayDays, dto.paymentDelayExceptions);

        const created = await this.prisma.transporter.create({
            data: {
                name,
                type: dto.type,
                paymentDelayDays: dto.type === TransporterTypeEnum.Rail ? dto.paymentDelayDays ?? null : null,
                delayRules: dto.type === TransporterTypeEnum.Rail
                    ? {
                            create: dto.paymentDelayExceptions.map(rule => ({
                                paymentDelayDays: rule.paymentDelayDays,
                                receiver: { connect: { id: rule.receiverId } },
                            })),
                        }
                    : undefined,
            },
            include: {
                delayRules: {
                    include: { receiver: true },
                    orderBy: { receiver: { name: 'asc' } },
                },
            },
        });

        return this.mapRowToResponse(created);
    }

    async update(id: number, dto: UpdateTransporterDto): Promise<TransporterResponse> {
        const existing = await this.prisma.transporter.findUnique({
            where: { id },
            include: { delayRules: true },
        });

        if (!existing) {
            throw new NotFoundException('Transporter not found');
        }

        if (existing.isPlaceholder) {
            throw new BadRequestException('Placeholder transporter cannot be edited');
        }

        this.validatePayload(
            existing.type,
            dto.paymentDelayDays ?? existing.paymentDelayDays,
            dto.paymentDelayExceptions,
        );

        const updateData: Prisma.TransporterUpdateInput = {};

        if (dto.name !== undefined) {
            updateData.name = dto.name.trim();
        }

        if (existing.type === TransporterTypeEnum.Rail && dto.paymentDelayDays !== undefined) {
            updateData.paymentDelayDays = dto.paymentDelayDays;
        }

        const updated = await this.prisma.$transaction(async (prisma) => {
            await prisma.transporter.update({
                where: { id },
                data: updateData,
            });

            if (existing.type === TransporterTypeEnum.Rail && dto.paymentDelayExceptions !== undefined) {
                await prisma.transporterDelayRule.deleteMany({ where: { transporterId: id } });
                if (dto.paymentDelayExceptions.length > 0) {
                    await prisma.transporterDelayRule.createMany({
                        data: dto.paymentDelayExceptions.map(rule => ({
                            transporterId: id,
                            receiverId: rule.receiverId,
                            paymentDelayDays: rule.paymentDelayDays,
                        })),
                    });
                }
            }

            return prisma.transporter.findUniqueOrThrow({
                where: { id },
                include: {
                    delayRules: {
                        include: { receiver: true },
                        orderBy: { receiver: { name: 'asc' } },
                    },
                },
            });
        });

        return this.mapRowToResponse(updated);
    }
}
