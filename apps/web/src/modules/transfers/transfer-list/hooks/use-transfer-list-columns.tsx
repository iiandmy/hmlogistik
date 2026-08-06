import type { ColumnsType } from 'antd/es/table';
import type { JSX } from 'react';
import type { TransferDatasource } from '~api/transfers/types';
import { Flex, Tag } from 'antd';
import { useMemo } from 'react';
import { IdColumn } from '../components/transfer-list-columns/id-column';
import { TransporterColumn } from '../components/transfer-list-columns/transporter-column';

export const useTransferListColumns = (): ColumnsType<TransferDatasource> => useMemo<ColumnsType<TransferDatasource>>(() => [
    {
        title: '№',
        dataIndex: 'id',
        key: 'id',
        render: (_, record) => <IdColumn record={record} />,
    },
    {
        title: 'Тип груза',
        dataIndex: 'cargo',
        width: 260,
        key: 'cargo',
    },
    {
        title: 'Цена, $',
        dataIndex: 'price',
        key: 'price',
    },
    {
        title: 'Выход',
        dataIndex: 'createdAt',
        key: 'createdAt',
        render: (_, record) => record.createdAt ?? '—',
        sorter: true,
    },
    {
        title: '№ Контейнера',
        dataIndex: 'container',
        render: (_, record) => record.container ?? '—',
        key: 'container',
    },
    {
        title: 'Перевозчик',
        dataIndex: 'transporter',
        key: 'transporter',
        render: (_, record) => <TransporterColumn record={record} />,
    },
    {
        title: 'Получатель',
        dataIndex: 'receivers',
        key: 'receivers',
        render: (_, record): JSX.Element => {
            const receivers = Array.isArray(record.receivers) ? record.receivers : [];
            const hasOnlyPlaceholder = receivers.length === 1
                && receivers[0]?.isPlaceholder
                && !!record.legacyReceiver;

            if (hasOnlyPlaceholder) {
                return <Tag color="red">{record.legacyReceiver}</Tag>;
            }

            return (
                <Flex gap={4} wrap>
                    {receivers.map(receiver => (
                        <Tag key={receiver.id}>{receiver.name}</Tag>
                    ))}
                </Flex>
            );
        },
    },
    {
        title: 'Доставлено',
        dataIndex: 'shippedAt',
        key: 'shippedAt',
        render: (_, record) => record.shippedAt ?? '—',
        sorter: true,
    },
], []);
