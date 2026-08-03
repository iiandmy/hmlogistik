import type { ReceiverResponse, ReceiversListResponse } from './interfaces/receiver-response.interface';
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
import { CreateReceiverDto } from './dto/create-receiver.dto';
import { QueryReceiversDto } from './dto/query-receivers.dto';
import { UpdateReceiverDto } from './dto/update-receiver.dto';
import { ReceiversService } from './receivers.service';

const validationPipe = new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
});

@Controller('receivers')
export class ReceiversController {
    constructor(private readonly receiversService: ReceiversService) {}

    @Get()
    async findAll(
        @Query(validationPipe)
        query: QueryReceiversDto,
    ): Promise<ReceiversListResponse> {
        return this.receiversService.findAll(query);
    }

    @Get(':id')
    async findById(@Param('id', ParseIntPipe) id: number): Promise<ReceiverResponse> {
        return this.receiversService.findById(id);
    }

    @Post()
    async create(
        @Body(validationPipe)
        dto: CreateReceiverDto,
    ): Promise<ReceiverResponse> {
        return this.receiversService.create(dto);
    }

    @Patch(':id')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body(validationPipe)
        dto: UpdateReceiverDto,
    ): Promise<ReceiverResponse> {
        return this.receiversService.update(id, dto);
    }
}
