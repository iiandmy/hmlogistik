import type { UploadFile } from 'antd';
import type { FC } from 'react';
import type { UpdateTransferPayload } from '~api/transfers';
import type { TransferFormValues } from '~utils/types/types';
import { green, yellow } from '@ant-design/colors';
import { CheckCircleTwoTone, LeftOutlined, WarningTwoTone } from '@ant-design/icons';
import { useNavigate, useParams } from '@tanstack/react-router';
import { App, Button, Card, Empty, Flex, Form, Skeleton, Tooltip, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { useReceiversList } from '~api/receivers';
import { useUpdateTransfer } from '~api/transfers';
import { useTransportersList } from '~api/transporters';
import { TransferForm } from '~components/transfer-form';
import { useTransfer } from '~modules/transfers/edit-transfer/hooks/use-transfer';
import { formatId } from '~utils/lib/format-id';
import { getPaymentDelayExceptionContent } from '~utils/lib/get-payment-delay-exception-content';
import { getPaymentDelayExceptionFlags } from '~utils/lib/get-payment-delay-exception-flags';
import styles from './edit-transfer-page.module.css';

export const EditTransferPage: FC = () => {
    const navigate = useNavigate();
    const { message } = App.useApp();
    const { id } = useParams({ from: '/transfers/$id' });

    const {
        transfer,
        legacyTransporterName,
        legacyReceiverName,
        files: transferFiles,
        isLoading,
        isError,
    } = useTransfer(id);
    const [diff, setDiff] = useState<Partial<TransferFormValues>>({});
    const [error, setError] = useState<string | null>(null);
    const [newFiles, setNewFiles] = useState<UploadFile[]>([]);
    const [removedFileIds, setRemovedFileIds] = useState<number[]>([]);
    const { data: transportersData } = useTransportersList({ type: 'Rail' });
    const { data: receiversData } = useReceiversList();

    const [transferForm] = Form.useForm<TransferFormValues>();

    const shippedAt = Form.useWatch('shippedAt', transferForm);
    const actDate = Form.useWatch('actDate', transferForm);
    const transporterId = Form.useWatch('transporterId', transferForm);
    const receiverIds = Form.useWatch('receiverIds', transferForm) as number[] | undefined;

    const transporter = transportersData?.items.find(transporter => transporter.id === transporterId);
    const receivers = receiversData?.items.filter(receiver => receiverIds?.includes(receiver.id));
    const exceptionFlags = actDate && transporter
        ? getPaymentDelayExceptionFlags({
                paymentDelayDays: transporter.paymentDelayDays,
                paymentDelayExceptions: transporter.paymentDelayExceptions.map(exception => ({
                    receiverId: exception.receiver.id,
                    receiverName: exception.receiver.name,
                    paymentDelayDays: exception.paymentDelayDays,
                })),
            }, receivers ?? [], actDate)
        : {};
    const { shouldShowPaymentDelayException, tooltipContent } = getPaymentDelayExceptionContent({
        paymentExceptionFlags: exceptionFlags,
        receivers: receivers ?? [],
    });

    const handleEditTransferError = (): void => {
        setError('Ошибка при редактировании отправки');
    };

    const handleEditTransferSuccess = (): void => {
        setError(null);
        message.success('Отправка успешно отредактирована');
        navigate({ to: '/transfers' });
    };

    const { mutate, isPending } = useUpdateTransfer(
        { id },
        {
            onError: handleEditTransferError,
            onSuccess: handleEditTransferSuccess,
        },
    );

    const existingFileList = useMemo(() => transferFiles
        .filter(file => !removedFileIds.includes(file.id))
        .map((file): UploadFile => ({
            uid: `existing-${file.id}`,
            name: file.originalName,
            status: 'done',
            url: file.downloadUrl,
            type: file.mimeType,
            size: file.sizeBytes,
        })), [removedFileIds, transferFiles]);

    const fileList = useMemo(() => [...existingFileList, ...newFiles], [existingFileList, newFiles]);

    const onEditTransfer = (): void => {
        setError(null);

        const files = newFiles
            .flatMap(file => (file.originFileObj ? [file.originFileObj as File] : []));

        const createdAt = diff.createdAt ? diff.createdAt.toISOString() : diff.createdAt;
        const shippedAt = diff.shippedAt ? diff.shippedAt.toISOString() : diff.shippedAt;
        const declarationDate = diff.declarationDate ? diff.declarationDate.toISOString() : diff.declarationDate;
        const actDate = diff.actDate ? diff.actDate.toISOString() : diff.actDate;

        const payload: UpdateTransferPayload = {
            container: diff.container === undefined ? undefined : (diff.container.trim() ? diff.container : null),
            price: diff.price ? Number(diff.price) : undefined,
            createdAt,
            shippedAt,
            declarationDate,
            actDate,
            cargo: diff.cargo === undefined ? undefined : diff.cargo.trim(),
            transporterId: diff.transporterId === undefined || diff.transporterId === null ? undefined : Number(diff.transporterId),
            receiverIds: diff.receiverIds,
        };

        mutate({
            payload,
            files,
            removedFileIds,
        });
    };

    const onFileRemove = (file: UploadFile): void => {
        if (file.uid.startsWith('existing-')) {
            const fileId = Number(file.uid.replace('existing-', ''));
            if (Number.isFinite(fileId) && fileId > 0) {
                setRemovedFileIds(prevIds => (prevIds.includes(fileId) ? prevIds : [...prevIds, fileId]));
            }
        }
    };

    const onFileListChange = (nextFileList: UploadFile[]): void => {
        setNewFiles(nextFileList.filter(file => !file.uid.startsWith('existing-')));
    };

    const onValuesChange = (changedValues: Partial<TransferFormValues>): void => {
        setDiff(prevDiff => ({ ...prevDiff, ...changedValues }));
    };

    const hasDiff = Object.keys(diff).length !== 0 || newFiles.length > 0 || removedFileIds.length > 0;
    const hasErrors = Object.values(transferForm.getFieldsError()).some(field => field.errors.length > 0);

    return (
        <Flex vertical>
            <Flex align="center" className={styles.navigation_margin}>
                <Button type="default" onClick={() => navigate({ to: '/transfers' })}>
                    <LeftOutlined />
                    <Typography.Text>Назад</Typography.Text>
                </Button>
            </Flex>
            {isLoading && (
                <Skeleton
                    active
                    paragraph={{ rows: 8 }}
                />
            )}
            {!isLoading && (isError || !transfer) && (
                <Card className={styles.card_not_found}>
                    <Empty
                        description="Не найдено"
                    />
                </Card>
            )}
            {!isLoading && transfer && (
                <>
                    <Flex align="center" gap={4}>
                        {shippedAt && !shouldShowPaymentDelayException && (
                            <Tooltip title="Отправка доставлена">
                                <CheckCircleTwoTone twoToneColor={green[5]} className={styles.alert} />
                            </Tooltip>
                        )}
                        {shouldShowPaymentDelayException && (
                            <Tooltip title={tooltipContent}>
                                <WarningTwoTone twoToneColor={yellow[6]} className={styles.alert} />
                                {' '}
                            </Tooltip>
                        )}
                        <Typography.Title>
                            Отправка
                            {' '}
                            {formatId(transfer.id)}
                        </Typography.Title>
                    </Flex>
                    <TransferForm
                        form={transferForm}
                        initialValues={transfer}
                        onFinish={onEditTransfer}
                        error={error}
                        legacyTransporterName={legacyTransporterName}
                        legacyReceiverName={legacyReceiverName}
                        onValuesChange={onValuesChange}
                        fileList={fileList}
                        onFileListChange={onFileListChange}
                        onFileRemove={onFileRemove}
                        transporters={transportersData?.items ?? []}
                        receivers={receiversData?.items ?? []}
                    />
                    <Flex gap={8}>
                        <Tooltip
                            title={hasErrors ? 'Исправьте ошибки в форме' : 'Внесите изменение, чтобы сохранить'}
                            trigger={hasDiff && !hasErrors ? [] : ['hover']}
                        >
                            <Button
                                disabled={!hasDiff || hasErrors}
                                loading={isPending}
                                type="primary"
                                onClick={() => transferForm.submit()}
                            >
                                Сохранить
                            </Button>
                        </Tooltip>
                        <Button type="default" onClick={() => navigate({ to: '/transfers' })}>Отменить</Button>
                    </Flex>
                </>
            )}
        </Flex>
    );
};
