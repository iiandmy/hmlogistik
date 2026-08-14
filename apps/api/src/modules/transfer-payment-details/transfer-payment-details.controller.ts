import type {
    TransferPaymentDetailsResponse,
    TransferPaymentOverviewListResponse,
} from './interfaces/transfer-payment-details-response.interface';
import { Body, Controller, Get, Param, ParseIntPipe, Patch, Query, ValidationPipe } from '@nestjs/common';
import { QueryTransferPaymentDetailsDto } from './dto/query-transfer-payment-details.dto';
import { UpdateTransferPaymentDetailsDto } from './dto/update-transfer-payment-details.dto';
import { TransferPaymentDetailsService } from './transfer-payment-details.service';

@Controller('transfer-payment-details')
export class TransferPaymentDetailsController {
    constructor(
        private readonly transferPaymentDetailsService: TransferPaymentDetailsService,
    ) {}

    @Get()
    async findAll(
        @Query(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
        query: QueryTransferPaymentDetailsDto,
    ): Promise<TransferPaymentOverviewListResponse> {
        return this.transferPaymentDetailsService.findAll(query);
    }

    @Get(':transferId')
    async findByTransferId(
        @Param('transferId', ParseIntPipe) transferId: number,
    ): Promise<TransferPaymentDetailsResponse> {
        return this.transferPaymentDetailsService.getByTransferId(transferId);
    }

    @Patch(':transferId')
    async updateByTransferId(
        @Param('transferId', ParseIntPipe) transferId: number,
        @Body(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
        dto: UpdateTransferPaymentDetailsDto,
    ): Promise<TransferPaymentDetailsResponse> {
        return this.transferPaymentDetailsService.updateByTransferId(transferId, dto);
    }
}
