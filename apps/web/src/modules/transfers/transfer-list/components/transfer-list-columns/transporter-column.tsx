import type { FC } from 'react';
import type { TransferDto } from '~api/transfers';
import { InfoCircleOutlined } from '@ant-design/icons';
import { Flex, Tag, Tooltip } from 'antd';

interface Props {
    record: TransferDto;
}

export const TransporterColumn: FC<Props> = ({ record }) => (
    <Flex align="center" gap={4}>
        <Tag>
            {record.transporter}
        </Tag>
        <Tooltip title="Условия перевозки: $5000 наличными">
            <InfoCircleOutlined />
        </Tooltip>
    </Flex>
);
