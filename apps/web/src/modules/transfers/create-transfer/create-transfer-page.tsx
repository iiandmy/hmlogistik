import type { UploadFile } from 'antd';
import type { FC } from 'react';
import type { Transfer } from '~utils/types/types';
import { LeftOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { App, Button, Flex, Form, Typography } from 'antd';
import { useState } from 'react';
import { createTransfer } from '~api/transfers';
import { TransferForm } from '~components/transfer-form';
import styles from './create-transfer-page.module.css';

export const CreateTransferPage: FC = () => {
    const navigate = useNavigate();
    const { message } = App.useApp();

    const [transferForm] = Form.useForm<Transfer>();
    const [error, setError] = useState<string | null>(null);
    const [fileList, setFileList] = useState<UploadFile[]>([]);

    const handleCreateTransferError = (): void => {
        setError('Ошибка при создании отправки');
    };

    const handleCreateTransferSuccess = (): void => {
        setError(null);
        message.success('Отправка успешно создана');
        navigate({ to: '/transfers' });
    };

    const { mutate, isPending } = useMutation({
        mutationFn: createTransfer,
        onError: handleCreateTransferError,
        onSuccess: handleCreateTransferSuccess,
    });

    const onCreateTransfer = (transfer: Transfer): void => {
        setError(null);
        const files = fileList
            .flatMap(file => (file.originFileObj ? [file.originFileObj as File] : []));

        mutate({
            payload: {
                ...transfer,
                container: transfer.container ? transfer.container.trim() : null,
                price: Number(transfer.price),
                createdAt: transfer.createdAt?.toISOString(),
                shippedAt: transfer.shippedAt?.toISOString(),
            },
            files,
        });
    };

    return (
        <Flex vertical className={styles.page_container}>
            <Flex align="center">
                <Button type="default" onClick={() => navigate({ to: '/transfers' })}>
                    <LeftOutlined />
                    <Typography.Text>Назад</Typography.Text>
                </Button>
            </Flex>
            <Typography.Title>
                Создать отправку
            </Typography.Title>
            <TransferForm
                form={transferForm}
                onFinish={onCreateTransfer}
                error={error}
                fileList={fileList}
                onFileListChange={setFileList}
            />
            <Flex gap={8}>
                <Button loading={isPending} type="primary" onClick={() => transferForm.submit()}>Создать</Button>
                <Button type="default" onClick={() => navigate({ to: '/transfers' })}>Отменить</Button>
            </Flex>
        </Flex>
    );
};
