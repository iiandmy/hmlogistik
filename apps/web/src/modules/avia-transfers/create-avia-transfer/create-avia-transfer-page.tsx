import type { FC } from 'react';
import type { AviaTransferFormValues } from '~api/avia-transfers';
import { LeftOutlined } from '@ant-design/icons';
import { useNavigate } from '@tanstack/react-router';
import { App, Button, Flex, Form, Typography } from 'antd';
import { useState } from 'react';
import { mapAviaTransferFormToPayload, useCreateAviaTransfer } from '~api/avia-transfers';
import { useReceiversList } from '~api/receivers';
import { useTransportersList } from '~api/transporters';
import { AviaTransferForm } from '~components/avia-transfer-form';
import styles from './create-avia-transfer-page.module.css';

export const CreateAviaTransferPage: FC = () => {
    const navigate = useNavigate();
    const { message } = App.useApp();

    const [transferForm] = Form.useForm<AviaTransferFormValues>();
    const [error, setError] = useState<string | null>(null);
    const { data: transportersData } = useTransportersList({ type: 'Avia' });
    const { data: receiversData } = useReceiversList();

    const handleCreateTransferError = (): void => {
        setError('Ошибка при создании отправки авиа');
    };

    const handleCreateTransferSuccess = (): void => {
        setError(null);
        message.success('Отправка авиа успешно создана');
        navigate({ to: '/avia-transfers' });
    };

    const { mutate, isPending } = useCreateAviaTransfer({
        onError: handleCreateTransferError,
        onSuccess: handleCreateTransferSuccess,
    });

    const onCreateTransfer = (transfer: AviaTransferFormValues): void => {
        setError(null);
        mutate({
            payload: mapAviaTransferFormToPayload(transfer),
        });
    };

    return (
        <Flex vertical>
            <Flex align="center" className={styles.navigation_margin}>
                <Button type="default" onClick={() => navigate({ to: '/avia-transfers' })}>
                    <LeftOutlined />
                    <Typography.Text>Назад</Typography.Text>
                </Button>
            </Flex>
            <Typography.Title>
                Создать отправку авиа
            </Typography.Title>
            <AviaTransferForm
                form={transferForm}
                onFinish={onCreateTransfer}
                error={error}
                initialValues={{
                    id: 0,
                    departedAt: null,
                    invoiceNumber: '',
                    cargoData: {
                        cargoSpaces: null,
                        volume: null,
                        weight: null,
                    },
                    usdRate: null,
                    cnyRate: null,
                    transporterId: null,
                    receiverIds: [],
                }}
                transporters={transportersData?.items ?? []}
                receivers={receiversData?.items ?? []}
            />
            <Flex gap={8}>
                <Button loading={isPending} type="primary" onClick={() => transferForm.submit()}>Создать</Button>
                <Button type="default" onClick={() => navigate({ to: '/avia-transfers' })}>Отменить</Button>
            </Flex>
        </Flex>
    );
};
