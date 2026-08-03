import type { FormInstance, FormProps, UploadFile } from 'antd';
import type { FC } from 'react';
import type { ReceiverDto } from '~api/receivers';
import type { TransporterDto } from '~api/transporters';
import type { TransferFormValues } from '~utils/types/types';
import { UploadOutlined } from '@ant-design/icons';
import { Alert, App, Button, Col, DatePicker, Divider, Flex, Form, Input, Row, Select, Space, Upload } from 'antd';
import dayjs from 'dayjs';
import styles from './transfer-form.module.css';

dayjs.locale('ru');

const layout: Pick<FormProps, 'labelCol' | 'wrapperCol' | 'labelWrap' | 'size' | 'layout'> = {
    labelWrap: true,
    size: 'large',
    layout: 'vertical',
};

interface Props {
    form: FormInstance<TransferFormValues>;
    error: string | null;
    initialValues?: TransferFormValues;
    legacyTransporterName?: string | null;
    legacyReceiverName?: string | null;
    onFinish: (values: TransferFormValues) => void;
    onValuesChange?: (changedValues: Partial<TransferFormValues>, allValues: TransferFormValues) => void;
    fileList: UploadFile[];
    onFileListChange: (fileList: UploadFile[]) => void;
    onFileRemove?: (file: UploadFile) => void;
    transporters: TransporterDto[];
    receivers: ReceiverDto[];
}

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
const MAX_FILES_PER_TRANSFER = 10;
const ACCEPTED_MIME_TYPES = new Set([
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

export const TransferForm: FC<Props> = ({
    form,
    initialValues,
    onFinish,
    error,
    legacyTransporterName,
    legacyReceiverName,
    onValuesChange,
    fileList,
    onFileListChange,
    onFileRemove,
    transporters,
    receivers,
}) => {
    const { message } = App.useApp();
    const transporterId = Form.useWatch('transporterId', form);
    const receiverIds = Form.useWatch('receiverIds', form) ?? [];
    const transporterOptions = transporters
        .filter(transporter => !transporter.isPlaceholder || transporter.id === transporterId)
        .map(transporter => ({
            value: transporter.id,
            label: transporter.isPlaceholder
                ? (legacyTransporterName ?? transporter.name)
                : transporter.name,
        }));
    const receiverOptions = receivers
        .filter(receiver => !receiver.isPlaceholder || receiverIds.includes(receiver.id))
        .map(receiver => ({
            value: receiver.id,
            label: receiver.isPlaceholder
                ? (legacyReceiverName ?? receiver.name)
                : receiver.name,
        }));

    const handleBeforeUpload = (file: File): boolean | typeof Upload.LIST_IGNORE => {
        if (fileList.length >= MAX_FILES_PER_TRANSFER) {
            message.error(`Можно прикрепить не более ${MAX_FILES_PER_TRANSFER} файлов`);
            return Upload.LIST_IGNORE;
        }

        if (!ACCEPTED_MIME_TYPES.has(file.type)) {
            message.error('Разрешены только PDF, JPG, PNG, DOCX и XLSX');
            return Upload.LIST_IGNORE;
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
            message.error('Максимальный размер файла — 20MB');
            return Upload.LIST_IGNORE;
        }

        return false;
    };

    const handleUploadChange = (nextFileList: UploadFile[]): void => {
        onFileListChange(nextFileList.slice(0, MAX_FILES_PER_TRANSFER));
    };

    return (
        <Form<TransferFormValues>
            {...layout}
            form={form}
            className={styles.form_layout}
            name="transfer-form"
            initialValues={initialValues}
            onFinish={onFinish}
            onValuesChange={onValuesChange}
        >
            <Row gutter={{ lg: 24 }}>
                <Col span={12}>
                    {error && <Alert title={error} type="error" showIcon />}
                    <Flex gap={12}>
                        <Form.Item
                            rules={[
                                { required: true, message: 'Выберите перевозчика' },
                            ]}
                            name="transporterId"
                            label="Перевозчик"
                            className={styles.full_width}
                        >
                            <Select options={transporterOptions} />
                        </Form.Item>
                        <Form.Item
                            rules={[
                                { required: true, message: 'Выберите получателей' },
                            ]}
                            name="receiverIds"
                            label="Получатель"
                            className={styles.full_width}
                        >
                            <Select mode="multiple" options={receiverOptions} />
                        </Form.Item>
                    </Flex>
                    <Form.Item
                        rules={[
                            { required: true, message: 'Введите название груза' },
                        ]}
                        name="cargo"
                        label="Груз"
                        className={styles.full_width}
                    >
                        <Input />
                    </Form.Item>
                    <Flex gap={12} style={{ flex: 1 }}>
                        <Form.Item
                            name="container"
                            label="Контейнер"
                            className={styles.full_width}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            required
                            label="Цена"
                            className={styles.full_width}
                        >
                            <Space.Compact block>
                                <Input
                                    value="$"
                                    readOnly
                                    style={{ width: 36 }}
                                />
                                <Form.Item
                                    rules={[
                                        { required: true, message: 'Введите цену' },
                                    ]}
                                    name="price"
                                    noStyle
                                >
                                    <Input min={0} type="number" />
                                </Form.Item>
                            </Space.Compact>
                        </Form.Item>
                    </Flex>
                    <Flex gap={12}>
                        <Form.Item
                            name="createdAt"
                            label="Выход"
                            className={styles.full_width}
                        >
                            <DatePicker className={styles.full_width} format="DD.MM.YYYY" />
                        </Form.Item>
                        <Form.Item
                            name="shippedAt"
                            label="Доставлено"
                            className={styles.full_width}
                        >
                            <DatePicker className={styles.full_width} format="DD.MM.YYYY" />
                        </Form.Item>
                    </Flex>
                </Col>
                <Col span={1} className={styles.full_height}>
                    <Divider vertical className={styles.full_height} />
                </Col>
                <Col span={10}>
                    <Form.Item
                        label="Файлы"
                        extra="До 10 файлов размером до 20МБ, .pdf, .docx, .xlsx"
                    >
                        <Upload
                            multiple
                            accept=".pdf,.jpg,.jpeg,.png,.docx,.xlsx"
                            listType="picture"
                            fileList={fileList}
                            beforeUpload={handleBeforeUpload}
                            onChange={info => handleUploadChange(info.fileList)}
                            onRemove={(file) => {
                                onFileRemove?.(file);
                                return true;
                            }}
                            showUploadList={{ showDownloadIcon: true }}
                        >
                            <Button size="middle" icon={<UploadOutlined />}>Прикрепить файлы</Button>
                        </Upload>
                    </Form.Item>
                </Col>
            </Row>
        </Form>
    );
};
