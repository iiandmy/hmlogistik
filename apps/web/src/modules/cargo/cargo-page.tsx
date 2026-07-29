import type { FC } from 'react';
import { Typography } from 'antd';
import { WorkInProgress } from '~components/work-in-progress';

export const CargoPage: FC = () => (
    <>
        <Typography.Title>Груз</Typography.Title>
        <WorkInProgress description="Справочник товаров, содержащий наименование груза и код ТН ВЭД" />
    </>
);
