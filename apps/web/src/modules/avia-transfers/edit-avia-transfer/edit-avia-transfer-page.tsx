import type { FC } from 'react';
import type { AviaTransferFormValues } from '~api/avia-transfers';
import { LeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from '@tanstack/react-router';
import { App, Button, Card, Empty, Flex, Form, Skeleton, Tooltip, Typography } from 'antd';
import { useState } from 'react';
import { mapAviaTransferFormToPayload, useUpdateAviaTransfer } from '~api/avia-transfers';
import { useReceiversList } from '~api/receivers';
import { useTransportersList } from '~api/transporters';
import { AviaTransferForm } from '~components/avia-transfer-form';
import { formatId } from '~utils/lib/formatId';
import styles from './edit-avia-transfer-page.module.css';
import { useAviaTransfer } from './hooks/use-avia-transfer';

export const EditAviaTransferPage: FC = () => {
    const navigate = useNavigate();
    const { message } = App.useApp();
    const { id } = useParams({ from: '/avia-transfers/$id' });

    const { transfer, isLoading, isError } = useAviaTransfer(id);
    const [error, setError] = useState<string | null>(null);
    const [isDirty, setIsDirty] = useState(false);
    const { data: transportersData } = useTransportersList({ type: 'Avia' });
    const { data: receiversData } = useReceiversList();

    const [transferForm] = Form.useForm<AviaTransferFormValues>();

    const handleEditTransferError = (): void => {
        setError('Ошибка при редактировании отправки авиа');
    };

    const handleEditTransferSuccess = (): void => {
        setError(null);
        message.success('Отправка авиа успешно отредактирована');
        navigate({ to: '/avia-transfers' });
    };

    const { mutate, isPending } = useUpdateAviaTransfer(
        { id },
        {
            onError: handleEditTransferError,
            onSuccess: handleEditTransferSuccess,
        },
    );

    const onEditTransfer = (values: AviaTransferFormValues): void => {
        setError(null);
        mutate({
            payload: mapAviaTransferFormToPayload(values),
        });
    };

    const hasErrors = Object.values(transferForm.getFieldsError()).some(field => field.errors.length > 0);

    return (
        <Flex vertical>
            <Flex align="center">
                <Button type="default" onClick={() => navigate({ to: '/avia-transfers' })}>
                    <LeftOutlined />
                    <Typography.Text>Назад</Typography.Text>
                </Button>
            </Flex>
            {isLoading && (
                <Skeleton
                    active
                    paragraph={{ rows: 6 }}
                    style={{ marginTop: 16 }}
                />
            )}
            {!isLoading && (isError || !transfer) && (
                <Card className={styles.card_not_found}>
                    <Empty
                        description="Не найдено"
                        style={{ marginTop: 16 }}
                    />
                </Card>
            )}
            {!isLoading && transfer && (
                <>
                    <Typography.Title>
                        Отправка
                        {' '}
                        {formatId(transfer.id, 'А')}
                    </Typography.Title>
                    <AviaTransferForm
                        form={transferForm}
                        initialValues={transfer}
                        onFinish={onEditTransfer}
                        error={error}
                        onValuesChange={() => setIsDirty(true)}
                        transporters={transportersData?.items ?? []}
                        receivers={receiversData?.items ?? []}
                    />
                    <Flex gap={8}>
                        <Tooltip
                            title={hasErrors ? 'Исправьте ошибки в форме' : 'Внесите изменение, чтобы сохранить'}
                            trigger={isDirty && !hasErrors ? [] : ['hover']}
                        >
                            <Button
                                disabled={!isDirty || hasErrors}
                                loading={isPending}
                                type="primary"
                                onClick={() => transferForm.submit()}
                            >
                                Сохранить
                            </Button>
                        </Tooltip>
                        <Button type="default" onClick={() => navigate({ to: '/avia-transfers' })}>Отменить</Button>
                    </Flex>
                </>
            )}
        </Flex>
    );
};
