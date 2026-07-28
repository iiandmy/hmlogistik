"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppService = void 0;
const database_1 = __importDefault(require("@hmlogistik/database"));
const common_1 = require("@nestjs/common");
let AppService = class AppService {
    async getAllTransfers(params) {
        const { page, limit, sortBy, order, priceMin, priceMax, q } = params;
        const where = {};
        if (q) {
            where.OR = ['transporter', 'receiver', 'container', 'cargo'].map((field) => ({
                [field]: { contains: q, mode: 'insensitive' },
            }));
        }
        if (priceMin !== null || priceMax !== null) {
            const priceFilter = {};
            if (priceMin !== null)
                priceFilter.gte = priceMin;
            if (priceMax !== null)
                priceFilter.lte = priceMax;
            where.price = priceFilter;
        }
        const [items, total] = await Promise.all([
            database_1.default.transfer.findMany({
                where,
                orderBy: { [sortBy]: order },
                skip: (page - 1) * limit,
                take: limit,
            }),
            database_1.default.transfer.count({ where }),
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
};
exports.AppService = AppService;
exports.AppService = AppService = __decorate([
    (0, common_1.Injectable)()
], AppService);
//# sourceMappingURL=app.service.js.map