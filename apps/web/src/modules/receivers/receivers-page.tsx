import type { FC } from 'react';
import { EditOutlined } from '@ant-design/icons';
import { App, Button, Flex, Form, Input, Modal, Space, Table, Tag, Typography } from 'antd';
import { useState } from 'react';
import {
    useCreateReceiver,
    useReceiversList,
    useUpdateReceiver,
} from '~api/receivers';
import styles from './receivers-page.module.css';

interface ReceiverFormValues {
    name: string;
}

export const ReceiversPage: FC = () => {
    const { message } = App.useApp();
    const [createForm] = Form.useForm<ReceiverFormValues>();
    const [editForm] = Form.useForm<ReceiverFormValues>();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingReceiver, setEditingReceiver] = useState<{ id: number; name: string } | null>(null);
    const { data, isLoading } = useReceiversList();

    const createMutation = useCreateReceiver({
        onError: () => message.error('Не удалось создать получателя'),
        onSuccess: () => {
            message.success('Получатель создан');
            setIsCreateOpen(false);
            createForm.resetFields();
        },
    });

    const updateMutation = useUpdateReceiver(
        { id: String(editingReceiver?.id ?? 0) },
        {
            onError: () => message.error('Не удалось обновить получателя'),
            onSuccess: () => {
                message.success('Получатель обновлен');
                setEditingReceiver(null);
                editForm.resetFields();
            },
        },
    );

    return (
        <Flex vertical gap={16}>
            <Flex align="center" justify="space-between">
                <Typography.Title style={{ margin: 0 }}>Получатели</Typography.Title>
                <Button
                    type="primary"
                    size="large"
                    onClick={() => setIsCreateOpen(true)}
                    className={styles.create_button}
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
                        title: 'Действия',
                        key: 'actions',
                        width: 120,
                        render: (_, record) => (
                            <Button
                                disabled={record.isPlaceholder}
                                onClick={() => {
                                    setEditingReceiver({ id: record.id, name: record.name });
                                    editForm.setFieldsValue({ name: record.name });
                                }}
                                icon={<EditOutlined />}
                            />
                        ),
                    },
                ]}
            />

            <Modal
                title="Создать получателя"
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
                <Form<ReceiverFormValues>
                    form={createForm}
                    layout="vertical"
                    onFinish={({ name }) => createMutation.mutate({ name: name.trim() })}
                >
                    <Form.Item
                        name="name"
                        label="Название"
                        rules={[{ required: true, message: 'Введите название' }]}
                    >
                        <Input placeholder="Название получателя" />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title="Редактировать получателя"
                open={!!editingReceiver}
                onCancel={() => {
                    setEditingReceiver(null);
                    editForm.resetFields();
                }}
                onOk={() => editForm.submit()}
                okText="Сохранить"
                cancelText="Отмена"
                confirmLoading={updateMutation.isPending}
            >
                <Form<ReceiverFormValues>
                    form={editForm}
                    layout="vertical"
                    onFinish={({ name }) => updateMutation.mutate({ name: name.trim() })}
                >
                    <Form.Item
                        name="name"
                        label="Название"
                        rules={[{ required: true, message: 'Введите название' }]}
                    >
                        <Input placeholder="Название получателя" />
                    </Form.Item>
                </Form>
            </Modal>
        </Flex>
    );
};
