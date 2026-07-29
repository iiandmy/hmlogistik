import type { Transfer } from '~utils/types/types';
import type { TransferDto, TransferFileDto } from '../types';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';

dayjs.locale('ru');

export const mapTransferDtoToForm = (dto: TransferDto): { transfer: Transfer; files: TransferFileDto[] } => {
    const { files: transferFiles, ...transferData } = dto;

    return {
        transfer: {
            ...transferData,
            container: transferData.container ?? '',
            price: String(transferData.price),
            createdAt: transferData.createdAt ? dayjs(transferData.createdAt) : null,
            shippedAt: transferData.shippedAt ? dayjs(transferData.shippedAt) : null,
        },
        files: transferFiles,
    };
};

export const mapTransferDtoToDatasource = (dto: TransferDto): {
    key: number;
    container: string | null;
    createdAt: string | null;
    shippedAt: string | null;
} & TransferDto => ({
    ...dto,
    key: dto.id,
    container: dto.container,
    createdAt: dto.createdAt ? dayjs(dto.createdAt).format('DD/MM/YYYY') : null,
    shippedAt: dto.shippedAt ? dayjs(dto.shippedAt).format('DD/MM/YYYY') : null,
});
