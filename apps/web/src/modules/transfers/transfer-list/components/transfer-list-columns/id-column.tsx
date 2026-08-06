import type { FC } from 'react';
import type { TransferDatasource } from '~api/transfers/types';
import { green, yellow } from '@ant-design/colors';
import { CheckCircleTwoTone, WarningTwoTone } from '@ant-design/icons';
import { Link } from '@tanstack/react-router';
import { Tooltip, Typography } from 'antd';
import { formatId } from '~utils/lib/format-id';
import { getPaymentDelayExceptionContent } from '~utils/lib/get-payment-delay-exception-content';
import styles from './id-column.module.css';

interface Props {
    record: TransferDatasource;
}

export const IdColumn: FC<Props> = ({ record }) => {
    const { shouldShowPaymentDelayException, tooltipContent } = getPaymentDelayExceptionContent({
        paymentExceptionFlags: record.exceptionFlags,
        receivers: record.receivers,
    });

    return (
        <Link to="/transfers/$id" params={{ id: String(record.id) }} className={styles.container}>
            {record.shouldShowShippedAlert && !shouldShowPaymentDelayException && (
                <Tooltip title="Отправка доставлена">
                    <CheckCircleTwoTone twoToneColor={green[5]} />
                    {' '}
                </Tooltip>
            )}
            {shouldShowPaymentDelayException && (
                <Tooltip title={tooltipContent}>
                    <WarningTwoTone twoToneColor={yellow[6]} />
                    {' '}
                </Tooltip>
            )}
            <Typography.Link strong={!!record.shouldShowShippedAlert}>
                {formatId(record.id)}
            </Typography.Link>
        </Link>
    );
};
