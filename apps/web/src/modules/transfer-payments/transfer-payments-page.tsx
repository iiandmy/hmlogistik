import type { ColumnsType } from 'antd/es/table';
import type { FC } from 'react';
import type { TransferPaymentOverviewItemDto } from '~api/transfer-payment-details';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { Alert, Flex, Radio, Table, Tag, Typography } from 'antd';
import { useTransferPaymentDetailsList } from '~api/transfer-payment-details';
import { formatId } from '~utils/lib/format-id';
import styles from './transfer-payments-page.module.css';

type PaymentStatusFilter = 'all' | 'paid' | 'unpaid';

interface TransferPaymentsSearch {
    status?: 'paid' | 'unpaid';
}

export const TransferPaymentsPage: FC = () => {
    const navigate = useNavigate();
    const search = useSearch({ from: '/transfer-payments' }) as TransferPaymentsSearch;
    const selectedStatus: PaymentStatusFilter = search.status ?? 'all';

    const { data, isLoading, error } = useTransferPaymentDetailsList(
        search.status ? { status: search.status } : {},
    );

    const columns: ColumnsType<TransferPaymentOverviewItemDto> = [
        {
            title: 'Номер отправки',
            key: 'transferId',
            render: (_, record) => (
                <Link to="/transfers/$id" params={{ id: String(record.transferId) }}>
                    {formatId(record.transferId)}
                </Link>
            ),
        },
        {
            title: 'Груз',
            dataIndex: 'cargo',
            key: 'cargo',
        },
        {
            title: 'Перевозчик',
            dataIndex: 'transporterName',
            key: 'transporterName',
        },
        {
            title: 'Получатель',
            key: 'receivers',
            render: (_, record) => (
                <Flex vertical gap={4}>
                    {record.receivers.map(receiver => (
                        <Typography.Text key={receiver.receiverId}>
                            {receiver.receiverName}
                            {' '}
                            -
                            {' '}
                            {receiver.remainingAmount ?? '—'}
                        </Typography.Text>
                    ))}
                </Flex>
            ),
        },
        {
            title: 'Статус',
            key: 'status',
            render: (_, record) => record.isPaid
                ? <Tag color="green">Оплачено</Tag>
                : <Tag color="orange">Не оплачено</Tag>,
        },
    ];

    return (
        <Flex vertical gap={16}>
            <Typography.Title>Оплата</Typography.Title>
            {error && (
                <Alert
                    title={error instanceof Error ? error.message : 'Не удалось загрузить оплаты'}
                    type="error"
                    showIcon
                />
            )}
            <Radio.Group
                value={selectedStatus}
                optionType="button"
                buttonStyle="solid"
                className={styles.filters}
                onChange={(event) => {
                    const nextStatus = event.target.value as PaymentStatusFilter;
                    void navigate({
                        to: '/transfer-payments',
                        search: () => ({
                            status: nextStatus === 'all' ? undefined : nextStatus,
                        }),
                        replace: true,
                    });
                }}
                options={[
                    { label: 'Все', value: 'all' },
                    { label: 'Оплаченные', value: 'paid' },
                    { label: 'Неоплаченные', value: 'unpaid' },
                ]}
            />
            <Table
                rowKey="transferId"
                columns={columns}
                dataSource={data?.items ?? []}
                loading={isLoading}
                pagination={false}
            />
        </Flex>
    );
};
