import type { ColumnsType } from 'antd/es/table';
import type { TransferDto } from '~api/transfers';
import { CheckCircleTwoTone } from '@ant-design/icons';
import { Link } from '@tanstack/react-router';
import { Tooltip, Typography } from 'antd';
import { useMemo } from 'react';
import { formatId } from '~utils/lib/formatId';
import { TransporterColumn } from '../components/transfer-list-columns/transporter-column';

export const useTransferListColumns = (): ColumnsType<TransferDto> => useMemo<ColumnsType<TransferDto>>(() => [
    {
        title: '№',
        dataIndex: 'id',
        key: 'id',
        render: (_, record) => (
            <Link to="/transfers/$id" params={{ id: String(record.id) }}>
                {record.shippedAt && (
                    <Tooltip title="Отправка доставлена">
                        <CheckCircleTwoTone twoToneColor="#13ba00" />
                    </Tooltip>
                )}
                {' '}
                <Typography.Link strong={!!record.shippedAt}>
                    {formatId(record.id, 'ЖД')}
                </Typography.Link>
            </Link>
        ),
    },
    {
        title: 'Выход',
        dataIndex: 'createdAt',
        key: 'createdAt',
        render: (_, record) => record.createdAt ?? '—',
        sorter: true,
    },
    {
        title: 'Доставлено',
        dataIndex: 'shippedAt',
        key: 'shippedAt',
        render: (_, record) => record.shippedAt ?? '—',
        sorter: true,
    },
    {
        title: 'Перевозчик',
        dataIndex: 'transporter',
        key: 'transporter',
        render: (_, record) => <TransporterColumn record={record} />,
    },
    {
        title: 'Получатель',
        dataIndex: 'receiver',
        key: 'receiver',
    },
    {
        title: '№ Контейнера',
        dataIndex: 'container',
        render: (_, record) => record.container ?? '—',
        key: 'container',
    },
    {
        title: 'Цена, $',
        dataIndex: 'price',
        key: 'price',
    },
    {
        title: 'Тип груза',
        dataIndex: 'cargo',
        key: 'cargo',
    },
], []);
