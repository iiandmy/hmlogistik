import type { ColumnsType } from 'antd/es/table';
import type { AviaTransfer } from '../avia.types';
import { Typography } from 'antd';
import { useMemo } from 'react';
import { formatId } from '~utils/lib/formatId';
import { CargoDataColumn } from '../components/transfer-list-columns/cargo-data-column';

export const useAviaTransferListColumns = (): ColumnsType<AviaTransfer> => useMemo<ColumnsType<AviaTransfer>>(() => [
    {
        title: '№',
        dataIndex: 'id',
        key: 'id',
        render: (_, record) => (
            <Typography.Link>
                {formatId(record.id, 'А')}
            </Typography.Link>
        ),
    },
    {
        title: 'Вылет',
        dataIndex: 'departedAt',
        key: 'departedAt',
        render: (_, record) => record.departedAt?.format('DD/MM/YYYY') ?? '—',
        sorter: true,
    },
    {
        title: 'Получатель',
        dataIndex: 'receiver',
        key: 'receiver',
    },
    {
        title: '№ Накладной',
        dataIndex: 'invoiceNumber',
        render: (_, record) => record.invoiceNumber ?? '—',
        key: 'invoiceNumber',
    },
    {
        title: 'Данные по грузу',
        dataIndex: 'cargoData',
        key: 'cargoData',
        render: (_, record) => <CargoDataColumn record={record} />,
    },
    {
        title: 'Ставка, $',
        dataIndex: 'usdRate',
        key: 'usdRate',
        render: (_, record) => record.usdRate ?? '—',
    },
    {
        title: 'Ставка, ¥',
        dataIndex: 'cnyRate',
        key: 'cnyRate',
        render: (_, record) => record.cnyRate ?? '—',
    },
], []);
