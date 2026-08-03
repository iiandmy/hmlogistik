import { PartialType } from '@nestjs/mapped-types';
import { CreateAviaTransferDto } from './create-avia-transfer.dto';

export class UpdateAviaTransferDto extends PartialType(CreateAviaTransferDto) {}
