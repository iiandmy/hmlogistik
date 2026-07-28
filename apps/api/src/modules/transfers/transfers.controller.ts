import type { Buffer } from 'node:buffer';
import type { TransferFileResponse, UploadedFile } from '../files/interfaces/transfer-file-response.interface';
import type { QueryTransfersDto } from './dto/query-transfers.dto';
import type { PaginatedTransfersResponse, TransferResponse } from './interfaces/transfer-response.interface';
import type { TransfersService } from './transfers.service';
import {
    Body,
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
    UploadedFiles,
    UseInterceptors,
    ValidationPipe,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { ParseMultipartBodyPipe } from '../../common/pipes/parse-multipart-body.pipe';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { UpdateTransferDto } from './dto/update-transfer.dto';

interface MulterFile {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
}

function multerFilesToUploadedFiles(files: MulterFile[]): UploadedFile[] {
    return files.map(file => ({
        buffer: file.buffer,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
    }));
}

@Controller('transfers')
export class TransfersController {
    constructor(private readonly transfersService: TransfersService) {}

    @Get()
    async findAll(
        @Query(new ValidationPipe({ transform: true, whitelist: true }))
        query: QueryTransfersDto,
    ): Promise<PaginatedTransfersResponse> {
        return this.transfersService.findAll(query);
    }

    @Get(':id')
    async findById(@Param('id', ParseIntPipe) id: number): Promise<TransferResponse> {
        return this.transfersService.findById(id);
    }

    @Post()
    @UseInterceptors(AnyFilesInterceptor())
    async createMultipart(
        @UploadedFiles() multerFiles: MulterFile[],
        @Body(new ParseMultipartBodyPipe(CreateTransferDto))
        { dto }: { dto: CreateTransferDto; removedFileIds: number[] },
    ): Promise<null> {
        const files = multerFilesToUploadedFiles(multerFiles);
        await this.transfersService.create(dto, files);
        return null;
    }

    @Patch(':id')
    @UseInterceptors(AnyFilesInterceptor())
    async updateMultipart(
        @Param('id', ParseIntPipe) id: number,
        @UploadedFiles() multerFiles: MulterFile[],
        @Body(new ParseMultipartBodyPipe(UpdateTransferDto))
        {
            dto,
            removedFileIds,
        }: { dto: UpdateTransferDto; removedFileIds: number[] },
    ): Promise<null> {
        const files = multerFilesToUploadedFiles(multerFiles);
        await this.transfersService.update(id, dto, files, removedFileIds);
        return null;
    }

    @Get(':id/files')
    async getFiles(@Param('id', ParseIntPipe) id: number): Promise<TransferFileResponse[]> {
        return this.transfersService.getFiles(id);
    }
}
