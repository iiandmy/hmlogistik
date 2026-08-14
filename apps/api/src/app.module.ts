import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AviaTransfersModule } from './modules/avia-transfers/avia-transfers.module';
import { ReceiversModule } from './modules/receivers/receivers.module';
import { TransferPaymentDetailsModule } from './modules/transfer-payment-details/transfer-payment-details.module';
import { TransfersModule } from './modules/transfers/transfers.module';
import { TransportersModule } from './modules/transporters/transporters.module';
import { MinioModule } from './providers/minio/minio.module';
import { PrismaModule } from './providers/prisma/prisma.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PrismaModule,
        MinioModule,
        AviaTransfersModule,
        ReceiversModule,
        TransportersModule,
        TransfersModule,
        TransferPaymentDetailsModule,
    ],
})
export class AppModule {}
