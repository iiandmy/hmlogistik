import { AppService } from './app.service';
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    getTransfers(page: number, limit: number, sortBy: string, order: string, priceMin?: string, priceMax?: string, q?: string): Promise<{
        items: {
            id: number;
            createdAt: string | null;
            shippedAt: string | null;
            transporter: string;
            receiver: string;
            container: string | null;
            price: number;
            cargo: string;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
}
