import type { FC } from 'react';
import { Flex, Typography } from 'antd';
import { WorkInProgress } from '~components/work-in-progress';

export const CargoPage: FC = () => (
    <Flex vertical gap={16}>
        <Typography.Title style={{ margin: 0 }}>Груз</Typography.Title>
        <WorkInProgress description="Справочник товаров, содержащий наименование груза и код ТН ВЭД" />
    </Flex>
);
