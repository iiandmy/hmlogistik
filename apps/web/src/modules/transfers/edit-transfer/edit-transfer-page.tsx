import type { UploadFile } from 'antd';
import type { FC } from 'react';
import type { UpdateTransferPaymentDetailsPayload } from '~api/transfer-payment-details';
import type { UpdateTransferPayload } from '~api/transfers';
import type { TransferFormValues, TransferPaymentFormValues } from '~utils/types/types';
import { green, yellow } from '@ant-design/colors';
import { CheckCircleTwoTone, LeftOutlined, WarningTwoTone } from '@ant-design/icons';
import { useNavigate, useParams } from '@tanstack/react-router';
import { Alert, App, Button, Card, Empty, Flex, Form, Skeleton, Tabs, Tooltip, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useReceiversList } from '~api/receivers';
import { useTransferPaymentDetails, useUpdateTransferPaymentDetails } from '~api/transfer-payment-details';
import { useUpdateTransfer } from '~api/transfers';
import { useTransportersList } from '~api/transporters';
import { TransferForm } from '~components/transfer-form';
import { TransferPaymentDetailsForm } from '~components/transfer-payment-details-form';
import { useTransfer } from '~modules/transfers/edit-transfer/hooks/use-transfer';
import { formatId } from '~utils/lib/format-id';
import { getPaymentDelayExceptionContent } from '~utils/lib/get-payment-delay-exception-content';
import styles from './edit-transfer-page.module.css';

export const EditTransferPage: FC = () => {
    const navigate = useNavigate();
    const { message } = App.useApp();
    const { id } = useParams({ from: '/transfers/$id' });

    const {
        transfer,
        transferMeta,
        legacyTransporterName,
        legacyReceiverName,
        files: transferFiles,
        isLoading,
        isError,
    } = useTransfer(id);
    const {
        data: paymentDetails,
        isLoading: isPaymentDetailsLoading,
        isError: isPaymentDetailsError,
    } = useTransferPaymentDetails({ transferId: id }, { enabled: !!transferMeta });
    const [detailsDiff, setDetailsDiff] = useState<Partial<TransferFormValues>>({});
    const [detailsError, setDetailsError] = useState<string | null>(null);
    const [paymentError, setPaymentError] = useState<string | null>(null);
    const [paymentDraftRowsVersion, setPaymentDraftRowsVersion] = useState(0);
    const [newFiles, setNewFiles] = useState<UploadFile[]>([]);
    const [removedFileIds, setRemovedFileIds] = useState<number[]>([]);
    const { data: transportersData } = useTransportersList({ type: 'Rail' });
    const { data: receiversData } = useReceiversList();

    const [transferForm] = Form.useForm<TransferFormValues>();
    const [paymentForm] = Form.useForm<TransferPaymentFormValues>();

    const shippedAt = Form.useWatch('shippedAt', transferForm);
    const paymentShares = Form.useWatch('shares', paymentForm) ?? [];
    const draftPayments = Form.useWatch('newPayments', paymentForm) ?? [];

    const { shouldShowPaymentDelayException, tooltipContent } = getPaymentDelayExceptionContent({
        paymentAlert: transferMeta?.paymentAlert ?? { shouldShow: false, overdueReceivers: [] },
    });

    const handleEditTransferError = (): void => {
        setDetailsError(null);
    };

    const handleEditTransferSuccess = (): void => {
        setDetailsError(null);
        message.success('Данные об отправке успешно обновлены');
        setDetailsDiff({});
        setNewFiles([]);
        setRemovedFileIds([]);
    };

    const handlePaymentUpdateError = (): void => {
        setPaymentError(null);
    };

    const handlePaymentUpdateSuccess = (): void => {
        setPaymentError(null);
        message.success('Данные об оплате успешно обновлены');
        paymentForm.setFieldValue('newPayments', []);
        setPaymentDraftRowsVersion(prev => prev + 1);
    };

    const { mutate: updateTransfer, isPending: isTransferPending } = useUpdateTransfer(
        { id },
        {
            onError: handleEditTransferError,
            onSuccess: handleEditTransferSuccess,
        },
    );

    const { mutate: updatePaymentDetails, isPending: isPaymentPending } = useUpdateTransferPaymentDetails(
        { transferId: id },
        {
            onError: handlePaymentUpdateError,
            onSuccess: handlePaymentUpdateSuccess,
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

    useEffect(() => {
        if (!paymentDetails) {
            return;
        }

        paymentForm.setFieldsValue({
            shares: paymentDetails.shares.map(share => ({
                receiverId: share.receiverId,
                amount: share.amount,
            })),
            newPayments: [],
        });
    }, [paymentDetails, paymentForm]);

    const onEditTransfer = (): void => {
        setDetailsError(null);

        const files = newFiles.flatMap(file => (file.originFileObj ? [file.originFileObj as File] : []));

        const createdAt = detailsDiff.createdAt ? detailsDiff.createdAt.toISOString() : detailsDiff.createdAt;
        const shippedAt = detailsDiff.shippedAt ? detailsDiff.shippedAt.toISOString() : detailsDiff.shippedAt;
        const declarationDate = detailsDiff.declarationDate ? detailsDiff.declarationDate.toISOString() : detailsDiff.declarationDate;
        const actDate = detailsDiff.actDate ? detailsDiff.actDate.toISOString() : detailsDiff.actDate;

        const payload: UpdateTransferPayload = {
            container: detailsDiff.container === undefined ? undefined : (detailsDiff.container.trim() ? detailsDiff.container : null),
            price: detailsDiff.price ? Number(detailsDiff.price) : undefined,
            createdAt,
            shippedAt,
            declarationDate,
            actDate,
            cargo: detailsDiff.cargo === undefined ? undefined : detailsDiff.cargo.trim(),
            transporterId: detailsDiff.transporterId === undefined || detailsDiff.transporterId === null ? undefined : Number(detailsDiff.transporterId),
            receiverIds: detailsDiff.receiverIds,
        };

        updateTransfer({
            payload,
            files,
            removedFileIds,
        });
    };

    const onUpdatePaymentDetails = (): void => {
        setPaymentError(null);

        if (!paymentDetails) {
            return;
        }

        const values = paymentForm.getFieldsValue();
        const normalizedShares = paymentDetails.shares.map((share, index) => ({
            receiverId: share.receiverId,
            amount: values.shares?.[index]?.amount ?? null,
        }));
        const normalizedPayments = values.newPayments
            ?.filter(payment => payment.receiverId || payment.amount || payment.paidAt)
            .map(payment => ({
                receiverId: payment.receiverId,
                amount: payment.amount,
                paidAt: payment.paidAt,
            })) ?? [];
        const initialShareAmounts = paymentDetails.shares.map(share => share.amount ?? null);
        const nextShareAmounts = normalizedShares.map(share => share.amount ?? null);
        const hasShareChangesInPayload = initialShareAmounts.some(
            (amount, index) => amount !== (nextShareAmounts[index] ?? null),
        );

        if (paymentDetails.shares.length > 1) {
            const hasShareAmount = normalizedShares.some(share => share.amount !== null && share.amount !== undefined);
            const hasEmptyShare = normalizedShares.some(share => share.amount === null || share.amount === undefined);

            if (hasShareAmount && hasEmptyShare) {
                setPaymentError('Заполните доли для всех получателей или очистите их полностью');
                return;
            }

            if (hasShareAmount) {
                const sharesTotal = Number(normalizedShares.reduce((sum, share) => sum + Number(share.amount ?? 0), 0).toFixed(2));
                if (sharesTotal !== paymentDetails.totalDebt) {
                    setPaymentError('Сумма долей должна быть равна общей сумме долга');
                    return;
                }
            }
        }

        if (normalizedPayments.some(payment => !payment.receiverId || !payment.amount || !payment.paidAt)) {
            setPaymentError('Заполните все поля в новых выплатах или удалите незаполненные строки');
            return;
        }

        const payload: UpdateTransferPaymentDetailsPayload = {
            shares: hasShareChangesInPayload ? normalizedShares : undefined,
            newPayments: normalizedPayments.map(payment => ({
                receiverId: Number(payment.receiverId),
                amount: Number(payment.amount),
                paidAt: payment.paidAt!.toISOString(),
            })),
        };

        updatePaymentDetails(payload);
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
        setDetailsDiff(prevDiff => ({ ...prevDiff, ...changedValues }));
    };

    const hasTransferDiff = Object.keys(detailsDiff).length !== 0 || newFiles.length > 0 || removedFileIds.length > 0;
    const hasTransferErrors = Object.values(transferForm.getFieldsError()).some(field => field.errors.length > 0);
    const hasDraftPayments = draftPayments.length > 0;
    const initialShareAmounts = paymentDetails?.shares.map(share => share.amount ?? null) ?? [];
    const currentShareAmounts = paymentShares.map(share => share.amount ?? null);
    const hasShareChanges = initialShareAmounts.length > 0
        && initialShareAmounts.some((amount, index) => amount !== (currentShareAmounts[index] ?? null));
    const canAddPayments = !!paymentDetails
        && (paymentDetails.shares.length === 1 || currentShareAmounts.every(amount => amount !== null && amount !== undefined));
    const canClearShares = currentShareAmounts.some(amount => amount !== null && amount !== undefined);
    const hasPaymentChanges = hasShareChanges || hasDraftPayments;

    return (
        <Flex vertical>
            <Flex align="center" className={styles.navigation_margin}>
                <Button type="default" onClick={() => navigate({ to: '/transfers' })}>
                    <LeftOutlined />
                    <Typography.Text>Назад</Typography.Text>
                </Button>
            </Flex>
            {isLoading && (
                <Skeleton active paragraph={{ rows: 8 }} />
            )}
            {!isLoading && (isError || !transfer || !transferMeta) && (
                <Card className={styles.card_not_found}>
                    <Empty description="Не найдено" />
                </Card>
            )}
            {!isLoading && transfer && transferMeta && (
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
                            {formatId(transferMeta.id)}
                        </Typography.Title>
                    </Flex>

                    <Tabs
                        items={[
                            {
                                key: 'details',
                                label: 'Данные об отправке',
                                children: (
                                    <>
                                        {(!transferMeta.isReceiversEditable || !transferMeta.isPriceEditable) && (
                                            <Alert
                                                showIcon
                                                type="info"
                                                message="По отправке есть выплаты. Изменение получателей или цены заблокировано."
                                                style={{ marginBottom: 16 }}
                                            />
                                        )}
                                        <TransferForm
                                            form={transferForm}
                                            initialValues={transfer}
                                            onFinish={onEditTransfer}
                                            error={detailsError}
                                            legacyTransporterName={legacyTransporterName}
                                            legacyReceiverName={legacyReceiverName}
                                            isReceiversEditable={transferMeta.isReceiversEditable}
                                            isPriceEditable={transferMeta.isPriceEditable}
                                            onValuesChange={onValuesChange}
                                            fileList={fileList}
                                            onFileListChange={onFileListChange}
                                            onFileRemove={onFileRemove}
                                            transporters={transportersData?.items ?? []}
                                            receivers={receiversData?.items ?? []}
                                        />
                                        <Flex gap={8} className={styles.tab_actions}>
                                            <Tooltip
                                                title={hasTransferErrors ? 'Исправьте ошибки в форме' : 'Внесите изменение, чтобы сохранить'}
                                                trigger={hasTransferDiff && !hasTransferErrors ? [] : ['hover']}
                                            >
                                                <Button
                                                    disabled={!hasTransferDiff || hasTransferErrors}
                                                    loading={isTransferPending}
                                                    type="primary"
                                                    onClick={() => transferForm.submit()}
                                                >
                                                    Сохранить
                                                </Button>
                                            </Tooltip>
                                            <Button type="default" onClick={() => navigate({ to: '/transfers' })}>Отменить</Button>
                                        </Flex>
                                    </>
                                ),
                            },
                            {
                                key: 'payment',
                                label: 'Данные об оплате',
                                children: isPaymentDetailsLoading || !paymentDetails
                                    ? <Skeleton active paragraph={{ rows: 6 }} />
                                    : isPaymentDetailsError
                                        ? <Card><Empty description="Не удалось загрузить данные об оплате" /></Card>
                                        : (
                                                <>
                                                    <TransferPaymentDetailsForm
                                                        form={paymentForm}
                                                        paymentDetails={paymentDetails}
                                                        error={paymentError}
                                                        canAddPayments={canAddPayments}
                                                        canClearShares={canClearShares}
                                                        draftRowsVersion={paymentDraftRowsVersion}
                                                        onClearShares={() => {
                                                            paymentForm.setFieldValue(
                                                                'shares',
                                                                paymentDetails.shares.map(share => ({
                                                                    receiverId: share.receiverId,
                                                                    amount: null,
                                                                })),
                                                            );
                                                            paymentForm.setFieldValue('newPayments', []);
                                                            setPaymentDraftRowsVersion(prev => prev + 1);
                                                            setPaymentError(null);
                                                        }}
                                                    />
                                                    <Flex gap={8} className={styles.tab_actions}>
                                                        <Tooltip
                                                            title={hasPaymentChanges ? undefined : 'Измените доли или добавьте новые выплаты'}
                                                            trigger={hasPaymentChanges ? [] : ['hover']}
                                                        >
                                                            <Button
                                                                loading={isPaymentPending}
                                                                disabled={!hasPaymentChanges}
                                                                type="primary"
                                                                onClick={onUpdatePaymentDetails}
                                                            >
                                                                Сохранить
                                                            </Button>
                                                        </Tooltip>
                                                        <Button
                                                            type="default"
                                                            disabled={!hasPaymentChanges}
                                                            onClick={() => {
                                                                if (!paymentDetails) {
                                                                    return;
                                                                }

                                                                paymentForm.setFieldsValue({
                                                                    shares: paymentDetails.shares.map(share => ({
                                                                        receiverId: share.receiverId,
                                                                        amount: share.amount,
                                                                    })),
                                                                    newPayments: [],
                                                                });
                                                                setPaymentDraftRowsVersion(prev => prev + 1);
                                                                setPaymentError(null);
                                                            }}
                                                        >
                                                            Сбросить
                                                        </Button>
                                                    </Flex>
                                                </>
                                            ),
                            },
                        ]}
                    />
                </>
            )}
        </Flex>
    );
};
