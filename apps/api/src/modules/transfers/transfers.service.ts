import { PrismaService } from '../../providers/prisma/prisma.service';
import { FilesService } from '../files/files.service';
import type { UploadedFile } from '../files/interfaces/transfer-file-response.interface';
import type { CreateTransferDto } from './dto/create-transfer.dto';
import type { QueryTransfersDto } from './dto/query-transfers.dto';
import type { UpdateTransferDto } from './dto/update-transfer.dto';
import type {
    PaginatedTransfersResponse,
    TransferResponse,
} from './interfaces/transfer-response.interface';
import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

const SORTABLE_COLUMNS: Record<string, string> = {
    createdAt: 'createdAt',
    shippedAt: 'shippedAt',
};

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

@Injectable()
export class TransfersService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly filesService: FilesService,
    ) {}

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

        const where: Record<string, unknown> = {};

        if (searchQuery.length > 0) {
            where.OR = [
                { transporter: { contains: searchQuery, mode: 'insensitive' } },
                { receiver: { contains: searchQuery, mode: 'insensitive' } },
                { container: { contains: searchQuery, mode: 'insensitive' } },
                { cargo: { contains: searchQuery, mode: 'insensitive' } },
            ];
        }

        if (priceMin !== undefined) {
            where.price = {
                ...(where.price ?? {}),
                gte: priceMin,
            };
        }

        if (priceMax !== undefined) {
            where.price = {
                ...(where.price ?? {}),
                lte: priceMax,
            };
        }

        const [rows, total] = await Promise.all([
            this.prisma.transfer.findMany({
                where,
                orderBy: { [sortColumn]: isAscending ? 'asc' : 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.transfer.count({ where }),
        ]);

        const items: TransferResponse[] = rows.map(row => ({
            id: Number(row.id),
            createdAt: row.createdAt?.toISOString() ?? null,
            shippedAt: row.shippedAt?.toISOString() ?? null,
            transporter: row.transporter,
            receiver: row.receiver,
            container: row.container,
            price: Number(row.price),
            cargo: row.cargo,
            files: [],
        }));

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
        });

        if (!row) {
            throw new NotFoundException('Transfer not found');
        }

        const files = await this.filesService.getFilesByEntity('transfer', id);

        return {
            id: Number(row.id),
            createdAt: row.createdAt?.toISOString() ?? null,
            shippedAt: row.shippedAt?.toISOString() ?? null,
            transporter: row.transporter,
            receiver: row.receiver,
            container: row.container,
            price: Number(row.price),
            cargo: row.cargo,
            files,
        };
    }

    async create(dto: CreateTransferDto, files: UploadedFile[]): Promise<void> {
        const validationError = this.filesService.validateFiles(files);
        if (validationError) {
            throw new BadRequestException(validationError);
        }

        const created = await this.prisma.transfer.create({
            data: {
                createdAt: dto.createdAt ? new Date(dto.createdAt) : null,
                shippedAt: dto.shippedAt ? new Date(dto.shippedAt) : null,
                transporter: dto.transporter,
                receiver: dto.receiver,
                container: dto.container ?? null,
                price: dto.price,
                cargo: dto.cargo,
            },
            select: { id: true },
        });

        const transferId = Number(created.id);

        try {
            await this.filesService.uploadFiles('transfer', transferId, files);
        }
        catch (error) {
            // Rollback transfer creation if file upload fails
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
            select: { id: true },
        });

        if (!existing) {
            throw new NotFoundException('Transfer not found');
        }

        const validationError = this.filesService.validateFiles(files);
        if (validationError) {
            throw new BadRequestException(validationError);
        }

        // Check resulting files count
        const existingFilesCount = await this.filesService.countFilesByEntity(id);
        const resultingFilesCount
            = existingFilesCount - removedFileIds.length + files.length;
        if (resultingFilesCount > 10) {
            throw new BadRequestException('A transfer can include at most 10 files.');
        }

        // Build update payload
        const updateData: Record<string, unknown> = {};
        if (dto.createdAt !== undefined) {
            updateData.createdAt = dto.createdAt ? new Date(dto.createdAt) : null;
        }
        if (dto.shippedAt !== undefined) {
            updateData.shippedAt = dto.shippedAt ? new Date(dto.shippedAt) : null;
        }
        if (dto.transporter !== undefined) {
            updateData.transporter = dto.transporter;
        }
        if (dto.receiver !== undefined) {
            updateData.receiver = dto.receiver;
        }
        if (dto.container !== undefined) {
            updateData.container = dto.container;
        }
        if (dto.price !== undefined) {
            updateData.price = dto.price;
        }
        if (dto.cargo !== undefined) {
            updateData.cargo = dto.cargo;
        }

        // Update transfer if there are fields to update
        if (Object.keys(updateData).length > 0) {
            await this.prisma.transfer.update({
                where: { id },
                data: updateData,
            });
        }

        // Delete removed files
        if (removedFileIds.length > 0) {
            await this.filesService.deleteFilesByIds('transfer', id, removedFileIds);
        }

        // Upload new files
        if (files.length > 0) {
            await this.filesService.uploadFiles('transfer', id, files);
        }
    }
}
