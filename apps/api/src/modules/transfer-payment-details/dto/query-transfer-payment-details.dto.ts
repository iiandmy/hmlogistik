import { IsIn, IsOptional } from 'class-validator';

export class QueryTransferPaymentDetailsDto {
    @IsOptional()
    @IsIn(['paid', 'unpaid'])
    status?: 'paid' | 'unpaid';
}
