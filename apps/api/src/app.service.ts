import prisma, { Prisma } from '@hmlogistik/database';
import { Injectable } from '@nestjs/common';

interface GetAllTransfersParams {
  page: number;
  limit: number;
  sortBy: 'createdAt' | 'shippedAt';
  order: 'asc' | 'desc';
  priceMin: number | null;
  priceMax: number | null;
  q: string | null;
}

@Injectable()
export class AppService {
  async getAllTransfers(params: GetAllTransfersParams) {
    const { page, limit, sortBy, order, priceMin, priceMax, q } = params;

    const where: Prisma.TransferWhereInput = {};

    if (q) {
      where.OR = (
        ['transporter', 'receiver', 'container', 'cargo'] as const
      ).map((field) => ({
        [field]: { contains: q, mode: 'insensitive' as const },
      }));
    }

    if (priceMin !== null || priceMax !== null) {
      const priceFilter: Prisma.DecimalFilter = {};
      if (priceMin !== null) priceFilter.gte = priceMin;
      if (priceMax !== null) priceFilter.lte = priceMax;
      where.price = priceFilter;
    }

    const [items, total] = await Promise.all([
      prisma.transfer.findMany({
        where,
        orderBy: { [sortBy]: order },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.transfer.count({ where }),
    ]);

    return {
      items: items.map((item) => ({
        id: Number(item.id),
        createdAt: item.createdAt?.toISOString() ?? null,
        shippedAt: item.shippedAt?.toISOString() ?? null,
        transporter: item.transporter,
        receiver: item.receiver,
        container: item.container,
        price: Number(item.price),
        cargo: item.cargo,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }
}
