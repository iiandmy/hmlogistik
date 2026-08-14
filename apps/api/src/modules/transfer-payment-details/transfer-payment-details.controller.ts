import type { TransferPaymentDetailsResponse } from './interfaces/transfer-payment-details-response.interface';
import { Body, Controller, Get, Param, ParseIntPipe, Patch, ValidationPipe } from '@nestjs/common';
import { UpdateTransferPaymentDetailsDto } from './dto/update-transfer-payment-details.dto';
import { TransferPaymentDetailsService } from './transfer-payment-details.service';

@Controller('transfer-payment-details')
export class TransferPaymentDetailsController {
    constructor(
        private readonly transferPaymentDetailsService: TransferPaymentDetailsService,
    ) {}

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
