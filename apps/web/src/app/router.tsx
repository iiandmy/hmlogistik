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
import { SidebarLayout } from '~app/sidebar-layout';
import { AviaTransferListPage } from '~modules/avia-transfers/avia-transfer-list/avia-transfer-list-page';
import { CreateAviaTransferPage } from '~modules/avia-transfers/create-avia-transfer/create-avia-transfer-page';
import { EditAviaTransferPage } from '~modules/avia-transfers/edit-avia-transfer/edit-avia-transfer-page';
import { CargoPage } from '~modules/cargo/cargo-page';
import { ReceiversPage } from '~modules/receivers/receivers-page';
import { TransferPaymentsPage } from '~modules/transfer-payments/transfer-payments-page';
import { CreateTransferPage } from '~modules/transfers/create-transfer/create-transfer-page';
import { TransferListPage } from '~modules/transfers/transfer-list/transfer-list-page';
import { TransportersPage } from '~modules/transporters/transporters-page';
import { EditTransferPage } from '../modules/transfers/edit-transfer/edit-transfer-page';

export const transfersSearchSchema = z.object({
    page: z.coerce.number().int().positive().optional().catch(undefined),
    limit: z.coerce.number().int().positive().optional().catch(undefined),
    sortBy: z.enum(['createdAt', 'shippedAt']).optional().catch(undefined),
    order: z.enum(['asc', 'desc']).optional().catch(undefined),
    q: z.string().optional().catch(undefined),
});

export const transferPaymentsSearchSchema = z.object({
    status: z.enum(['paid', 'unpaid']).optional().catch(undefined),
});

export const aviaTransfersSearchSchema = z.object({
    page: z.coerce.number().int().positive().optional().catch(undefined),
    limit: z.coerce.number().int().positive().optional().catch(undefined),
    sortBy: z.enum(['departedAt']).optional().catch(undefined),
    order: z.enum(['asc', 'desc']).optional().catch(undefined),
    q: z.string().optional().catch(undefined),
});

const rootRoute = createRootRoute({
    component: () => (
        <>
            <SidebarLayout>
                <Outlet />
            </SidebarLayout>
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
    component: Outlet,
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

const transferPaymentsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/transfer-payments',
    component: TransferPaymentsPage,
    validateSearch: transferPaymentsSearchSchema,
});

// ── Avia Transfers (with nested routes) ─────────────────────────────────────

const aviaTransfersRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/avia-transfers',
    component: Outlet,
    validateSearch: aviaTransfersSearchSchema,
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

const aviaTransferRoute = createRoute({
    getParentRoute: () => aviaTransfersRoute,
    path: '$id',
    component: EditAviaTransferPage,
});

// ── Simple tab pages (no nested routes) ─────────────────────────────────────

const cargoRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/cargo',
    component: CargoPage,
});

const transportersRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/transporters',
    component: TransportersPage,
});

const receiversRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/receivers',
    component: ReceiversPage,
});

// ── Route tree ──────────────────────────────────────────────────────────────

export const routeTree = rootRoute.addChildren([
    rootIndexRoute,
    transfersRoute.addChildren([
        transfersIndexRoute,
        transferRoute,
        createTransferRoute,
    ]),
    transferPaymentsRoute,
    aviaTransfersRoute.addChildren([
        aviaTransfersIndexRoute,
        createAviaTransferRoute,
        aviaTransferRoute,
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
