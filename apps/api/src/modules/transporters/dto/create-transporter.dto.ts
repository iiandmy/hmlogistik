import { TransporterType } from '@hmlogistik/database';
import { Type } from 'class-transformer';
import {
    ArrayUnique,
    IsArray,
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    Min,
    MinLength,
    ValidateNested,
} from 'class-validator';

class TransporterDelayRuleDto {
    @Type(() => Number)
    @IsInt()
    @Min(1)
    receiverId!: number;

    @Type(() => Number)
    @IsInt()
    @Min(0)
    paymentDelayDays!: number;
}

export class CreateTransporterDto {
    @IsString()
    @MinLength(1)
    name!: string;

    @IsEnum(TransporterType)
    type!: TransporterType;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    paymentDelayDays?: number | null;

    @IsArray()
    @ArrayUnique(rule => rule.receiverId)
    @ValidateNested({ each: true })
    @Type(() => TransporterDelayRuleDto)
    paymentDelayExceptions!: TransporterDelayRuleDto[];
}

export { TransporterDelayRuleDto };
