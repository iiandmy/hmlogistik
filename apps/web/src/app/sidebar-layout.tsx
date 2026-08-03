import type { ItemType, MenuItemType } from 'antd/es/menu/interface';
import type { FC, ReactNode } from 'react';
import { AuditOutlined, PullRequestOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { Layout, Menu, Typography } from 'antd';
import { useState } from 'react';
import styles from './sidebar-layout.module.css';

const { Content, Sider } = Layout;

const MENU_ROUTES = {
    transfers: '/transfers',
    aviaTransfers: '/avia-transfers',
    cargo: '/cargo',
    transporters: '/transporters',
    receivers: '/receivers',
} as const;

type MenuKey = keyof typeof MENU_ROUTES;
type MenuGroupKey = 'shipments' | 'directories';

interface Props {
    children: ReactNode;
}

const menuItems: ItemType<MenuItemType>[] = [
    {
        key: 'shipments',
        label: 'Отправки',
        icon: <PullRequestOutlined />,
        children: [
            { key: 'transfers', label: 'ЖД' },
            { key: 'aviaTransfers', label: 'Авиа' },
        ],
    },
    {
        key: 'directories',
        label: 'Справочники',
        icon: <AuditOutlined />,
        children: [
            { key: 'transporters', label: 'Перевозчики' },
            { key: 'receivers', label: 'Получатели' },
            { key: 'cargo', label: 'Груз' },
        ],
    },
];

const getActiveMenuKey = (pathname: string): MenuKey => {
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
};

const getOpenGroupKey = (key: MenuKey): MenuGroupKey => {
    if (key === 'transfers' || key === 'aviaTransfers') {
        return 'shipments';
    }

    return 'directories';
};

export const SidebarLayout: FC<Props> = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const activeKey = getActiveMenuKey(location.pathname);
    const activeGroupKey = getOpenGroupKey(activeKey);
    const [openKeys, setOpenKeys] = useState<MenuGroupKey[]>([activeGroupKey]);
    const visibleOpenKeys = openKeys.includes(activeGroupKey) ? openKeys : [activeGroupKey];

    return (
        <Layout hasSider className={styles.layout}>
            <Sider breakpoint="lg" collapsedWidth="0" width={240} className={styles.sider}>
                <div className={styles.logo}>
                    <Typography.Title level={3}>
                        HM Logistik
                    </Typography.Title>
                </div>
                <Menu
                    mode="inline"
                    selectedKeys={[activeKey]}
                    openKeys={visibleOpenKeys}
                    onOpenChange={(keys) => {
                        setOpenKeys(keys as MenuGroupKey[]);
                    }}
                    items={menuItems}
                    onClick={({ key }) => {
                        const route = MENU_ROUTES[key as MenuKey];

                        navigate({ to: route });
                    }}
                    className={styles.menu}
                />
            </Sider>
            <Layout>
                <Content className={styles.content}>{children}</Content>
            </Layout>
        </Layout>
    );
};
