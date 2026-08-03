import { Type } from 'class-transformer';
import {
    ArrayNotEmpty,
    ArrayUnique,
    IsArray,
    IsDateString,
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
    Min,
    ValidateNested,
} from 'class-validator';

class CreateAviaCargoDataDto {
    @Type(() => Number)
    @IsInt()
    @Min(0)
    cargoSpaces!: number;

    @Type(() => Number)
    @IsNumber()
    @Min(0)
    volume!: number;

    @Type(() => Number)
    @IsNumber()
    @Min(0)
    weight!: number;
}

export class CreateAviaTransferDto {
    @IsOptional()
    @IsDateString()
    departedAt?: string | null;

    @IsOptional()
    @IsString()
    invoiceNumber?: string | null;

    @ValidateNested()
    @Type(() => CreateAviaCargoDataDto)
    cargoData!: CreateAviaCargoDataDto;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    usdRate?: number | null;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    cnyRate?: number | null;

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
}
