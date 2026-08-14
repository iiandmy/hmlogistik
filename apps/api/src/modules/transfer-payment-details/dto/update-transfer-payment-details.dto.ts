import { Type } from 'class-transformer';
import {
    ArrayUnique,
    IsArray,
    IsDateString,
    IsInt,
    IsNumber,
    IsOptional,
    IsPositive,
    Min,
    ValidateNested,
} from 'class-validator';

class TransferPaymentShareDto {
    @Type(() => Number)
    @IsInt()
    @Min(1)
    receiverId!: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    amount?: number | null;
}

class CreateTransferPaymentDto {
    @Type(() => Number)
    @IsInt()
    @Min(1)
    receiverId!: number;

    @Type(() => Number)
    @IsNumber()
    @IsPositive()
    amount!: number;

    @IsDateString()
    paidAt!: string;
}

export class UpdateTransferPaymentDetailsDto {
    @IsOptional()
    @IsArray()
    @ArrayUnique(share => share.receiverId)
    @ValidateNested({ each: true })
    @Type(() => TransferPaymentShareDto)
    shares?: TransferPaymentShareDto[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateTransferPaymentDto)
    newPayments?: CreateTransferPaymentDto[];
}

export type { CreateTransferPaymentDto, TransferPaymentShareDto };
