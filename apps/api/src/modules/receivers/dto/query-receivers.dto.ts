import { IsOptional, IsString } from 'class-validator';

export class QueryReceiversDto {
    @IsOptional()
    @IsString()
    q?: string;
}
