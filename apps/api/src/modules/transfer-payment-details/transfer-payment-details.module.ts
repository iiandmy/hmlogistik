import { Module } from '@nestjs/common';
import { TransferPaymentDetailsController } from './transfer-payment-details.controller';
import { TransferPaymentDetailsService } from './transfer-payment-details.service';

@Module({
    controllers: [TransferPaymentDetailsController],
    providers: [TransferPaymentDetailsService],
    exports: [TransferPaymentDetailsService],
})
export class TransferPaymentDetailsModule {}
