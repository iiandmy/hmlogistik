import type { FC } from 'react';
import { TabsLayout } from '~app/tabs-layout';
import { AviaTransferListPage } from '~modules/avia-transfers/avia-transfer-list/avia-transfer-list-page';
import { CargoPage } from '~modules/cargo/cargo-page';
import { ReceiversPage } from '~modules/receivers/receivers-page';
import { TransferListPage } from '~modules/transfers/transfer-list/transfer-list-page';
import { TransportersPage } from '~modules/transporters/transporters-page';

export const TransfersTabPage: FC = () => (
    <TabsLayout>
        <TransferListPage />
    </TabsLayout>
);

export const AviaTransfersTabPage: FC = () => (
    <TabsLayout>
        <AviaTransferListPage />
    </TabsLayout>
);

export const CargoTabPage: FC = () => (
    <TabsLayout>
        <CargoPage />
    </TabsLayout>
);

export const TransportersTabPage: FC = () => (
    <TabsLayout>
        <TransportersPage />
    </TabsLayout>
);

export const ReceiversTabPage: FC = () => (
    <TabsLayout>
        <ReceiversPage />
    </TabsLayout>
);
