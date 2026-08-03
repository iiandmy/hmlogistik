import type {
    TransporterResponse,
    TransportersListResponse,
} from './interfaces/transporter-response.interface';
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
import { CreateTransporterDto } from './dto/create-transporter.dto';
import { QueryTransportersDto } from './dto/query-transporters.dto';
import { UpdateTransporterDto } from './dto/update-transporter.dto';
import { TransportersService } from './transporters.service';

const validationPipe = new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
});

@Controller('transporters')
export class TransportersController {
    constructor(private readonly transportersService: TransportersService) {}

    @Get()
    async findAll(
        @Query(validationPipe)
        query: QueryTransportersDto,
    ): Promise<TransportersListResponse> {
        return this.transportersService.findAll(query);
    }

    @Get(':id')
    async findById(@Param('id', ParseIntPipe) id: number): Promise<TransporterResponse> {
        return this.transportersService.findById(id);
    }

    @Post()
    async create(
        @Body(validationPipe)
        dto: CreateTransporterDto,
    ): Promise<TransporterResponse> {
        return this.transportersService.create(dto);
    }

    @Patch(':id')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body(validationPipe)
        dto: UpdateTransporterDto,
    ): Promise<TransporterResponse> {
        return this.transportersService.update(id, dto);
    }
}
