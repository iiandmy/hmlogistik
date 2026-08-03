import type { FC } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button, Flex, Typography } from 'antd';
import styles from './transfer-list-nav-bar.module.css';

export const TransferListNavBar: FC = () => {
    const navigate = useNavigate();

    return (
        <Flex justify="space-between" align="center">
            <Typography.Title style={{ margin: 0 }}>Отправки авиа</Typography.Title>
            <Button
                onClick={() => navigate({ to: '/avia-transfers/create' })}
                type="primary"
                size="large"
                className={styles.create_button}
            >
                Создать
            </Button>
        </Flex>
    );
};
