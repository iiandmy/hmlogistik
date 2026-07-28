import type { FC, ReactNode } from 'react';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { Flex, Tabs } from 'antd';
import styles from './tabs-layout.module.css';

const TAB_ROUTES = {
    aviaTransfers: '/avia-transfers',
    transfers: '/transfers',
    cargo: '/cargo',
    transporters: '/transporters',
    receivers: '/receivers',
} as const;

type TabKey = keyof typeof TAB_ROUTES;

interface Props {
    children: ReactNode;
}

function getActiveTabKey(pathname: string): TabKey {
    if (pathname.startsWith('/avia-transfers')) {
        return 'aviaTransfers';
    }
    if (pathname.startsWith('/cargo')) {
        return 'cargo';
    }
    if (pathname.startsWith('/transporters')) {
        return 'transporters';
    }
    if (pathname.startsWith('/receivers')) {
        return 'receivers';
    }

    return 'transfers';
}

export const TabsLayout: FC<Props> = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const activeKey = getActiveTabKey(location.pathname);

    return (
        <Flex vertical className={styles.page_container}>
            <Tabs
                activeKey={activeKey}
                onChange={(key) => {
                    const route = TAB_ROUTES[key as TabKey];
                    navigate({ to: route });
                }}
                items={[
                    { key: 'transfers', label: 'Отправки' },
                    { key: 'aviaTransfers', label: 'Отправки авиа' },
                    { key: 'cargo', label: 'Груз' },
                    { key: 'transporters', label: 'Перевозчики' },
                    { key: 'receivers', label: 'Получатели' },
                ]}
            />
            {children}
        </Flex>
    );
};
