import { Type } from 'class-transformer';
import {
    IsIn,
    IsInt,
    IsOptional,
    IsString,
    Max,
    Min,
} from 'class-validator';

export class QueryAviaTransfersDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number;

    @IsOptional()
    @IsString()
    @IsIn(['departedAt'])
    sortBy?: string;

    @IsOptional()
    @IsString()
    @IsIn(['asc', 'desc'])
    order?: string;

    @IsOptional()
    @IsString()
    q?: string;
}
