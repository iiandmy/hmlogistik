import type { FormInstance } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { FC } from 'react';
import type { TransferPaymentDetailsDto } from '~api/transfer-payment-details';
import type { TransferPaymentFormValues } from '~utils/types/types';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Alert, Button, DatePicker, Divider, Flex, Form, Input, InputNumber, Select, Space, Table, Typography } from 'antd';
import { useState } from 'react';
import styles from './form-shared.module.css';

interface Props {
    form: FormInstance<TransferPaymentFormValues>;
    paymentDetails: TransferPaymentDetailsDto;
    error: string | null;
    canAddPayments: boolean;
    canClearShares: boolean;
    onClearShares: () => void;
    draftRowsVersion: number;
}

interface SavedPaymentTableRow {
    key: string;
    receiverName: string;
    amount: number;
    paidAt: string;
}

interface DraftPaymentTableRow {
    key: string;
    draftIndex: number;
}

type PaymentTableRow = ({ type: 'saved' } & SavedPaymentTableRow)
    | ({ type: 'draft' } & DraftPaymentTableRow);

let draftPaymentRowId = 0;

export const TransferPaymentDetailsForm: FC<Props> = ({
    form,
    paymentDetails,
    error,
    canAddPayments,
    canClearShares,
    onClearShares,
    draftRowsVersion,
}) => {
    const [draftRowsState, setDraftRowsState] = useState<{
        version: number;
        keys: string[];
    }>({
        version: draftRowsVersion,
        keys: [],
    });

    const draftRowKeys = draftRowsState.version === draftRowsVersion
        ? draftRowsState.keys
        : [];

    const updateDraftRowKeys = (updater: (keys: string[]) => string[]): void => {
        const nextBaseKeys = draftRowsState.version === draftRowsVersion
            ? draftRowsState.keys
            : [];
        setDraftRowsState({
            version: draftRowsVersion,
            keys: updater(nextBaseKeys),
        });
    };
    const isSingleReceiver = paymentDetails.shares.length === 1;
    const receiverOptions = paymentDetails.shares.map(share => ({
        value: share.receiverId,
        label: share.receiverName,
    }));

    const paymentRows: PaymentTableRow[] = [
        ...paymentDetails.payments.map(payment => ({
            key: `saved-${payment.id}`,
            type: 'saved' as const,
            receiverName: payment.receiverName,
            amount: payment.amount,
            paidAt: payment.paidAt,
        })),
        ...draftRowKeys.map((key, draftIndex) => ({
            key,
            type: 'draft' as const,
            draftIndex,
        })),
    ];

    const columns: ColumnsType<PaymentTableRow> = [
        {
            title: 'Получатель',
            key: 'receiverName',
            render: (_, row) => row.type === 'saved'
                ? row.receiverName
                : (
                        <Form.Item
                            name={['newPayments', row.draftIndex, 'receiverId']}
                            rules={[{ required: true, message: 'Выберите получателя' }]}
                            style={{ marginBottom: 0 }}
                        >
                            <Select options={receiverOptions} />
                        </Form.Item>
                    ),
        },
        {
            title: 'Сумма выплаты, $',
            key: 'amount',
            render: (_, row) => row.type === 'saved'
                ? row.amount
                : (
                        <Form.Item
                            name={['newPayments', row.draftIndex, 'amount']}
                            rules={[{ required: true, message: 'Введите сумму' }]}
                            style={{ marginBottom: 0 }}
                        >
                            <InputNumber min={0.01} style={{ width: '100%' }} />
                        </Form.Item>
                    ),
        },
        {
            title: 'Дата выплаты',
            key: 'paidAt',
            render: (_, row) => row.type === 'saved'
                ? new Date(row.paidAt).toLocaleDateString('ru-RU')
                : (
                        <Form.Item
                            name={['newPayments', row.draftIndex, 'paidAt']}
                            rules={[{ required: true, message: 'Выберите дату' }]}
                            style={{ marginBottom: 0 }}
                        >
                            <DatePicker className={styles.full_width} format="DD.MM.YYYY" />
                        </Form.Item>
                    ),
        },
        {
            title: '',
            key: 'actions',
            width: 64,
            render: (_, row) => row.type === 'draft'
                ? (
                        <Button
                            danger
                            onClick={() => {
                                const currentPayments = form.getFieldValue('newPayments') ?? [];
                                form.setFieldValue(
                                    'newPayments',
                                    currentPayments.filter((_: unknown, index: number) => index !== row.draftIndex),
                                );
                                updateDraftRowKeys(prevKeys => prevKeys.filter((_, index) => index !== row.draftIndex));
                            }}
                        >
                            <DeleteOutlined />
                        </Button>
                    )
                : null,
        },
    ];

    return (
        <Form<TransferPaymentFormValues>
            form={form}
            layout="vertical"
            className={styles.form_layout}
            name="transfer-payment-details-form"
        >
            {error && <Alert title={error} type="error" showIcon style={{ marginBottom: 16 }} />}
            {paymentDetails.sharesLocked && (
                <Alert
                    showIcon
                    type="info"
                    message="Доли зафиксированы, потому что по отправке уже есть сохранённые выплаты"
                    style={{ marginBottom: 16 }}
                />
            )}
            {!paymentDetails.sharesLocked && !isSingleReceiver && (
                <Alert
                    showIcon
                    type="info"
                    message="Если заполняете доли, нужно заполнить все строки. Сумма долей должна быть равна общей сумме долга."
                    style={{ marginBottom: 16 }}
                />
            )}
            <Flex gap={12} style={{ maxWidth: '75%' }}>
                <Form.Item label="Перевозчик" className={styles.full_width}>
                    <Input value={paymentDetails.transporter.name} readOnly />
                </Form.Item>
                <Form.Item label="Общая сумма долга" className={styles.full_width}>
                    <Input value={String(paymentDetails.totalDebt)} readOnly />
                </Form.Item>
            </Flex>
            <Flex justify="space-between" align="center" style={{ marginBottom: 12, maxWidth: '75%' }}>
                <Typography.Title level={5} style={{ margin: 0 }}>Доли получателей</Typography.Title>
                {!paymentDetails.sharesLocked && !isSingleReceiver && (
                    <Button disabled={!canClearShares} onClick={onClearShares}>
                        Очистить доли
                    </Button>
                )}
            </Flex>
            <Flex vertical gap={12} style={{ marginBottom: 16, maxWidth: '75%' }}>
                {paymentDetails.shares.map((share, index) => (
                    <Flex key={share.receiverId} gap={12} align="end">
                        <Form.Item label="Получатель" className={styles.full_width} extra=" ">
                            <Input value={share.receiverName} readOnly />
                        </Form.Item>
                        <Form.Item
                            name={['shares', index, 'amount']}
                            label="Доля, $"
                            className={styles.full_width}
                            extra={`Выплачено: $${share.paidAmount}. Остаток: $${share.remainingAmount ?? '—'}`}
                        >
                            <InputNumber
                                disabled={paymentDetails.sharesLocked || isSingleReceiver}
                                min={0}
                                style={{ width: '100%' }}
                                placeholder={isSingleReceiver ? String(paymentDetails.totalDebt) : '0.00'}
                            />
                        </Form.Item>
                    </Flex>
                ))}
            </Flex>
            <Flex justify="space-between" align="center" style={{ marginBottom: 12 }}>
                <Typography.Title level={5} style={{ margin: 0 }}>Выплаты</Typography.Title>
                <Button
                    disabled={!canAddPayments}
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={() => {
                        const currentPayments = form.getFieldValue('newPayments') ?? [];
                        form.setFieldValue('newPayments', [
                            ...currentPayments,
                            { receiverId: null, amount: null, paidAt: null },
                        ]);
                        draftPaymentRowId += 1;
                        updateDraftRowKeys(prevKeys => [...prevKeys, `draft-${draftPaymentRowId}`]);
                    }}
                >
                    Добавить выплату
                </Button>
            </Flex>
            <Table
                pagination={false}
                columns={columns}
                dataSource={paymentRows}
                locale={{ emptyText: 'Выплаты пока не добавлены' }}
                style={{ marginBottom: 16 }}
                rowKey={row => `${draftRowsVersion}-${row.key}`}
                footer={() => (
                    <>
                        <Flex align="center" justify="space-between">
                            <Typography.Text style={{ fontSize: 18 }} strong>
                                Итого оплачено:
                            </Typography.Text>
                            <Typography.Text style={{ fontSize: 18 }} strong>
                                $
                                {paymentDetails.totalPaid}
                            </Typography.Text>
                        </Flex>

                        <Flex align="center" justify="space-between">
                            <Typography.Text type="secondary">Осталось заплатить:</Typography.Text>
                            <Typography.Text type="secondary">
                                $
                                {paymentDetails.totalRemaining}
                            </Typography.Text>
                        </Flex>
                    </>
                )}
            />
            {!canAddPayments && !isSingleReceiver && (
                <Alert
                    showIcon
                    type="warning"
                    message="Для отправки с несколькими получателями сначала заполните доли всех получателей"
                    style={{ marginBottom: 16 }}
                />
            )}
        </Form>
    );
};
