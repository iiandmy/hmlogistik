import type { ColumnsType } from 'antd/es/table';
import type { JSX } from 'react';
import type { AviaTransferDto } from '~api/avia-transfers';
import { Link } from '@tanstack/react-router';
import { Flex, Tag, Typography } from 'antd';
import { useMemo } from 'react';
import { formatId } from '~utils/lib/format-id';
import { CargoDataColumn } from '../components/transfer-list-columns/cargo-data-column';

export const useAviaTransferListColumns = (): ColumnsType<AviaTransferDto> => useMemo<ColumnsType<AviaTransferDto>>(() => [
    {
        title: '№',
        dataIndex: 'id',
        key: 'id',
        render: (_, record) => (
            <Link to="/avia-transfers/$id" params={{ id: String(record.id) }}>
                <Typography.Link>
                    {formatId(record.id, 'А')}
                </Typography.Link>
            </Link>
        ),
    },
    {
        title: 'Вылет',
        dataIndex: 'departedAt',
        key: 'departedAt',
        render: (_, record) => record.departedAt ?? '—',
        sorter: true,
    },
    {
        title: 'Перевозчик',
        dataIndex: 'transporter',
        key: 'transporter',
        render: (_, record): JSX.Element => {
            const transporter = typeof record.transporter === 'object' && record.transporter !== null
                ? record.transporter
                : null;
            const isLegacy = !!transporter?.isPlaceholder && !!record.legacyTransporter;

            return (
                <Tag color={isLegacy ? 'red' : undefined}>
                    {isLegacy ? record.legacyTransporter : (transporter?.name ?? record.legacyTransporter ?? '—')}
                </Tag>
            );
        },
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
