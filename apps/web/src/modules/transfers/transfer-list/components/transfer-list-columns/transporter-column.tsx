import type { FC, ReactNode } from 'react';
import type { TransferDto } from '~api/transfers';
import { InfoCircleOutlined } from '@ant-design/icons';
import { Flex, Tag, Tooltip } from 'antd';

interface Props {
    record: TransferDto;
}

export const TransporterColumn: FC<Props> = ({ record }) => {
    const transporter = typeof record.transporter === 'object' && record.transporter !== null
        ? record.transporter
        : null;
    const receivers = Array.isArray(record.receivers) ? record.receivers : [];
    const relevantExceptions = (transporter?.paymentDelayExceptions ?? [])
        .filter(rule => receivers.some(receiver => receiver.id === rule.receiverId));

    const tooltipContent: ReactNode = (
        <Flex vertical gap={4}>
            <span>
                Отсрочка по платежу -
                {' '}
                {transporter?.paymentDelayDays ?? '—'}
                {' '}
                дней
            </span>
            {relevantExceptions.map(rule => (
                <span key={rule.receiverId}>
                    Отсрочка для
                    {' '}
                    {rule.receiverName}
                    {' '}
                    -
                    {' '}
                    {rule.paymentDelayDays}
                    {' '}
                    дней
                </span>
            ))}
        </Flex>
    );

    const isLegacy = !!transporter?.isPlaceholder && !!record.legacyTransporter;
    const transporterLabel = isLegacy
        ? record.legacyTransporter
        : (transporter?.name ?? record.legacyTransporter ?? '—');

    return (
        <Flex align="center" gap={4}>
            <Tag color={isLegacy ? 'red' : undefined}>
                {transporterLabel}
            </Tag>
            <Tooltip title={tooltipContent}>
                <InfoCircleOutlined />
            </Tooltip>
        </Flex>
    );
};
