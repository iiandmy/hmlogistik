import type { ReactNode } from 'react';
import type { TransferReceiverDto } from '~api/transfers/types';
import { Flex } from 'antd';

interface GetPaymentDelayExceptionParams {
    paymentExceptionFlags: { [receiverId: string]: boolean };
    receivers: Pick<TransferReceiverDto, 'id' | 'name'>[];
}

interface GetPaymentDelayExceptionReturn {
    shouldShowPaymentDelayException: boolean;
    tooltipContent: ReactNode;
}

export const getPaymentDelayExceptionContent = ({ paymentExceptionFlags, receivers }: GetPaymentDelayExceptionParams): GetPaymentDelayExceptionReturn => {
    const shouldShowPaymentDelayException = Object.values(paymentExceptionFlags).some(Boolean);
    const exceptionsMap = Object.entries(paymentExceptionFlags).filter(([, value]) => value);

    const tooltipContent: ReactNode = exceptionsMap.length > 0 && (
        <Flex vertical gap={4}>
            {exceptionsMap
                .map(([key]) => (
                    <span key={key}>
                        Истёк срок выплаты для
                        {' '}
                        {receivers.find(receiver => receiver.id === Number(key))?.name}
                    </span>
                ))}
        </Flex>
    );

    return {
        shouldShowPaymentDelayException,
        tooltipContent,
    };
};
