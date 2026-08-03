import type { Prisma } from '@hmlogistik/database';
import type { CreateReceiverDto } from './dto/create-receiver.dto';
import type { QueryReceiversDto } from './dto/query-receivers.dto';
import type { UpdateReceiverDto } from './dto/update-receiver.dto';
import type { ReceiverResponse, ReceiversListResponse } from './interfaces/receiver-response.interface';
import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../providers/prisma/prisma.service';

@Injectable()
export class ReceiversService {
    constructor(private readonly prisma: PrismaService) {}

    private mapRowToResponse(row: {
        id: bigint;
        name: string;
        isPlaceholder: boolean;
        createdAt: Date;
        updatedAt: Date;
    }): ReceiverResponse {
        return {
            id: Number(row.id),
            name: row.name,
            isPlaceholder: row.isPlaceholder,
            createdAt: row.createdAt.toISOString(),
            updatedAt: row.updatedAt.toISOString(),
        };
    }

    async findAll(query: QueryReceiversDto): Promise<ReceiversListResponse> {
        const searchQuery = query.q?.trim() ?? '';
        const where: Prisma.ReceiverWhereInput = searchQuery.length > 0
            ? {
                    name: { contains: searchQuery, mode: 'insensitive' },
                }
            : {};

        const rows = await this.prisma.receiver.findMany({
            where,
            orderBy: [
                { isPlaceholder: 'asc' },
                { name: 'asc' },
            ],
        });

        return {
            items: rows.map(row => this.mapRowToResponse(row)),
        };
    }

    async findById(id: number): Promise<ReceiverResponse> {
        const row = await this.prisma.receiver.findUnique({ where: { id } });

        if (!row) {
            throw new NotFoundException('Receiver not found');
        }

        return this.mapRowToResponse(row);
    }

    async create(dto: CreateReceiverDto): Promise<ReceiverResponse> {
        const name = dto.name.trim();

        const created = await this.prisma.receiver.create({
            data: {
                name,
            },
        });

        return this.mapRowToResponse(created);
    }

    async update(id: number, dto: UpdateReceiverDto): Promise<ReceiverResponse> {
        const existing = await this.prisma.receiver.findUnique({ where: { id } });

        if (!existing) {
            throw new NotFoundException('Receiver not found');
        }

        if (existing.isPlaceholder) {
            throw new BadRequestException('Placeholder receiver cannot be edited');
        }

        const updateData: Prisma.ReceiverUpdateInput = {};

        if (dto.name !== undefined) {
            updateData.name = dto.name.trim();
        }

        const updated = await this.prisma.receiver.update({
            where: { id },
            data: updateData,
        });

        return this.mapRowToResponse(updated);
    }
}
