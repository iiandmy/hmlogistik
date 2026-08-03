import type { Prisma, TransporterType } from '@hmlogistik/database';
import type { CreateAviaTransferDto } from './dto/create-avia-transfer.dto';
import type { QueryAviaTransfersDto } from './dto/query-avia-transfers.dto';
import type { UpdateAviaTransferDto } from './dto/update-avia-transfer.dto';
import type {
    AviaTransferResponse,
    PaginatedAviaTransfersResponse,
} from './interfaces/avia-transfer-response.interface';
import { TransporterType as TransporterTypeEnum } from '@hmlogistik/database';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../providers/prisma/prisma.service';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

type AviaTransferRow = Prisma.AviaTransferGetPayload<{
    include: {
        transporterRecord: true;
        receiverLinks: {
            include: {
                receiver: true;
            };
            orderBy: {
                receiver: {
                    name: 'asc';
                };
            };
        };
    };
}>;

@Injectable()
export class AviaTransfersService {
    constructor(private readonly prisma: PrismaService) {}

    private normalizeLegacyValue(value: string | null): string | null {
        const trimmed = value?.trim() ?? '';
        return trimmed.length > 0 ? trimmed : null;
    }

    private mapRowToResponse(row: AviaTransferRow): AviaTransferResponse {
        if (row.transporterRecord.type !== TransporterTypeEnum.Avia) {
            throw new BadRequestException('Avia transfer transporter must be Avia');
        }

        return {
            id: Number(row.id),
            departedAt: row.departedAt?.toISOString() ?? null,
            invoiceNumber: row.invoiceNumber,
            cargoData: {
                cargoSpaces: row.cargoSpaces,
                volume: Number(row.volume),
                weight: Number(row.weight),
            },
            usdRate: row.usdRate === null ? null : Number(row.usdRate),
            cnyRate: row.cnyRate === null ? null : Number(row.cnyRate),
            legacyTransporter: this.normalizeLegacyValue(row.transporter),
            legacyReceiver: this.normalizeLegacyValue(row.receiver),
            transporter: {
                id: Number(row.transporterRecord.id),
                name: row.transporterRecord.name,
                type: 'Avia',
                isPlaceholder: row.transporterRecord.isPlaceholder,
            },
            receivers: row.receiverLinks.map(link => ({
                id: Number(link.receiver.id),
                name: link.receiver.name,
                isPlaceholder: link.receiver.isPlaceholder,
            })),
        };
    }

    private async ensureTransporter(id: number, type: TransporterType): Promise<void> {
        const transporter = await this.prisma.transporter.findUnique({
            where: { id },
            select: { type: true },
        });

        if (!transporter) {
            throw new BadRequestException('Transporter not found');
        }

        if (transporter.type !== type) {
            throw new BadRequestException(`Transporter must be of type ${type}`);
        }
    }

    private async ensureReceivers(receiverIds: number[]): Promise<void> {
        const uniqueReceiverIds = [...new Set(receiverIds)];
        const count = await this.prisma.receiver.count({
            where: { id: { in: uniqueReceiverIds } },
        });

        if (count !== uniqueReceiverIds.length) {
            throw new BadRequestException('One or more receivers were not found');
        }
    }

    async findAll(query: QueryAviaTransfersDto): Promise<PaginatedAviaTransfersResponse> {
        const page = query.page ?? DEFAULT_PAGE;
        const limit = Math.min(query.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
        const order = query.order ?? 'desc';
        const searchQuery = query.q?.trim().replaceAll(/[,()]/g, ' ') ?? '';
        const skip = (page - 1) * limit;

        const where: Prisma.AviaTransferWhereInput = {};

        if (searchQuery.length > 0) {
            where.OR = [
                { transporter: { contains: searchQuery, mode: 'insensitive' } },
                { receiver: { contains: searchQuery, mode: 'insensitive' } },
                { transporterRecord: { name: { contains: searchQuery, mode: 'insensitive' } } },
                { receiverLinks: { some: { receiver: { name: { contains: searchQuery, mode: 'insensitive' } } } } },
                { invoiceNumber: { contains: searchQuery, mode: 'insensitive' } },
            ];
        }

        const sortOrder: Prisma.SortOrder = order === 'asc' ? 'asc' : 'desc';
        const orderBy: Prisma.AviaTransferOrderByWithRelationInput = {
            departedAt: sortOrder,
        };

        const include = {
            transporterRecord: true,
            receiverLinks: {
                include: { receiver: true },
                orderBy: { receiver: { name: 'asc' as const } },
            },
        } satisfies Prisma.AviaTransferInclude;

        const [rows, total] = await Promise.all([
            this.prisma.aviaTransfer.findMany({
                where,
                include,
                orderBy,
                skip,
                take: limit,
            }),
            this.prisma.aviaTransfer.count({ where }),
        ]);

        const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

        return {
            items: rows.map(row => this.mapRowToResponse(row)),
            pagination: {
                page,
                limit,
                total,
                totalPages,
            },
        };
    }

    async findById(id: number): Promise<AviaTransferResponse> {
        const row = await this.prisma.aviaTransfer.findUnique({
            where: { id },
            include: {
                transporterRecord: true,
                receiverLinks: {
                    include: { receiver: true },
                    orderBy: { receiver: { name: 'asc' } },
                },
            },
        });

        if (!row) {
            throw new NotFoundException('Avia transfer not found');
        }

        return this.mapRowToResponse(row);
    }

    async create(dto: CreateAviaTransferDto): Promise<void> {
        await this.ensureTransporter(dto.transporterId, TransporterTypeEnum.Avia);
        await this.ensureReceivers(dto.receiverIds);

        await this.prisma.aviaTransfer.create({
            data: {
                departedAt: dto.departedAt ? new Date(dto.departedAt) : null,
                invoiceNumber: dto.invoiceNumber?.trim() || null,
                cargoSpaces: dto.cargoData.cargoSpaces,
                volume: dto.cargoData.volume,
                weight: dto.cargoData.weight,
                usdRate: dto.usdRate ?? null,
                cnyRate: dto.cnyRate ?? null,
                transporter: '',
                receiver: '',
                transporterId: dto.transporterId,
                receiverLinks: {
                    createMany: {
                        data: dto.receiverIds.map(receiverId => ({ receiverId })),
                    },
                },
            },
        });
    }

    async update(id: number, dto: UpdateAviaTransferDto): Promise<void> {
        const existing = await this.prisma.aviaTransfer.findUnique({
            where: { id },
            select: { id: true },
        });

        if (!existing) {
            throw new NotFoundException('Avia transfer not found');
        }

        if (dto.transporterId !== undefined) {
            await this.ensureTransporter(dto.transporterId, TransporterTypeEnum.Avia);
        }

        if (dto.receiverIds !== undefined) {
            await this.ensureReceivers(dto.receiverIds);
        }

        const updateData: Prisma.AviaTransferUpdateInput = {};

        if (dto.departedAt !== undefined) {
            updateData.departedAt = dto.departedAt ? new Date(dto.departedAt) : null;
        }
        if (dto.invoiceNumber !== undefined) {
            updateData.invoiceNumber = dto.invoiceNumber?.trim() || null;
        }
        if (dto.cargoData !== undefined) {
            updateData.cargoSpaces = dto.cargoData.cargoSpaces;
            updateData.volume = dto.cargoData.volume;
            updateData.weight = dto.cargoData.weight;
        }
        if (dto.usdRate !== undefined) {
            updateData.usdRate = dto.usdRate;
        }
        if (dto.cnyRate !== undefined) {
            updateData.cnyRate = dto.cnyRate;
        }
        if (dto.transporterId !== undefined) {
            updateData.transporterRecord = { connect: { id: dto.transporterId } };
        }

        await this.prisma.$transaction(async (prisma) => {
            if (Object.keys(updateData).length > 0) {
                await prisma.aviaTransfer.update({
                    where: { id },
                    data: updateData,
                });
            }

            if (dto.receiverIds !== undefined) {
                await prisma.aviaTransferReceiver.deleteMany({ where: { aviaTransferId: id } });
                await prisma.aviaTransferReceiver.createMany({
                    data: dto.receiverIds.map(receiverId => ({
                        aviaTransferId: id,
                        receiverId,
                    })),
                });
            }
        });
    }
}
