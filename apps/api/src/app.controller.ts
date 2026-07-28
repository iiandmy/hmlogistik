import {
  Controller,
  Get,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { AppService } from './app.service';

const MAX_LIMIT = 100;
const SORTABLE_COLUMNS = ['createdAt', 'shippedAt'] as const;

@Controller('/api')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/transfers')
  async getTransfers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('sortBy', new DefaultValuePipe('createdAt')) sortBy: string,
    @Query('order', new DefaultValuePipe('desc')) order: string,
    @Query('priceMin') priceMin?: string,
    @Query('priceMax') priceMax?: string,
    @Query('q') q?: string,
  ) {
    if (page < 1)
      throw new BadRequestException('`page` must be a positive integer.');
    if (limit < 1)
      throw new BadRequestException('`limit` must be a positive integer.');
    if (limit > MAX_LIMIT)
      throw new BadRequestException('`limit` must be ≤ 100.');
    if (
      !SORTABLE_COLUMNS.includes(sortBy as (typeof SORTABLE_COLUMNS)[number])
    ) {
      throw new BadRequestException(
        '`sortBy` must be one of: createdAt, shippedAt.',
      );
    }
    if (order !== 'asc' && order !== 'desc') {
      throw new BadRequestException('`order` must be one of: asc, desc.');
    }

    const parsedPriceMin = priceMin !== undefined ? Number(priceMin) : null;
    const parsedPriceMax = priceMax !== undefined ? Number(priceMax) : null;

    if (
      (priceMin !== undefined && !Number.isFinite(parsedPriceMin)) ||
      (priceMax !== undefined && !Number.isFinite(parsedPriceMax))
    ) {
      throw new BadRequestException(
        '`priceMin` and `priceMax` must be valid numbers.',
      );
    }

    if (
      parsedPriceMin !== null &&
      parsedPriceMax !== null &&
      parsedPriceMin > parsedPriceMax
    ) {
      throw new BadRequestException(
        '`priceMin` cannot be greater than `priceMax`.',
      );
    }

    return this.appService.getAllTransfers({
      page,
      limit,
      sortBy: sortBy as 'createdAt' | 'shippedAt',
      order: order,
      priceMin: parsedPriceMin,
      priceMax: parsedPriceMax,
      q: q ?? null,
    });
  }
}
