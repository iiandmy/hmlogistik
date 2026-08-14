import type { Prisma, TransporterType } from '@hmlogistik/database';
import type { UploadedFile } from '../files/interfaces/transfer-file-response.interface';
import type { TransferWithPaymentDetails } from '../transfer-payment-details/transfer-payment-details.service';
import type { CreateTransferDto } from './dto/create-transfer.dto';
import type { QueryTransfersDto } from './dto/query-transfers.dto';
import type { UpdateTransferDto } from './dto/update-transfer.dto';
import type {
    PaginatedTransfersResponse,
    TransferResponse,
} from './interfaces/transfer-response.interface';
import { TransporterType as TransporterTypeEnum } from '@hmlogistik/database';
import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../providers/prisma/prisma.service';
import { FilesService } from '../files/files.service';
import { TransferPaymentDetailsService } from '../transfer-payment-details/transfer-payment-details.service';

const SORTABLE_COLUMNS: Record<string, string> = {
    createdAt: 'createdAt',
    shippedAt: 'shippedAt',
};

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

type TransferRow = TransferWithPaymentDetails;

@Injectable()
export class TransfersService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly filesService: FilesService,
        private readonly transferPaymentDetailsService: TransferPaymentDetailsService,
    ) {}

    private normalizeLegacyValue(value: string | null): string | null {
        const trimmed = value?.trim() ?? '';
        return trimmed.length > 0 ? trimmed : null;
    }

    private mapRowToResponse(row: TransferRow): TransferResponse {
        if (row.transporterRecord.type !== TransporterTypeEnum.Rail) {
            throw new BadRequestException('Transfer transporter must be Rail');
        }

        return {
            id: Number(row.id),
            createdAt: row.createdAt?.toISOString() ?? null,
            shippedAt: row.shippedAt?.toISOString() ?? null,
            declarationDate: row.declarationDate?.toISOString() ?? null,
            actDate: row.actDate?.toISOString() ?? null,
            ...this.transferPaymentDetailsService.getEditability(row),
            paymentAlert: this.transferPaymentDetailsService.mapTransferToPaymentDetailsResponse(row).paymentAlert,
            legacyTransporter: this.normalizeLegacyValue(row.transporter),
            legacyReceiver: this.normalizeLegacyValue(row.receiver),
            transporter: {
                id: Number(row.transporterRecord.id),
                name: row.transporterRecord.name,
                type: 'Rail',
                isPlaceholder: row.transporterRecord.isPlaceholder,
                paymentDelayDays: row.transporterRecord.paymentDelayDays ?? 0,
                paymentDelayExceptions: row.transporterRecord.delayRules.map(rule => ({
                    receiverId: Number(rule.receiver.id),
                    receiverName: rule.receiver.name,
                    paymentDelayDays: rule.paymentDelayDays,
                })),
            },
            receivers: row.receiverLinks.map(link => ({
                id: Number(link.receiver.id),
                name: link.receiver.name,
                isPlaceholder: link.receiver.isPlaceholder,
            })),
            container: row.container,
            price: Number(row.price),
            cargo: row.cargo,
            files: [],
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

    async findAll(query: QueryTransfersDto): Promise<PaginatedTransfersResponse> {
        const page = query.page ?? DEFAULT_PAGE;
        const limit = Math.min(query.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
        const sortBy = query.sortBy ?? 'createdAt';
        const order = query.order ?? 'desc';
        const searchQuery = query.q?.trim().replaceAll(/[,()]/g, ' ') ?? '';
        const priceMin = query.priceMin;
        const priceMax = query.priceMax;

        if (
            priceMin !== undefined
            && priceMax !== undefined
            && priceMin > priceMax
        ) {
            throw new BadRequestException(
                'priceMin cannot be greater than priceMax.',
            );
        }

        const sortColumn = SORTABLE_COLUMNS[sortBy] ?? 'createdAt';
        const isAscending = order === 'asc';
        const skip = (page - 1) * limit;

        const where: Prisma.TransferWhereInput = {};

        if (searchQuery.length > 0) {
            where.OR = [
                { transporter: { contains: searchQuery, mode: 'insensitive' } },
                { receiver: { contains: searchQuery, mode: 'insensitive' } },
                { transporterRecord: { name: { contains: searchQuery, mode: 'insensitive' } } },
                { receiverLinks: { some: { receiver: { name: { contains: searchQuery, mode: 'insensitive' } } } } },
                { container: { contains: searchQuery, mode: 'insensitive' } },
                { cargo: { contains: searchQuery, mode: 'insensitive' } },
            ];
        }

        if (priceMin !== undefined) {
            const priceFilter = (where.price ?? {}) as Prisma.DecimalFilter;
            where.price = {
                ...priceFilter,
                gte: priceMin,
            };
        }

        if (priceMax !== undefined) {
            const priceFilter = (where.price ?? {}) as Prisma.DecimalFilter;
            where.price = {
                ...priceFilter,
                lte: priceMax,
            };
        }

        const include = {
            transporterRecord: {
                include: {
                    delayRules: {
                        include: { receiver: true },
                        orderBy: { receiver: { name: 'asc' as const } },
                    },
                },
            },
            receiverLinks: {
                include: { receiver: true },
                orderBy: { receiver: { name: 'asc' as const } },
            },
            paymentDetails: {
                include: {
                    shares: {
                        include: {
                            receiver: true,
                        },
                    },
                    payments: {
                        include: {
                            receiver: true,
                        },
                    },
                },
            },
        } satisfies Prisma.TransferInclude;

        const [rows, total] = await Promise.all([
            this.prisma.transfer.findMany({
                where,
                include,
                orderBy: { [sortColumn]: isAscending ? 'asc' : 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.transfer.count({ where }),
        ]);

        const items = rows.map(row => this.mapRowToResponse(row));
        const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

        return {
            items,
            pagination: {
                page,
                limit,
                total,
                totalPages,
            },
        };
    }

    async findById(id: number): Promise<TransferResponse> {
        const row = await this.prisma.transfer.findUnique({
            where: { id },
            include: {
                transporterRecord: {
                    include: {
                        delayRules: {
                            include: { receiver: true },
                            orderBy: { receiver: { name: 'asc' } },
                        },
                    },
                },
                receiverLinks: {
                    include: { receiver: true },
                    orderBy: { receiver: { name: 'asc' } },
                },
                paymentDetails: {
                    include: {
                        shares: {
                            include: {
                                receiver: true,
                            },
                        },
                        payments: {
                            include: {
                                receiver: true,
                            },
                        },
                    },
                },
            },
        });

        if (!row) {
            throw new NotFoundException('Transfer not found');
        }

        const files = await this.filesService.getFilesByEntity('transfer', id);
        const response = this.mapRowToResponse(row);
        response.files = files;
        return response;
    }

    async create(dto: CreateTransferDto, files: UploadedFile[]): Promise<void> {
        const validationError = this.filesService.validateFiles(files);
        if (validationError) {
            throw new BadRequestException(validationError);
        }

        await this.ensureTransporter(dto.transporterId, TransporterTypeEnum.Rail);
        await this.ensureReceivers(dto.receiverIds);

        const created = await this.prisma.$transaction(async (prisma) => {
            const transfer = await prisma.transfer.create({
                data: {
                    createdAt: dto.createdAt ? new Date(dto.createdAt) : null,
                    shippedAt: dto.shippedAt ? new Date(dto.shippedAt) : null,
                    declarationDate: dto.declarationDate ? new Date(dto.declarationDate) : null,
                    actDate: dto.actDate ? new Date(dto.actDate) : null,
                    transporter: '',
                    receiver: '',
                    transporterId: dto.transporterId,
                    receiverLinks: {
                        createMany: {
                            data: dto.receiverIds.map(receiverId => ({ receiverId })),
                        },
                    },
                    container: dto.container ?? null,
                    price: dto.price,
                    cargo: dto.cargo.trim(),
                },
                select: { id: true },
            });

            await this.transferPaymentDetailsService.ensurePaymentDetailsExists(Number(transfer.id), prisma);
            return transfer;
        });

        const transferId = Number(created.id);

        try {
            await this.filesService.uploadFiles('transfer', transferId, files);
        }
        catch (error) {
            await this.prisma.transfer
                .delete({ where: { id: created.id } })
                .catch(() => {});
            throw error;
        }
    }

    async update(
        id: number,
        dto: UpdateTransferDto,
        files: UploadedFile[],
        removedFileIds: number[],
    ): Promise<void> {
        const existing = await this.prisma.transfer.findUnique({
            where: { id },
            include: {
                paymentDetails: {
                    include: {
                        shares: {
                            include: {
                                receiver: true,
                            },
                        },
                        payments: {
                            include: {
                                receiver: true,
                            },
                        },
                    },
                },
            },
        });

        if (!existing) {
            throw new NotFoundException('Transfer not found');
        }

        const validationError = this.filesService.validateFiles(files);
        if (validationError) {
            throw new BadRequestException(validationError);
        }

        const existingFilesCount = await this.filesService.countFilesByEntity(id);
        const resultingFilesCount = existingFilesCount - removedFileIds.length + files.length;
        if (resultingFilesCount > 10) {
            throw new BadRequestException('A transfer can include at most 10 files.');
        }

        if (dto.transporterId !== undefined) {
            await this.ensureTransporter(dto.transporterId, TransporterTypeEnum.Rail);
        }

        if (dto.receiverIds !== undefined) {
            await this.ensureReceivers(dto.receiverIds);
        }

        const hasAssignedShares = (existing.paymentDetails?.shares ?? []).some(share => share.amount !== null);
        const hasPayments = (existing.paymentDetails?.payments.length ?? 0) > 0;

        if ((hasAssignedShares || hasPayments) && dto.receiverIds !== undefined) {
            throw new BadRequestException('Receivers cannot be changed after payment shares or payments were added');
        }

        if ((hasAssignedShares || hasPayments) && dto.price !== undefined) {
            throw new BadRequestException('Price cannot be changed after payment shares or payments were added');
        }

        const updateData: Prisma.TransferUpdateInput = {};
        if (dto.createdAt !== undefined) {
            updateData.createdAt = dto.createdAt ? new Date(dto.createdAt) : null;
        }
        if (dto.shippedAt !== undefined) {
            updateData.shippedAt = dto.shippedAt ? new Date(dto.shippedAt) : null;
        }
        if (dto.declarationDate !== undefined) {
            updateData.declarationDate = dto.declarationDate ? new Date(dto.declarationDate) : null;
        }
        if (dto.actDate !== undefined) {
            updateData.actDate = dto.actDate ? new Date(dto.actDate) : null;
        }
        if (dto.transporterId !== undefined) {
            updateData.transporterRecord = { connect: { id: dto.transporterId } };
        }
        if (dto.container !== undefined) {
            updateData.container = dto.container;
        }
        if (dto.price !== undefined) {
            updateData.price = dto.price;
        }
        if (dto.cargo !== undefined) {
            updateData.cargo = dto.cargo.trim();
        }

        await this.prisma.$transaction(async (prisma) => {
            if (Object.keys(updateData).length > 0) {
                await prisma.transfer.update({
                    where: { id },
                    data: updateData,
                });
            }

            if (dto.receiverIds !== undefined) {
                await prisma.transferReceiver.deleteMany({ where: { transferId: id } });
                await prisma.transferReceiver.createMany({
                    data: dto.receiverIds.map(receiverId => ({
                        transferId: id,
                        receiverId,
                    })),
                });
            }
        });

        if (removedFileIds.length > 0) {
            await this.filesService.deleteFilesByIds('transfer', id, removedFileIds);
        }

        if (files.length > 0) {
            await this.filesService.uploadFiles('transfer', id, files);
        }
    }
}
