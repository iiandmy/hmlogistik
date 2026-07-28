import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TransfersModule } from './modules/transfers/transfers.module';
import { MinioModule } from './providers/minio/minio.module';
import { PrismaModule } from './providers/prisma/prisma.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PrismaModule,
        MinioModule,
        TransfersModule,
    ],
})
export class AppModule {}
