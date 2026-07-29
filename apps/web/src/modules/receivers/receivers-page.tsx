import type { FC } from 'react';
import { Typography } from 'antd';
import { WorkInProgress } from '~components/work-in-progress';

export const ReceiversPage: FC = () => (
    <>
        <Typography.Title>Получатели</Typography.Title>
        <WorkInProgress description="Справочник получателей" />
    </>
);
