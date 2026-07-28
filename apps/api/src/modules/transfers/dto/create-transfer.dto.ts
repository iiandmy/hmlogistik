import {
    IsDateString,
    IsNumber,
    IsOptional,
    IsPositive,
    IsString,
    MinLength,
} from 'class-validator';

export class CreateTransferDto {
    @IsOptional()
    @IsDateString()
    createdAt?: string;

    @IsOptional()
    @IsDateString()
    shippedAt?: string;

    @IsString()
    @MinLength(1)
    transporter!: string;

    @IsString()
    @MinLength(1)
    receiver!: string;

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
