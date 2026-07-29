import type { FC } from 'react';
import { Flex } from 'antd';
import { TransferList } from './components/transfer-list';

import { TransferListNavBar } from './components/transfer-list-nav-bar';

export const TransferListPage: FC = () => (
    <Flex vertical>
        <TransferListNavBar />
        <TransferList />
    </Flex>
);
