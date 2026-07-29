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
import { TabsLayout } from '~app/tabs-layout';
import { CargoTabPage, ReceiversTabPage, TransportersTabPage } from '~app/tabs-route-pages';
import { AviaTransferListPage } from '~modules/avia-transfers/avia-transfer-list/avia-transfer-list-page';
import { CreateAviaTransferPage } from '~modules/avia-transfers/create-avia-transfer/create-avia-transfer-page';
import { CreateTransferPage } from '~modules/transfers/create-transfer/create-transfer-page';
import { TransferListPage } from '~modules/transfers/transfer-list/transfer-list-page';
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

// ── Transfers (with nested routes) ──────────────────────────────────────────

const transfersRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/transfers',
    component: () => (
        <TabsLayout>
            <Outlet />
        </TabsLayout>
    ),
    validateSearch: transfersSearchSchema,
});

const transfersIndexRoute = createRoute({
    getParentRoute: () => transfersRoute,
    path: '/',
    component: TransferListPage,
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

// ── Avia Transfers (with nested routes) ─────────────────────────────────────

const aviaTransfersRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/avia-transfers',
    component: () => (
        <TabsLayout>
            <Outlet />
        </TabsLayout>
    ),
    validateSearch: transfersSearchSchema,
});

const aviaTransfersIndexRoute = createRoute({
    getParentRoute: () => aviaTransfersRoute,
    path: '/',
    component: AviaTransferListPage,
});

const createAviaTransferRoute = createRoute({
    getParentRoute: () => aviaTransfersRoute,
    path: 'create',
    component: CreateAviaTransferPage,
});

// ── Simple tab pages (no nested routes) ─────────────────────────────────────

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

// ── Route tree ──────────────────────────────────────────────────────────────

export const routeTree = rootRoute.addChildren([
    rootIndexRoute,
    transfersRoute.addChildren([
        transfersIndexRoute,
        transferRoute,
        createTransferRoute,
    ]),
    aviaTransfersRoute.addChildren([
        aviaTransfersIndexRoute,
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
