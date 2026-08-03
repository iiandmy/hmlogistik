import type { TransferFormValues } from '~utils/types/types';
import type { TransferDto, TransferFileDto } from '../types';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';

dayjs.locale('ru');

export const mapTransferDtoToForm = (dto: TransferDto): { transfer: TransferFormValues; files: TransferFileDto[] } => {
    const { files: transferFiles } = dto;

    return {
        transfer: {
            id: dto.id,
            container: dto.container ?? '',
            price: String(dto.price),
            cargo: dto.cargo,
            transporterId: dto.transporter.id,
            receiverIds: dto.receivers.map(receiver => receiver.id),
            createdAt: dto.createdAt ? dayjs(dto.createdAt) : null,
            shippedAt: dto.shippedAt ? dayjs(dto.shippedAt) : null,
        },
        files: transferFiles,
    };
};

export const mapTransferDtoToDatasource = (dto: TransferDto): TransferDto & {
    key: number;
    container: string | null;
    createdAt: string | null;
    shippedAt: string | null;
} => ({
    ...dto,
    key: dto.id,
    container: dto.container,
    createdAt: dto.createdAt ? dayjs(dto.createdAt).format('DD/MM/YYYY') : null,
    shippedAt: dto.shippedAt ? dayjs(dto.shippedAt).format('DD/MM/YYYY') : null,
});
