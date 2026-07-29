import type { FC } from 'react';
import { Flex } from 'antd';
import { AviaTransferList } from './components/avia-transfer-list';

import { TransferListNavBar } from './components/transfer-list-nav-bar';

export const AviaTransferListPage: FC = () => (
    <Flex vertical>
        <TransferListNavBar />
        <AviaTransferList />
    </Flex>
);
