import type { FC } from 'react';
import { CloseCircleOutlined } from '@ant-design/icons';
import { Link } from '@tanstack/react-router';
import { Alert, Card, Space, Typography } from 'antd';

interface Props {
    description?: string;
}

export const WorkInProgress: FC<Props> = ({ description }) => (
    <Card title="Work In Progress" extra={<Link to="/transfers">Вернуться на главную</Link>}>
        <Space vertical>
            <span>
                <Alert
                    title="Данная страница находится в разработке. Пожалуйста, вернитесь позже."
                    icon={<CloseCircleOutlined />}
                    showIcon
                    variant="outlined"
                />
            </span>
            {description && <Typography.Text>{description}</Typography.Text>}
        </Space>
    </Card>
);
