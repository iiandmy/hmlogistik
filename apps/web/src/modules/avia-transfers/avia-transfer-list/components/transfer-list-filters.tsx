import type { ChangeEventHandler, FC } from 'react';
import { Input, Space } from 'antd';
import styles from './transfer-list-filters.module.css';

interface Props {
    onSearchQueryChange: ChangeEventHandler<HTMLInputElement>;
    searchQuery?: string;
}

export const TransferListFilters: FC<Props> = ({
    onSearchQueryChange,
    searchQuery,
}) => (
    <Space className={styles.filters_container}>
        <Input
            placeholder="Поиск по перевозчику, получателю или № накладной"
            allowClear
            value={searchQuery}
            onChange={onSearchQueryChange}
            className={styles.search_input}
        />
    </Space>
);
