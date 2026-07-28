import type { FC } from 'react';
import type { AviaTransfer } from '~modules/avia-transfers/avia-transfer-list/avia.types';
import { Flex, Tag } from 'antd';
import styles from './cargo-data-column.module.css';

interface Props {
    record: AviaTransfer;
}

export const CargoDataColumn: FC<Props> = ({ record }) => {
    return (
        <Flex className={styles.column_wrapper} gap={4} wrap="wrap">
            <Tag color="green">
                {record.cargoData.cargoSpaces}
                {' '}
                грузовых мест
            </Tag>
            <Tag color="green">

                Объем:
                {' '}
                {record.cargoData.volume}
                {' '}
                м³
            </Tag>
            <Tag color="green">
                Вес:
                {' '}
                {record.cargoData.weight}
                {' '}
                кг
            </Tag>
        </Flex>
    );
};
