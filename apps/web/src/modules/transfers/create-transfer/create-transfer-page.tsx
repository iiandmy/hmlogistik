import type { UploadFile } from 'antd';
import type { FC } from 'react';
import type { TransferFormValues } from '~utils/types/types';
import { LeftOutlined } from '@ant-design/icons';
import { useNavigate } from '@tanstack/react-router';
import { App, Button, Flex, Form, Typography } from 'antd';
import { useState } from 'react';
import { useReceiversList } from '~api/receivers';
import { useCreateTransfer } from '~api/transfers';
import { useTransportersList } from '~api/transporters';
import { TransferForm } from '~components/transfer-form';
import styles from './create-transfer-page.module.css';

export const CreateTransferPage: FC = () => {
    const navigate = useNavigate();
    const { message } = App.useApp();

    const [transferForm] = Form.useForm<TransferFormValues>();
    const [error, setError] = useState<string | null>(null);
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const { data: transportersData } = useTransportersList({ type: 'Rail' });
    const { data: receiversData } = useReceiversList();

    const handleCreateTransferError = (): void => {
        setError('Ошибка при создании отправки');
    };

    const handleCreateTransferSuccess = (): void => {
        setError(null);
        message.success('Отправка успешно создана');
        navigate({ to: '/transfers' });
    };

    const { mutate, isPending } = useCreateTransfer({
        onError: handleCreateTransferError,
        onSuccess: handleCreateTransferSuccess,
    });

    const onCreateTransfer = (transfer: TransferFormValues): void => {
        setError(null);
        const files = fileList
            .flatMap(file => (file.originFileObj ? [file.originFileObj as File] : []));

        mutate({
            payload: {
                container: transfer.container ? transfer.container.trim() : null,
                price: Number(transfer.price),
                createdAt: transfer.createdAt?.toISOString(),
                shippedAt: transfer.shippedAt?.toISOString(),
                cargo: transfer.cargo.trim(),
                transporterId: Number(transfer.transporterId),
                receiverIds: transfer.receiverIds,
            },
            files,
        });
    };

    return (
        <Flex vertical>
            <Flex align="center" className={styles.navigation_margin}>
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
                transporters={transportersData?.items ?? []}
                receivers={receiversData?.items ?? []}
            />
            <Flex gap={8}>
                <Button loading={isPending} type="primary" onClick={() => transferForm.submit()}>Создать</Button>
                <Button type="default" onClick={() => navigate({ to: '/transfers' })}>Отменить</Button>
            </Flex>
        </Flex>
    );
};
