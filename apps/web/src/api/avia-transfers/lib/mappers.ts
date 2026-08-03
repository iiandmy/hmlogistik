import type { AviaTransferDto, AviaTransferFormValues, CreateAviaTransferPayload } from '../types';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';

dayjs.locale('ru');

export const mapAviaTransferDtoToForm = (dto: AviaTransferDto): AviaTransferFormValues => ({
    id: dto.id,
    departedAt: dto.departedAt ? dayjs(dto.departedAt) : null,
    invoiceNumber: dto.invoiceNumber ?? '',
    cargoData: {
        ...dto.cargoData,
    },
    usdRate: dto.usdRate,
    cnyRate: dto.cnyRate,
    transporterId: dto.transporter.id,
    receiverIds: dto.receivers.map(receiver => receiver.id),
});

export const mapAviaTransferDtoToDatasource = (dto: AviaTransferDto): AviaTransferDto & {
    key: number;
    departedAtFormatted: string | null;
} => ({
    ...dto,
    key: dto.id,
    departedAtFormatted: dto.departedAt ? dayjs(dto.departedAt).format('DD/MM/YYYY') : null,
});

export const mapAviaTransferFormToPayload = (
    values: AviaTransferFormValues,
): CreateAviaTransferPayload => ({
    departedAt: values.departedAt?.toISOString() ?? null,
    invoiceNumber: values.invoiceNumber.trim() || null,
    cargoData: {
        cargoSpaces: Number(values.cargoData.cargoSpaces ?? 0),
        volume: Number(values.cargoData.volume ?? 0),
        weight: Number(values.cargoData.weight ?? 0),
    },
    usdRate: values.usdRate ?? null,
    cnyRate: values.cnyRate ?? null,
    transporterId: Number(values.transporterId ?? 0),
    receiverIds: values.receiverIds,
});
