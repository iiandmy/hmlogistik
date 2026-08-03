import type {
    AviaTransferResponse,
    PaginatedAviaTransfersResponse,
} from './interfaces/avia-transfer-response.interface';
import {
    Body,
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
    ValidationPipe,
} from '@nestjs/common';
import { AviaTransfersService } from './avia-transfers.service';
import { CreateAviaTransferDto } from './dto/create-avia-transfer.dto';
import { QueryAviaTransfersDto } from './dto/query-avia-transfers.dto';
import { UpdateAviaTransferDto } from './dto/update-avia-transfer.dto';

const validationPipe = new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
});

@Controller('avia-transfers')
export class AviaTransfersController {
    constructor(private readonly aviaTransfersService: AviaTransfersService) {}

    @Get()
    async findAll(
        @Query(validationPipe)
        query: QueryAviaTransfersDto,
    ): Promise<PaginatedAviaTransfersResponse> {
        return this.aviaTransfersService.findAll(query);
    }

    @Get(':id')
    async findById(@Param('id', ParseIntPipe) id: number): Promise<AviaTransferResponse> {
        return this.aviaTransfersService.findById(id);
    }

    @Post()
    async create(
        @Body(validationPipe)
        dto: CreateAviaTransferDto,
    ): Promise<null> {
        await this.aviaTransfersService.create(dto);
        return null;
    }

    @Patch(':id')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body(validationPipe)
        dto: UpdateAviaTransferDto,
    ): Promise<null> {
        await this.aviaTransfersService.update(id, dto);
        return null;
    }
}
