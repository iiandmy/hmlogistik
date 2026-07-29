import type { UploadFile } from 'antd';
import type { FC } from 'react';
import type { UpdateTransferPayload } from '~api/transfers';
import type { Transfer } from '~utils/types/types';
import { CheckCircleTwoTone, LeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from '@tanstack/react-router';
import { App, Button, Card, Empty, Flex, Form, Skeleton, Tooltip, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { useUpdateTransfer } from '~api/transfers';
import { TransferForm } from '~components/transfer-form';
import { useTransfer } from '~modules/transfers/edit-transfer/hooks/use-transfer';
import { formatId } from '~utils/lib/formatId';
import styles from './edit-transfer-page.module.css';

export const EditTransferPage: FC = () => {
    const navigate = useNavigate();
    const { message } = App.useApp();
    const { id } = useParams({ from: '/transfers/$id' });

    const { transfer, files: transferFiles, isLoading, isError } = useTransfer(id);
    const [diff, setDiff] = useState<Partial<Transfer>>({});
    const [error, setError] = useState<string | null>(null);
    const [newFiles, setNewFiles] = useState<UploadFile[]>([]);
    const [removedFileIds, setRemovedFileIds] = useState<number[]>([]);

    const [transferForm] = Form.useForm<Transfer>();

    const shippedAt = Form.useWatch('shippedAt', transferForm);

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

        const payload: UpdateTransferPayload = {
            ...diff,
            container: diff.container === undefined ? undefined : (diff.container.trim() ? diff.container : null),
            price: diff.price ? Number(diff.price) : undefined,
            createdAt,
            shippedAt,
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

    const onValuesChange = (changedValues: Partial<Transfer>): void => {
        setDiff(prevDiff => ({ ...prevDiff, ...changedValues }));
    };

    const hasDiff = Object.keys(diff).length !== 0 || newFiles.length > 0 || removedFileIds.length > 0;
    const hasErrors = Object.values(transferForm.getFieldsError()).some(field => field.errors.length > 0);

    return (
        <Flex vertical className={styles.page_container}>
            <Flex align="center">
                <Button type="default" onClick={() => navigate({ to: '/transfers' })}>
                    <LeftOutlined />
                    <Typography.Text>Назад</Typography.Text>
                </Button>
            </Flex>
            {isLoading && (
                <Skeleton
                    active
                    paragraph={{ rows: 8 }}
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
                        {shippedAt && (
                            <Tooltip title="Отправка доставлена">
                                <CheckCircleTwoTone twoToneColor="#13ba00" />
                            </Tooltip>
                        )}
                        {' '}
                        Отправка №
                        {formatId(transfer.id)}
                    </Typography.Title>
                    <TransferForm
                        form={transferForm}
                        initialValues={transfer}
                        onFinish={onEditTransfer}
                        error={error}
                        onValuesChange={onValuesChange}
                        fileList={fileList}
                        onFileListChange={onFileListChange}
                        onFileRemove={onFileRemove}
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
