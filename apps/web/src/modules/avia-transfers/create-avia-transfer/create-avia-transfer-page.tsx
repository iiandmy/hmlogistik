import type { UploadFile } from 'antd';
import type { FC } from 'react';
import type { AviaTransfer } from '../avia-transfer-list/avia.types';
import { LeftOutlined } from '@ant-design/icons';
import { useNavigate } from '@tanstack/react-router';
import { Button, Flex, Form, Typography } from 'antd';
import { useState } from 'react';
import styles from './create-avia-transfer-page.module.css';

export const CreateAviaTransferPage: FC = () => {
    const navigate = useNavigate();

    const [transferForm] = Form.useForm<AviaTransfer>();
    const [error, setError] = useState<string | null>(null);
    const [fileList, setFileList] = useState<UploadFile[]>([]);

    const onCreateTransfer = (transfer: AviaTransfer): void => {
        setError(null);
    };

    return (
        <Flex vertical className={styles.page_container}>
            <Flex align="center">
                <Button type="default" onClick={() => navigate({ to: '/avia-transfers' })}>
                    <LeftOutlined />
                    <Typography.Text>Назад</Typography.Text>
                </Button>
            </Flex>
            <Typography.Title>
                Создать отправку
            </Typography.Title>
            <Form form={transferForm} onFinish={onCreateTransfer}>

            </Form>
        </Flex>
    );
};
