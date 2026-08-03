import { Module } from '@nestjs/common';
import { AviaTransfersController } from './avia-transfers.controller';
import { AviaTransfersService } from './avia-transfers.service';

@Module({
    controllers: [AviaTransfersController],
    providers: [AviaTransfersService],
})
export class AviaTransfersModule {}
