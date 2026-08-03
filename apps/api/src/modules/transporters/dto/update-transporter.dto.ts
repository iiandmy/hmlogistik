import { Type } from 'class-transformer';
import {
    ArrayUnique,
    IsArray,
    IsInt,
    IsOptional,
    IsString,
    Min,
    MinLength,
    ValidateNested,
} from 'class-validator';
import { TransporterDelayRuleDto } from './create-transporter.dto';

export class UpdateTransporterDto {
    @IsOptional()
    @IsString()
    @MinLength(1)
    name?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    paymentDelayDays?: number | null;

    @IsOptional()
    @IsArray()
    @ArrayUnique(rule => rule.receiverId)
    @ValidateNested({ each: true })
    @Type(() => TransporterDelayRuleDto)
    paymentDelayExceptions?: TransporterDelayRuleDto[];
}
