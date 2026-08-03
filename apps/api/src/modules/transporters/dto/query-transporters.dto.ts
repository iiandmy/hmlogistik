import { TransporterType } from '@hmlogistik/database';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class QueryTransportersDto {
    @IsOptional()
    @IsEnum(TransporterType)
    type?: TransporterType;

    @IsOptional()
    @IsString()
    q?: string;
}
