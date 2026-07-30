import type { Buffer } from 'node:buffer';
import type { UploadedFile } from '../files/interfaces/transfer-file-response.interface';
import type { PaginatedTransfersResponse, TransferResponse } from './interfaces/transfer-response.interface';
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
import { QueryTransfersDto } from './dto/query-transfers.dto';
import { UpdateTransferDto } from './dto/update-transfer.dto';
import { TransfersService } from './transfers.service';

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
        @Query(
            new ValidationPipe({
                transform: true,
                whitelist: true,
                forbidNonWhitelisted: true,
            }),
        )
        query: QueryTransfersDto,
    ): Promise<PaginatedTransfersResponse> {
        return this.transfersService.findAll(query);
    }

    @Get(':id')
    async findById(@Param('id', ParseIntPipe) id: number): Promise<TransferResponse> {
        return this.transfersService.findById(id);
    }

    @Post()
    @UseInterceptors(AnyFilesInterceptor({ defParamCharset: 'utf8' }))
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
    @UseInterceptors(AnyFilesInterceptor({ defParamCharset: 'utf8' }))
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
}
