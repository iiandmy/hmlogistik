import { Module } from '@nestjs/common';
import { FilesModule } from '../files/files.module';
import { TransfersController } from './transfers.controller';
import { TransfersService } from './transfers.service';

@Module({
    imports: [FilesModule],
    controllers: [TransfersController],
    providers: [TransfersService],
})
export class TransfersModule {}
