import type { Dayjs } from 'dayjs';
import type { TransferReceiverDto, TransferTransporterDelayDto } from '~api/transfers/types';
import dayjs from 'dayjs';

interface Transporter {
    paymentDelayExceptions: TransferTransporterDelayDto[];
    paymentDelayDays: number | null;
}

export const getPaymentDelayExceptionFlags = (transporter: Transporter, receivers: Pick<TransferReceiverDto, 'id'>[], shippedAt: Dayjs): { [key: string]: boolean } => receivers.reduce((acc, receiver) => {
    const exception = transporter.paymentDelayExceptions.find(exception => exception.receiverId === receiver.id);
    const delay = exception ? exception.paymentDelayDays : transporter.paymentDelayDays;
    if (!delay) {
        return acc;
    }
    return {
        ...acc,
        [receiver.id]: delay < dayjs().diff(shippedAt, 'day'),
    };
}, {});
