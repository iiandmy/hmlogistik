import type { FC } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button, Flex, Typography } from 'antd';
import styles from './transfer-list-nav-bar.module.css';

export const TransferListNavBar: FC = () => {
    const navigate = useNavigate();

    return (
        <Flex justify="space-between" align="center">
            <Typography.Title>Отправки</Typography.Title>
            <Button
                onClick={() => navigate({ to: '/transfers/create' })}
                type="primary"
                size="large"
                className={styles.create_button}
            >
                Создать
            </Button>
        </Flex>
    );
};
