import {
    createHashHistory,
    createRootRoute,
    createRoute,
    createRouter,
    Outlet,
    redirect,
} from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import z from 'zod';
import { AviaTransfersTabPage, CargoTabPage, ReceiversTabPage, TransfersTabPage, TransportersTabPage } from '~app/tabs-route-pages';
import { CreateAviaTransferPage } from '~modules/avia-transfers/create-avia-transfer/create-avia-transfer-page';
import { CreateTransferPage } from '~modules/transfers/create-transfer/create-transfer-page';
import { EditTransferPage } from '../modules/transfers/edit-transfer/edit-transfer-page';

export const transfersSearchSchema = z.object({
    page: z.coerce.number().int().positive().optional().catch(undefined),
    limit: z.coerce.number().int().positive().optional().catch(undefined),
    sortBy: z.enum(['createdAt', 'shippedAt']).optional().catch(undefined),
    order: z.enum(['asc', 'desc']).optional().catch(undefined),
    q: z.string().optional().catch(undefined),
});

const rootRoute = createRootRoute({
    component: () => (
        <>
            <Outlet />
            <TanStackRouterDevtools position="bottom-right" />
        </>
    ),
});

const rootIndexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    beforeLoad: ({ search }) => redirect({ to: '/transfers', search, replace: true }),
});

const transfersRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/transfers',
    component: TransfersTabPage,
    validateSearch: transfersSearchSchema,
});

const aviaTransfersRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/avia-transfers',
    component: AviaTransfersTabPage,
    validateSearch: transfersSearchSchema,
});

const cargoRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/cargo',
    component: CargoTabPage,
});

const transportersRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/transporters',
    component: TransportersTabPage,
});

const receiversRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/receivers',
    component: ReceiversTabPage,
});

const transferRoute = createRoute({
    getParentRoute: () => transfersRoute,
    path: '$id',
    component: EditTransferPage,
});

const createTransferRoute = createRoute({
    getParentRoute: () => transfersRoute,
    path: 'create',
    component: CreateTransferPage,
});

const createAviaTransferRoute = createRoute({
    getParentRoute: () => aviaTransfersRoute,
    path: 'create',
    component: CreateAviaTransferPage,
});

export const routeTree = rootRoute.addChildren([
    rootIndexRoute,
    transfersRoute.addChildren([
        transferRoute,
        createTransferRoute,
    ]),
    aviaTransfersRoute.addChildren([
        createAviaTransferRoute,
    ]),
    cargoRoute,
    transportersRoute,
    receiversRoute,
]);

export const router = createRouter({
    routeTree,
    history: createHashHistory(),
});

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router;
    }
}
