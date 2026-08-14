import { Type } from 'class-transformer';
import {
    ArrayNotEmpty,
    ArrayUnique,
    IsArray,
    IsDateString,
    IsInt,
    IsNumber,
    IsOptional,
    IsPositive,
    IsString,
    Min,
    MinLength,
} from 'class-validator';

export class CreateTransferDto {
    @IsOptional()
    @IsDateString()
    createdAt?: string;

    @IsOptional()
    @IsDateString()
    shippedAt?: string;

    @IsOptional()
    @IsDateString()
    declarationDate?: string;

    @IsOptional()
    @IsDateString()
    actDate?: string;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    transporterId!: number;

    @IsArray()
    @ArrayNotEmpty()
    @ArrayUnique()
    @Type(() => Number)
    @IsInt({ each: true })
    @Min(1, { each: true })
    receiverIds!: number[];

    @IsOptional()
    @IsString()
    container?: string;

    @IsNumber()
    @IsPositive()
    price!: number;

    @IsString()
    @MinLength(1)
    cargo!: string;
}
