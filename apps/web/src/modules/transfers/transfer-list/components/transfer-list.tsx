import type { TableProps } from 'antd';
import type { ChangeEventHandler, FC } from 'react';
import type { TransferDto } from '~api/transfers';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { Alert, Flex, Table } from 'antd';
import { useEffect } from 'react';
import { DEFAULT_TRANSFERS_QUERY, mapTransferDtoToDatasource, useTransfersList } from '~api/transfers';
import { useDelayedSearchQuery } from '~utils/hooks/use-delayed-search-query';
import { useTransferListColumns } from '../hooks/use-transfer-list-columns';
import { TransferListFilters } from './transfer-list-filters';

const MIN_SYMBOLS_TO_FETCH = 3;

export const TransferList: FC = () => {
    const navigate = useNavigate();
    const columns = useTransferListColumns();
    const search = useSearch({ from: '/transfers' });

    const { q, setSearchQuery, delayedSearchQuery } = useDelayedSearchQuery();

    const searchQuery = { ...DEFAULT_TRANSFERS_QUERY, ...search };

    const { data, isLoading, error } = useTransfersList(searchQuery);

    const transfersDatasource = (data?.items ?? []).map(mapTransferDtoToDatasource);

    useEffect(() => {
        if (delayedSearchQuery && delayedSearchQuery.length < MIN_SYMBOLS_TO_FETCH) {
            return;
        }
        if (delayedSearchQuery !== (search.q ?? '')) {
            void navigate({
                to: '/transfers',
                search: () => ({ ...search, q: delayedSearchQuery || undefined, page: 1 }),
                replace: true,
            });
        }
    }, [delayedSearchQuery, search, navigate]);

    const handleTableChange: TableProps<TransferDto>['onChange'] = ({ current, pageSize }, _, sorter) => {
        const hasSorting = 'columnKey' in sorter && sorter.order;
        const sorting = hasSorting
            ? {
                    sortBy: sorter.columnKey as 'createdAt' | 'shippedAt',
                    order: sorter.order === 'ascend' ? 'asc' : 'desc' as 'asc' | 'desc',
                }
            : {};

        void navigate({
            to: '/transfers',
            search: () => ({
                ...search,
                ...sorting,
                page: current ?? 1,
                limit: pageSize ?? DEFAULT_TRANSFERS_QUERY.limit,
            }),
            replace: true,
        });
    };

    const handleSearchChange: ChangeEventHandler<HTMLInputElement> = e => setSearchQuery(e.target.value);

    const requestErrorMessage = error instanceof Error ? error.message : 'Не удалось загрузить отправки';

    return (
        <Flex vertical>
            {error && (
                <Alert
                    title={requestErrorMessage}
                    type="error"
                    showIcon
                    style={{ marginBottom: 12 }}
                />
            )}
            <TransferListFilters onSearchQueryChange={handleSearchChange} searchQuery={q} />
            <Table
                dataSource={transfersDatasource}
                columns={columns}
                loading={isLoading}
                onChange={handleTableChange}
                pagination={{
                    current: data?.pagination.page ?? 1,
                    pageSize: data?.pagination.limit ?? DEFAULT_TRANSFERS_QUERY.limit,
                    total: data?.pagination.total ?? 0,
                }}
            />
        </Flex>
    );
};
