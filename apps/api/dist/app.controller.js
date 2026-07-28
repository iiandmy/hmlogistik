"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const app_service_1 = require("./app.service");
const MAX_LIMIT = 100;
const SORTABLE_COLUMNS = ['createdAt', 'shippedAt'];
let AppController = class AppController {
    appService;
    constructor(appService) {
        this.appService = appService;
    }
    async getTransfers(page, limit, sortBy, order, priceMin, priceMax, q) {
        if (page < 1)
            throw new common_1.BadRequestException('`page` must be a positive integer.');
        if (limit < 1)
            throw new common_1.BadRequestException('`limit` must be a positive integer.');
        if (limit > MAX_LIMIT)
            throw new common_1.BadRequestException('`limit` must be ≤ 100.');
        if (!SORTABLE_COLUMNS.includes(sortBy)) {
            throw new common_1.BadRequestException('`sortBy` must be one of: createdAt, shippedAt.');
        }
        if (order !== 'asc' && order !== 'desc') {
            throw new common_1.BadRequestException('`order` must be one of: asc, desc.');
        }
        const parsedPriceMin = priceMin !== undefined ? Number(priceMin) : null;
        const parsedPriceMax = priceMax !== undefined ? Number(priceMax) : null;
        if ((priceMin !== undefined && !Number.isFinite(parsedPriceMin)) ||
            (priceMax !== undefined && !Number.isFinite(parsedPriceMax))) {
            throw new common_1.BadRequestException('`priceMin` and `priceMax` must be valid numbers.');
        }
        if (parsedPriceMin !== null &&
            parsedPriceMax !== null &&
            parsedPriceMin > parsedPriceMax) {
            throw new common_1.BadRequestException('`priceMin` cannot be greater than `priceMax`.');
        }
        return this.appService.getAllTransfers({
            page,
            limit,
            sortBy: sortBy,
            order: order,
            priceMin: parsedPriceMin,
            priceMax: parsedPriceMax,
            q: q ?? null,
        });
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)('/transfers'),
    __param(0, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(10), common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('sortBy', new common_1.DefaultValuePipe('createdAt'))),
    __param(3, (0, common_1.Query)('order', new common_1.DefaultValuePipe('desc'))),
    __param(4, (0, common_1.Query)('priceMin')),
    __param(5, (0, common_1.Query)('priceMax')),
    __param(6, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getTransfers", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)('/api'),
    __metadata("design:paramtypes", [app_service_1.AppService])
], AppController);
//# sourceMappingURL=app.controller.js.map