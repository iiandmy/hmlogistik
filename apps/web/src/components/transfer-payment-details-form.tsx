import type { FormInstance } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { FC } from 'react';
import type { TransferPaymentDetailsDto } from '~api/transfer-payment-details';
import type { TransferPaymentFormValues } from '~utils/types/types';
import { DeleteOutlined, DollarOutlined, PlusOutlined, TruckFilled } from '@ant-design/icons';
import { Alert, Button, Col, DatePicker, Descriptions, Flex, Form, Input, InputNumber, Row, Select, Statistic, Table, Typography } from 'antd';
import React, { useState } from 'react';
import styles from './form-shared.module.css';

interface Props {
    form: FormInstance<TransferPaymentFormValues>;
    paymentDetails: TransferPaymentDetailsDto;
    error: string | null;
    canAddPayments: boolean;
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
    const receiverOptions = paymentDetails.shares.filter(share => !share.isFullyPaid).map(share => ({
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
            <Flex style={{ width: '50%' }}>
                {paymentDetails.sharesLocked && (
                    <Alert
                        showIcon
                        type="info"
                        title="В отправке есть выплаты. Редактирование долей заблокировано."
                    />
                )}
                {!canAddPayments && !isSingleReceiver && (
                    <Alert
                        showIcon
                        type="warning"
                        title="Для отправки с несколькими получателями сначала заполните доли всех получателей"
                        style={{ marginBottom: 16 }}
                    />
                )}
            </Flex>
            <Flex gap={12} justify="center" style={{ width: '50%', backgroundColor: 'white', borderRadius: '24px', padding: '24px', marginBlock: 16 }} vertical>
                <Flex gap={36} justify="center">
                    <Statistic
                        title="Перевозчик"
                        prefix={<TruckFilled />}
                        value={paymentDetails.transporter.name}
                    />
                    <Statistic
                        title="Общая сумма долга"
                        prefix={<DollarOutlined />}
                        value={paymentDetails.totalDebt}
                    />
                </Flex>
                <Flex vertical gap={12} style={{ width: '100%', marginTop: 12 }}>
                    <Form.Item
                        noStyle
                        shouldUpdate
                    >
                        {({ getFieldValue }) => {
                            const disabled = paymentDetails.sharesLocked || isSingleReceiver;

                            return (
                                disabled
                                    ? (
                                            <Descriptions>
                                                {paymentDetails.shares.map((share, index) => {
                                                    const shareAmount = getFieldValue(['shares', index, 'amount']);
                                                    return (
                                                        <React.Fragment key={share.receiverId}>
                                                            <Descriptions.Item>
                                                                <Typography.Text strong>
                                                                    {share.receiverName}
                                                                </Typography.Text>
                                                            </Descriptions.Item>
                                                            {disabled
                                                                ? (
                                                                        <>
                                                                            <Descriptions.Item label="Доля">
                                                                                $
                                                                                {shareAmount}
                                                                                <Form.Item
                                                                                    name={['shares', index, 'amount']}
                                                                                    hidden
                                                                                    noStyle
                                                                                >
                                                                                    <Input type="hidden" />
                                                                                </Form.Item>
                                                                            </Descriptions.Item>
                                                                            <Descriptions.Item label="Остаток" span="filled">
                                                                                $
                                                                                {share.remainingAmount}
                                                                            </Descriptions.Item>
                                                                        </>
                                                                    )
                                                                : (
                                                                        <Descriptions.Item span="filled">
                                                                            <Form.Item
                                                                                label="Доля"
                                                                                name={['shares', index, 'amount']}
                                                                            >
                                                                                <InputNumber
                                                                                    placeholder="0.00"
                                                                                    style={{ width: '100%' }}
                                                                                    min={0}
                                                                                />
                                                                            </Form.Item>
                                                                        </Descriptions.Item>
                                                                    )}
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </Descriptions>
                                        )
                                    : (
                                            <>
                                                {paymentDetails.shares.map((share, index) => (
                                                    <Row gutter={12} key={share.receiverId}>
                                                        <Col span={8}>
                                                            <Flex style={{ height: '100%' }} align="center">
                                                                <Typography.Text strong>{share.receiverName}</Typography.Text>
                                                            </Flex>
                                                        </Col>
                                                        <Col span={16}>
                                                            <Form.Item
                                                                noStyle
                                                                name={['shares', index, 'amount']}
                                                            >
                                                                <InputNumber
                                                                    placeholder="Доля, $"
                                                                    style={{ width: '100%' }}
                                                                    min={0}
                                                                />
                                                            </Form.Item>
                                                        </Col>
                                                    </Row>
                                                ))}
                                            </>
                                        )
                            );
                        }}
                    </Form.Item>
                </Flex>
            </Flex>
            <Flex justify="space-between" align="center" style={{ marginBottom: 12 }}>
                <Typography.Title level={5} style={{ margin: 0 }}>Выплаты</Typography.Title>
                <Button
                    disabled={!canAddPayments || paymentDetails.totalRemaining === 0}
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
        </Form>
    );
};
