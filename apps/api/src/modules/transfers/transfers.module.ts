import { Module } from '@nestjs/common';
import { FilesModule } from '../files/files.module';
import { TransferPaymentDetailsModule } from '../transfer-payment-details/transfer-payment-details.module';
import { TransfersController } from './transfers.controller';
import { TransfersService } from './transfers.service';

@Module({
    imports: [FilesModule, TransferPaymentDetailsModule],
    controllers: [TransfersController],
    providers: [TransfersService],
})
export class TransfersModule {}
