import type { FormInstance, FormProps } from 'antd';
import type { FC } from 'react';
import type { AviaTransferFormValues } from '~api/avia-transfers';
import type { ReceiverDto } from '~api/receivers';
import type { TransporterDto } from '~api/transporters';
import { Alert, Col, DatePicker, Flex, Form, Input, InputNumber, Row, Select } from 'antd';
import dayjs from 'dayjs';
import styles from './avia-transfer-form.module.css';

dayjs.locale('ru');

const layout: Pick<FormProps, 'labelCol' | 'wrapperCol' | 'labelWrap' | 'size' | 'layout'> = {
    labelWrap: true,
    size: 'large',
    layout: 'vertical',
};

interface Props {
    form: FormInstance<AviaTransferFormValues>;
    error: string | null;
    initialValues?: AviaTransferFormValues;
    legacyTransporterName?: string | null;
    legacyReceiverName?: string | null;
    onFinish: (values: AviaTransferFormValues) => void;
    onValuesChange?: FormProps<AviaTransferFormValues>['onValuesChange'];
    transporters: TransporterDto[];
    receivers: ReceiverDto[];
}

export const AviaTransferForm: FC<Props> = ({
    form,
    error,
    initialValues,
    onFinish,
    legacyTransporterName,
    legacyReceiverName,
    onValuesChange,
    transporters,
    receivers,
}) => {
    const transporterId = Form.useWatch('transporterId', form);
    const receiverIds = Form.useWatch('receiverIds', form) ?? [];
    const transporterOptions = transporters
        .filter(transporter => !transporter.isPlaceholder || transporter.id === transporterId)
        .map(transporter => ({
            value: transporter.id,
            label: transporter.isPlaceholder
                ? `${legacyTransporterName ?? ''} (Placeholder)`
                : transporter.name,
        }));
    const receiverOptions = receivers
        .filter(receiver => !receiver.isPlaceholder || receiverIds.includes(receiver.id))
        .map(receiver => ({
            value: receiver.id,
            label: receiver.isPlaceholder
                ? `${legacyReceiverName ?? ''} (Placeholder)`
                : receiver.name,
        }));

    return (
        <Form<AviaTransferFormValues>
            {...layout}
            form={form}
            className={styles.form_layout}
            name="avia-transfer-form"
            initialValues={initialValues}
            onFinish={onFinish}
            onValuesChange={onValuesChange}
        >
            <Row gutter={{ xs: 0, lg: 24 }}>
                <Col xs={24} lg={12}>
                    {error && <Alert title={error} type="error" showIcon style={{ marginBottom: 16 }} />}
                    <Flex gap={12} vertical={false} wrap>
                        <Form.Item
                            rules={[{ required: true, message: 'Выберите перевозчика' }]}
                            name="transporterId"
                            label="Перевозчик"
                            className={styles.full_width}
                        >
                            <Select options={transporterOptions} />
                        </Form.Item>
                        <Form.Item
                            rules={[{ required: true, message: 'Выберите получателей' }]}
                            name="receiverIds"
                            label="Получатель"
                            className={styles.full_width}
                        >
                            <Select mode="multiple" options={receiverOptions} />
                        </Form.Item>
                    </Flex>
                    <Flex gap={12} vertical={false} wrap>
                        <Form.Item
                            rules={[{ required: true, message: 'Введите номер накладной' }]}
                            name="invoiceNumber"
                            label="Номер накладной"
                            className={styles.full_width}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            name="departedAt"
                            label="Вылет"
                            className={styles.full_width}
                        >
                            <DatePicker className={styles.full_width} format="DD.MM.YYYY" />
                        </Form.Item>
                    </Flex>
                </Col>
                <Col xs={24} lg={12}>
                    <Row gutter={12}>
                        <Col xs={24} sm={8}>
                            <Form.Item
                                rules={[{ required: true, message: 'Введите кол-во мест' }]}
                                name={['cargoData', 'cargoSpaces']}
                                label="Грузовых мест"
                                className={styles.full_width}
                            >
                                <InputNumber min={0} className={styles.full_width} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Form.Item
                                rules={[{ required: true, message: 'Введите объем' }]}
                                name={['cargoData', 'volume']}
                                label="Объем, м3"
                                className={styles.full_width}
                            >
                                <InputNumber min={0} className={styles.full_width} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Form.Item
                                rules={[{ required: true, message: 'Введите вес' }]}
                                name={['cargoData', 'weight']}
                                label="Вес, кг"
                                className={styles.full_width}
                            >
                                <InputNumber min={0} className={styles.full_width} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={12}>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="usdRate"
                                label="Ставка, $"
                                className={styles.full_width}
                            >
                                <InputNumber min={0} className={styles.full_width} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="cnyRate"
                                label="Ставка, ¥"
                                className={styles.full_width}
                            >
                                <InputNumber min={0} className={styles.full_width} />
                            </Form.Item>
                        </Col>
                    </Row>
                </Col>
            </Row>
        </Form>
    );
};
