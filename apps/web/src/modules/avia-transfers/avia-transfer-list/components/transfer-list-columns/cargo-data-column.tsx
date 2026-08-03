import type { FC } from 'react';
import type { AviaTransferDto } from '~api/avia-transfers';
import { Flex, Tag } from 'antd';
import styles from './cargo-data-column.module.css';

interface Props {
    record: AviaTransferDto;
}

export const CargoDataColumn: FC<Props> = ({ record }) => (
    <Flex className={styles.column_wrapper} gap={4} wrap="wrap">
        <Tag color="green">
            {record.cargoData.cargoSpaces}
            {' '}
            грузовых мест
        </Tag>
        <Tag color="green">
            {record.cargoData.volume}
            {' '}
            м³
        </Tag>
        <Tag color="green">
            {record.cargoData.weight}
            {' '}
            кг
        </Tag>
    </Flex>
);
