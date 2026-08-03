import type { TableProps } from 'antd';
import type { ChangeEventHandler, FC } from 'react';
import type { AviaTransferDto } from '~api/avia-transfers';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { Alert, Flex, Table } from 'antd';
import dayjs from 'dayjs';
import { useEffect } from 'react';
import { DEFAULT_AVIA_TRANSFERS_QUERY, useAviaTransfersList } from '~api/avia-transfers';
import { useDelayedSearchQuery } from '~utils/hooks/use-delayed-search-query';
import { useAviaTransferListColumns } from '../hooks/use-avia-transfer-list-columns';
import { TransferListFilters } from './transfer-list-filters';

const MIN_SYMBOLS_TO_FETCH = 3;

export const AviaTransferList: FC = () => {
    const navigate = useNavigate();
    const columns = useAviaTransferListColumns();
    const search = useSearch({ from: '/avia-transfers' });

    const { q, setSearchQuery, delayedSearchQuery } = useDelayedSearchQuery({
        initialValue: search.q ?? '',
    });

    const searchQuery = { ...DEFAULT_AVIA_TRANSFERS_QUERY, ...search };

    const { data, isLoading, error } = useAviaTransfersList(searchQuery);

    useEffect(() => {
        if (delayedSearchQuery && delayedSearchQuery.length < MIN_SYMBOLS_TO_FETCH) {
            return;
        }

        if (delayedSearchQuery !== (search.q ?? '')) {
            void navigate({
                to: '/avia-transfers',
                search: () => ({ ...search, q: delayedSearchQuery || undefined, page: 1 }),
                replace: true,
            });
        }
    }, [delayedSearchQuery, search, navigate]);

    const handleTableChange: TableProps<AviaTransferDto>['onChange'] = ({ current, pageSize }, _, sorter) => {
        const hasSorting = 'columnKey' in sorter && sorter.order;
        const sorting = hasSorting
            ? {
                    sortBy: sorter.columnKey as 'departedAt',
                    order: sorter.order === 'ascend' ? 'asc' : 'desc' as 'asc' | 'desc',
                }
            : {};

        void navigate({
            to: '/avia-transfers',
            search: () => ({
                ...search,
                ...sorting,
                page: current ?? 1,
                limit: pageSize ?? DEFAULT_AVIA_TRANSFERS_QUERY.limit,
            }),
            replace: true,
        });
    };

    const handleSearchChange: ChangeEventHandler<HTMLInputElement> = e => setSearchQuery(e.target.value);

    const requestErrorMessage = error instanceof Error ? error.message : 'Не удалось загрузить авиаперевозки';

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
                rowKey="id"
                dataSource={(data?.items ?? []).map(transfer => ({
                    ...transfer,
                    departedAt: transfer.departedAt ? dayjs(transfer.departedAt).format('DD/MM/YYYY') : null,
                }))}
                columns={columns}
                loading={isLoading}
                onChange={handleTableChange}
                pagination={{
                    current: data?.pagination.page ?? 1,
                    pageSize: data?.pagination.limit ?? DEFAULT_AVIA_TRANSFERS_QUERY.limit,
                    total: data?.pagination.total ?? 0,
                }}
            />
        </Flex>
    );
};
