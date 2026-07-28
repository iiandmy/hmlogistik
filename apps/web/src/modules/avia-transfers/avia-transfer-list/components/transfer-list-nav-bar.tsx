import type { FC } from 'react';
import { Button, Flex, Typography } from 'antd';
import styles from './transfer-list-nav-bar.module.css';

export const TransferListNavBar: FC = () => {
    return (
        <Flex justify="space-between" align="center">
            <Typography.Title>Отправки Авиа</Typography.Title>
            <Button
                type="primary"
                size="large"
                className={styles.create_button}
            >
                Создать
            </Button>
        </Flex>
    );
};
