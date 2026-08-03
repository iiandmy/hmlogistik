import type { FC } from 'react';
import type { CreateTransporterPayload, TransporterDto, TransporterType } from '~api/transporters';
import { EditOutlined } from '@ant-design/icons';
import { App, Button, Flex, Form, Input, InputNumber, Modal, Select, Space, Table, Tag, Tooltip, Typography } from 'antd';
import { useState } from 'react';
import { useReceiversList } from '~api/receivers';
import {

    useCreateTransporter,
    useTransportersList,
    useUpdateTransporter,
} from '~api/transporters';

interface TransporterDelayExceptionFormValue {
    receiverId: number | null;
    paymentDelayDays: number | null;
}

interface TransporterFormValues {
    name: string;
    type: TransporterType;
    paymentDelayDays: number | null;
    paymentDelayExceptions: TransporterDelayExceptionFormValue[];
}

export const TransportersPage: FC = () => {
    const { message } = App.useApp();
    const [createForm] = Form.useForm<TransporterFormValues>();
    const [editForm] = Form.useForm<TransporterFormValues>();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editing, setEditing] = useState<TransporterDto | null>(null);
    const { data, isLoading } = useTransportersList();
    const { data: receiversData } = useReceiversList();

    const receiverOptions = (receiversData?.items ?? [])
        .filter(receiver => !receiver.isPlaceholder)
        .map(receiver => ({
            value: receiver.id,
            label: receiver.name,
        }));

    const createMutation = useCreateTransporter({
        onError: () => message.error('Не удалось создать перевозчика'),
        onSuccess: () => {
            message.success('Перевозчик создан');
            setIsCreateOpen(false);
            createForm.resetFields();
        },
    });

    const updateMutation = useUpdateTransporter(
        { id: String(editing?.id ?? 0) },
        {
            onError: () => message.error('Не удалось обновить перевозчика'),
            onSuccess: () => {
                message.success('Перевозчик обновлен');
                setEditing(null);
                editForm.resetFields();
            },
        },
    );

    const mapDelayExceptionsToPayload = (
        exceptions: TransporterDelayExceptionFormValue[] | undefined,
    ): CreateTransporterPayload['paymentDelayExceptions'] => (exceptions ?? [])
        .filter(exception => exception.receiverId !== null)
        .map(exception => ({
            receiverId: Number(exception.receiverId),
            paymentDelayDays: Number(exception.paymentDelayDays ?? 0),
        }));

    const handleCreate = (values: TransporterFormValues): void => {
        const payload: CreateTransporterPayload = {
            name: values.name.trim(),
            type: values.type,
            paymentDelayDays: values.type === 'Rail' ? values.paymentDelayDays ?? 0 : null,
            paymentDelayExceptions: values.type === 'Rail'
                ? mapDelayExceptionsToPayload(values.paymentDelayExceptions)
                : [],
        };

        createMutation.mutate(payload);
    };

    return (
        <Flex vertical gap={16}>
            <Flex align="center" justify="space-between">
                <Typography.Title style={{ margin: 0 }}>Перевозчики</Typography.Title>
                <Button
                    type="primary"
                    onClick={() => {
                        createForm.setFieldsValue({
                            type: 'Rail',
                            paymentDelayDays: 0,
                            name: '',
                            paymentDelayExceptions: [],
                        });
                        setIsCreateOpen(true);
                    }}
                >
                    Создать
                </Button>
            </Flex>

            <Table
                rowKey="id"
                loading={isLoading}
                dataSource={data?.items ?? []}
                pagination={false}
                columns={[
                    {
                        title: 'Название',
                        key: 'name',
                        render: (_, record) => (
                            <Space>
                                <span>{record.name}</span>
                                {record.isPlaceholder && <Tag color="gold">Placeholder</Tag>}
                            </Space>
                        ),
                    },
                    {
                        title: 'Тип',
                        dataIndex: 'type',
                        key: 'type',
                        render: (type: TransporterType) => <Tag color={type === 'Rail' ? 'blue' : 'purple'}>{type === 'Rail' ? 'ЖД' : 'Авиа'}</Tag>,
                    },
                    {
                        title: 'Отсрочка',
                        key: 'paymentDelayDays',
                        render: (_, record) => record.type === 'Rail' ? `${record.paymentDelayDays ?? 0} дн.` : '—',
                    },
                    {
                        title: 'Исключения',
                        key: 'paymentDelayExceptions',
                        render: (_, { paymentDelayExceptions, type }) => type === 'Rail' && paymentDelayExceptions.length > 0
                            ? (
                                    <Flex gap={4} wrap>
                                        {paymentDelayExceptions.map(rule => (
                                            <Tooltip
                                                key={rule.receiver.id}
                                                title={`Отсрочка на ${rule.paymentDelayDays} дней`}
                                            >
                                                <Tag>{rule.receiver.name}</Tag>
                                            </Tooltip>
                                        ))}
                                    </Flex>
                                )
                            : '—',
                    },
                    {
                        title: 'Действия',
                        key: 'actions',
                        width: 120,
                        render: (_, record) => (
                            <Button
                                disabled={record.isPlaceholder}
                                onClick={() => {
                                    setEditing(record);
                                    editForm.setFieldsValue({
                                        name: record.name,
                                        type: record.type,
                                        paymentDelayDays: record.paymentDelayDays,
                                        paymentDelayExceptions: record.paymentDelayExceptions.map(rule => ({
                                            receiverId: rule.receiver.id,
                                            paymentDelayDays: rule.paymentDelayDays,
                                        })),
                                    });
                                }}
                                shape="square"
                            >
                                <EditOutlined />
                            </Button>
                        ),
                    },
                ]}
            />

            <Modal
                title="Создать перевозчика"
                open={isCreateOpen}
                onCancel={() => {
                    setIsCreateOpen(false);
                    createForm.resetFields();
                }}
                onOk={() => createForm.submit()}
                okText="Создать"
                cancelText="Отмена"
                confirmLoading={createMutation.isPending}
            >
                <Form<TransporterFormValues>
                    form={createForm}
                    layout="vertical"
                    initialValues={{ type: 'Rail', paymentDelayDays: 0, paymentDelayExceptions: [] }}
                    onFinish={handleCreate}
                >
                    <Form.Item
                        name="name"
                        label="Название"
                        rules={[{ required: true, message: 'Введите название' }]}
                    >
                        <Input placeholder="Название перевозчика" />
                    </Form.Item>
                    <Form.Item name="type" label="Тип" rules={[{ required: true, message: 'Выберите тип' }]}>
                        <Select
                            options={[
                                { value: 'Rail', label: 'ЖД' },
                                { value: 'Avia', label: 'Авиа' },
                            ]}
                        />
                    </Form.Item>
                    <Form.Item shouldUpdate noStyle>
                        {({ getFieldValue }) => getFieldValue('type') === 'Rail'
                            ? (
                                    <Flex vertical gap={12}>
                                        <Form.Item
                                            name="paymentDelayDays"
                                            label="Отсрочка, дней"
                                            rules={[{ required: true, message: 'Введите отсрочку' }]}
                                        >
                                            <InputNumber min={0} style={{ width: '100%' }} />
                                        </Form.Item>
                                        <Form.List name="paymentDelayExceptions">
                                            {(fields, { add, remove }) => (
                                                <Flex vertical gap={12}>
                                                    <Button type="dashed" onClick={() => add({ receiverId: null, paymentDelayDays: null })}>
                                                        + Добавить исключение
                                                    </Button>
                                                    {fields.map(field => (
                                                        <Space key={field.key} align="start" style={{ display: 'flex' }}>
                                                            <Form.Item
                                                                name={[field.name, 'receiverId']}
                                                                label="Получатель"
                                                                rules={[{ required: true, message: 'Выберите получателя' }]}
                                                            >
                                                                <Select style={{ width: 260 }} options={receiverOptions} />
                                                            </Form.Item>
                                                            <Form.Item
                                                                name={[field.name, 'paymentDelayDays']}
                                                                label="Отсрочка, дней"
                                                                rules={[{ required: true, message: 'Введите отсрочку' }]}
                                                            >
                                                                <InputNumber min={0} style={{ width: 180 }} />
                                                            </Form.Item>
                                                            <Button onClick={() => remove(field.name)}>Удалить</Button>
                                                        </Space>
                                                    ))}
                                                </Flex>
                                            )}
                                        </Form.List>
                                    </Flex>
                                )
                            : null}
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title="Редактировать перевозчика"
                open={!!editing}
                onCancel={() => {
                    setEditing(null);
                    editForm.resetFields();
                }}
                onOk={() => editForm.submit()}
                okText="Сохранить"
                cancelText="Отмена"
                confirmLoading={updateMutation.isPending}
            >
                <Form<TransporterFormValues>
                    form={editForm}
                    layout="vertical"
                    onFinish={(values) => {
                        if (!editing) {
                            return;
                        }

                        updateMutation.mutate({
                            name: values.name.trim(),
                            paymentDelayDays: editing.type === 'Rail' ? values.paymentDelayDays ?? 0 : null,
                            paymentDelayExceptions: editing.type === 'Rail'
                                ? mapDelayExceptionsToPayload(values.paymentDelayExceptions)
                                : [],
                        });
                    }}
                >
                    <Form.Item
                        name="name"
                        label="Название"
                        rules={[{ required: true, message: 'Введите название' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item label="Тип">
                        <Tag color={editing?.type === 'Rail' ? 'blue' : 'purple'}>
                            {editing?.type === 'Rail' ? 'ЖД' : 'Авиа'}
                        </Tag>
                    </Form.Item>
                    {editing?.type === 'Rail' && (
                        <Flex vertical gap={12}>
                            <Form.Item
                                name="paymentDelayDays"
                                label="Отсрочка, дней"
                                rules={[{ required: true, message: 'Введите отсрочку' }]}
                            >
                                <InputNumber min={0} style={{ width: '100%' }} />
                            </Form.Item>
                            <Form.List name="paymentDelayExceptions">
                                {(fields, { add, remove }) => (
                                    <Flex vertical gap={12}>
                                        <Button type="dashed" onClick={() => add({ receiverId: null, paymentDelayDays: null })}>
                                            + Добавить исключение
                                        </Button>
                                        {fields.map(field => (
                                            <Space key={field.key} align="start" style={{ display: 'flex' }}>
                                                <Form.Item
                                                    name={[field.name, 'receiverId']}
                                                    label="Получатель"
                                                    rules={[{ required: true, message: 'Выберите получателя' }]}
                                                >
                                                    <Select style={{ width: 260 }} options={receiverOptions} />
                                                </Form.Item>
                                                <Form.Item
                                                    name={[field.name, 'paymentDelayDays']}
                                                    label="Отсрочка, дней"
                                                    rules={[{ required: true, message: 'Введите отсрочку' }]}
                                                >
                                                    <InputNumber min={0} style={{ width: 180 }} />
                                                </Form.Item>
                                                <Button onClick={() => remove(field.name)}>Удалить</Button>
                                            </Space>
                                        ))}
                                    </Flex>
                                )}
                            </Form.List>
                        </Flex>
                    )}
                </Form>
            </Modal>
        </Flex>
    );
};
