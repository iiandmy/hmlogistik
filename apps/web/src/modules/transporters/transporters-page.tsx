import type { FC } from 'react';
import { Typography } from 'antd';
import { WorkInProgress } from '~components/work-in-progress';

export const TransportersPage: FC = () => {
    return (
        <>
            <Typography.Title>Перевозчики</Typography.Title>
            <WorkInProgress description="Справочник перевозчиков, содержащий наименование перевозчика и особенности условий перевозки" />
        </>
    );
};
