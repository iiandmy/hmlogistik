import type { ReactNode } from 'react';
import type { TransferPaymentAlertDto } from '~api/transfer-payment-details';
import { Flex } from 'antd';

interface GetPaymentDelayExceptionParams {
    paymentAlert: TransferPaymentAlertDto;
}

interface GetPaymentDelayExceptionReturn {
    shouldShowPaymentDelayException: boolean;
    tooltipContent: ReactNode;
}

export const getPaymentDelayExceptionContent = ({ paymentAlert }: GetPaymentDelayExceptionParams): GetPaymentDelayExceptionReturn => {
    const shouldShowPaymentDelayException = paymentAlert.shouldShow;

    const tooltipContent: ReactNode = paymentAlert.overdueReceivers.length > 0 && (
        <Flex vertical gap={4}>
            {paymentAlert.overdueReceivers
                .map(receiver => (
                    <span key={receiver.receiverId}>
                        Истёк срок выплаты для
                        {' '}
                        {receiver.receiverName}
                    </span>
                ))}
        </Flex>
    );

    return {
        shouldShowPaymentDelayException,
        tooltipContent,
    };
};
