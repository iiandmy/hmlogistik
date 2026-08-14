import type { Prisma } from '@hmlogistik/database';
import type { UpdateTransferPaymentDetailsDto } from './dto/update-transfer-payment-details.dto';
import type {
    TransferPaymentAlertResponse,
    TransferPaymentDetailsResponse,
    TransferPaymentShareResponse,
} from './interfaces/transfer-payment-details-response.interface';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../providers/prisma/prisma.service';

type TransferWithPaymentDetails = Prisma.TransferGetPayload<{
    include: {
        transporterRecord: {
            include: {
                delayRules: {
                    include: {
                        receiver: true;
                    };
                    orderBy: {
                        receiver: {
                            name: 'asc';
                        };
                    };
                };
            };
        };
        receiverLinks: {
            include: {
                receiver: true;
            };
            orderBy: {
                receiver: {
                    name: 'asc';
                };
            };
        };
        paymentDetails: {
            include: {
                shares: {
                    include: {
                        receiver: true;
                    };
                    orderBy: {
                        receiver: {
                            name: 'asc';
                        };
                    };
                };
                payments: {
                    include: {
                        receiver: true;
                    };
                    orderBy: [
                        {
                            paidAt: 'desc';
                        },
                        {
                            id: 'desc';
                        },
                    ];
                };
            };
        };
    };
}>;

export type { TransferWithPaymentDetails };

export interface TransferEditability {
    isReceiversEditable: boolean;
    isPriceEditable: boolean;
}

@Injectable()
export class TransferPaymentDetailsService {
    constructor(private readonly prisma: PrismaService) {}

    private toAmount(value: Prisma.Decimal | number | null | undefined): number | null {
        if (value === null || value === undefined) {
            return null;
        }

        return Number(value);
    }

    private normalizeAmountMap(
        transfer: TransferWithPaymentDetails,
        sharesSource: Map<number, number | null>,
    ): Map<number, number | null> {
        const amountMap = new Map<number, number | null>();
        const receiverIds = transfer.receiverLinks.map(link => Number(link.receiver.id));

        if (receiverIds.length === 1) {
            amountMap.set(receiverIds[0], Number(transfer.price));
            return amountMap;
        }

        for (const receiverId of receiverIds) {
            amountMap.set(receiverId, sharesSource.get(receiverId) ?? null);
        }

        return amountMap;
    }

    private getPersistedSharesMap(transfer: TransferWithPaymentDetails): Map<number, number | null> {
        return new Map(
            (transfer.paymentDetails?.shares ?? []).map(share => [
                Number(share.receiverId),
                this.toAmount(share.amount),
            ]),
        );
    }

    private getPaidAmountMap(transfer: TransferWithPaymentDetails): Map<number, number> {
        const paidAmountMap = new Map<number, number>();

        for (const payment of transfer.paymentDetails?.payments ?? []) {
            const receiverId = Number(payment.receiverId);
            paidAmountMap.set(
                receiverId,
                (paidAmountMap.get(receiverId) ?? 0) + Number(payment.amount),
            );
        }

        return paidAmountMap;
    }

    private hasAssignedShares(transfer: TransferWithPaymentDetails): boolean {
        return (transfer.paymentDetails?.shares ?? []).some(share => share.amount !== null);
    }

    private hasSavedPayments(transfer: TransferWithPaymentDetails): boolean {
        return (transfer.paymentDetails?.payments.length ?? 0) > 0;
    }

    getEditability(transfer: TransferWithPaymentDetails): TransferEditability {
        const isLocked = this.hasAssignedShares(transfer) || this.hasSavedPayments(transfer);
        return {
            isReceiversEditable: !isLocked,
            isPriceEditable: !isLocked,
        };
    }

    buildPaymentAlert(
        transfer: TransferWithPaymentDetails,
        shares: TransferPaymentShareResponse[],
    ): TransferPaymentAlertResponse {
        if (!transfer.actDate) {
            return {
                shouldShow: false,
                overdueReceivers: [],
            };
        }

        const overdueReceivers = shares.filter((share) => {
            if ((share.remainingAmount ?? 0) <= 0) {
                return false;
            }

            if (share.amount === null) {
                return false;
            }

            const exception = transfer.transporterRecord.delayRules.find(
                rule => Number(rule.receiver.id) === share.receiverId,
            );
            const delay = exception?.paymentDelayDays ?? transfer.transporterRecord.paymentDelayDays ?? 0;
            const paymentDeadline = new Date(transfer.actDate!);
            paymentDeadline.setUTCDate(paymentDeadline.getUTCDate() + delay);
            return paymentDeadline.getTime() < Date.now();
        }).map(share => ({
            receiverId: share.receiverId,
            receiverName: share.receiverName,
        }));

        return {
            shouldShow: overdueReceivers.length > 0,
            overdueReceivers,
        };
    }

    mapTransferToPaymentDetailsResponse(
        transfer: TransferWithPaymentDetails,
    ): TransferPaymentDetailsResponse {
        const sharesMap = this.normalizeAmountMap(transfer, this.getPersistedSharesMap(transfer));
        const paidAmountMap = this.getPaidAmountMap(transfer);

        const shares = transfer.receiverLinks.map((link): TransferPaymentShareResponse => {
            const receiverId = Number(link.receiver.id);
            const amount = sharesMap.get(receiverId) ?? null;
            const paidAmount = paidAmountMap.get(receiverId) ?? 0;
            const remainingAmount = amount === null ? null : Number((amount - paidAmount).toFixed(2));

            return {
                receiverId,
                receiverName: link.receiver.name,
                amount,
                paidAmount: Number(paidAmount.toFixed(2)),
                remainingAmount,
                isFullyPaid: remainingAmount !== null && remainingAmount <= 0,
            };
        });

        const totalDebt = Number(transfer.price);
        const totalPaid = Number(
            (transfer.paymentDetails?.payments ?? [])
                .reduce((sum, payment) => sum + Number(payment.amount), 0)
                .toFixed(2),
        );
        const totalRemaining = Number((totalDebt - totalPaid).toFixed(2));

        return {
            transferId: Number(transfer.id),
            transporter: {
                id: Number(transfer.transporterRecord.id),
                name: transfer.transporterRecord.name,
            },
            totalDebt,
            totalPaid,
            totalRemaining,
            sharesLocked: this.hasSavedPayments(transfer),
            sharesAssigned: this.hasAssignedShares(transfer) || transfer.receiverLinks.length === 1,
            shares,
            payments: (transfer.paymentDetails?.payments ?? []).map(payment => ({
                id: Number(payment.id),
                receiverId: Number(payment.receiverId),
                receiverName: payment.receiver.name,
                amount: Number(payment.amount),
                paidAt: payment.paidAt.toISOString(),
                createdAt: payment.createdAt.toISOString(),
            })),
            paymentAlert: this.buildPaymentAlert(transfer, shares),
        };
    }

    private async getTransferWithPaymentDetails(
        transferId: number,
        prisma: Prisma.TransactionClient | PrismaService = this.prisma,
    ): Promise<TransferWithPaymentDetails> {
        const transfer = await prisma.transfer.findUnique({
            where: { id: transferId },
            include: {
                transporterRecord: {
                    include: {
                        delayRules: {
                            include: { receiver: true },
                            orderBy: { receiver: { name: 'asc' } },
                        },
                    },
                },
                receiverLinks: {
                    include: { receiver: true },
                    orderBy: { receiver: { name: 'asc' } },
                },
                paymentDetails: {
                    include: {
                        shares: {
                            include: { receiver: true },
                            orderBy: { receiver: { name: 'asc' } },
                        },
                        payments: {
                            include: { receiver: true },
                            orderBy: [{ paidAt: 'desc' }, { id: 'desc' }],
                        },
                    },
                },
            },
        });

        if (!transfer) {
            throw new NotFoundException('Transfer not found');
        }

        if (!transfer.paymentDetails) {
            await prisma.transferPaymentDetails.create({
                data: { transferId },
            });

            return this.getTransferWithPaymentDetails(transferId, prisma);
        }

        return transfer;
    }

    private validateShares(
        transfer: TransferWithPaymentDetails,
        shares: UpdateTransferPaymentDetailsDto['shares'],
    ): Map<number, number | null> {
        const receiverIds = transfer.receiverLinks.map(link => Number(link.receiver.id));
        const receiverIdSet = new Set(receiverIds);

        if (receiverIds.length === 1) {
            if ((shares?.length ?? 0) > 0) {
                throw new BadRequestException('Shares cannot be edited for transfer with one receiver');
            }

            return new Map([[receiverIds[0], Number(transfer.price)]]);
        }

        if (!shares) {
            return this.normalizeAmountMap(transfer, this.getPersistedSharesMap(transfer));
        }

        if (this.hasSavedPayments(transfer)) {
            throw new BadRequestException('Shares cannot be changed after payments were added');
        }

        if (shares.length !== receiverIds.length) {
            throw new BadRequestException('Shares must be provided for all transfer receivers');
        }

        for (const share of shares) {
            if (!receiverIdSet.has(share.receiverId)) {
                throw new BadRequestException('Share receiver must belong to transfer');
            }
        }

        const hasAmount = shares.some(share => share.amount !== null && share.amount !== undefined);
        const hasEmpty = shares.some(share => share.amount === null || share.amount === undefined);

        if (hasAmount && hasEmpty) {
            throw new BadRequestException('Shares must be either fully filled or fully empty');
        }

        if (!hasAmount) {
            return new Map(receiverIds.map(receiverId => [receiverId, null]));
        }

        const totalShares = Number(
            shares
                .reduce((sum, share) => sum + Number(share.amount ?? 0), 0)
                .toFixed(2),
        );

        if (totalShares !== Number(transfer.price)) {
            throw new BadRequestException('Shares sum must equal transfer price');
        }

        return new Map(shares.map(share => [share.receiverId, Number(share.amount)]));
    }

    private validatePayments(
        transfer: TransferWithPaymentDetails,
        sharesMap: Map<number, number | null>,
        newPayments: UpdateTransferPaymentDetailsDto['newPayments'],
    ): void {
        if (!newPayments || newPayments.length === 0) {
            return;
        }

        const receiverIds = new Set(transfer.receiverLinks.map(link => Number(link.receiver.id)));
        const currentPaidMap = this.getPaidAmountMap(transfer);
        const nextPaidMap = new Map(currentPaidMap);

        if (transfer.receiverLinks.length > 1) {
            const areSharesAssigned = [...sharesMap.values()].every(amount => amount !== null);
            if (!areSharesAssigned) {
                throw new BadRequestException('Shares must be fully assigned before adding payments');
            }
        }

        for (const payment of newPayments) {
            if (!receiverIds.has(payment.receiverId)) {
                throw new BadRequestException('Payment receiver must belong to transfer');
            }

            const shareAmount = sharesMap.get(payment.receiverId) ?? null;
            if (shareAmount === null) {
                throw new BadRequestException('Cannot add payment for receiver without assigned share');
            }

            const nextPaidAmount = Number(
                ((nextPaidMap.get(payment.receiverId) ?? 0) + payment.amount).toFixed(2),
            );

            if (nextPaidAmount > shareAmount) {
                throw new BadRequestException('Payments cannot exceed receiver share');
            }

            nextPaidMap.set(payment.receiverId, nextPaidAmount);
        }

        const totalPaid = Number(
            [...nextPaidMap.values()].reduce((sum, amount) => sum + amount, 0).toFixed(2),
        );

        if (totalPaid > Number(transfer.price)) {
            throw new BadRequestException('Payments cannot exceed transfer price');
        }
    }

    async ensurePaymentDetailsExists(
        transferId: number,
        prisma: Prisma.TransactionClient | PrismaService = this.prisma,
    ): Promise<void> {
        await prisma.transferPaymentDetails.upsert({
            where: { transferId },
            update: {},
            create: { transferId },
        });
    }

    async getEditabilityByTransferId(transferId: number): Promise<TransferEditability> {
        const transfer = await this.getTransferWithPaymentDetails(transferId);
        return this.getEditability(transfer);
    }

    async getPaymentAlertByTransferId(transferId: number): Promise<TransferPaymentAlertResponse> {
        const transfer = await this.getTransferWithPaymentDetails(transferId);
        return this.mapTransferToPaymentDetailsResponse(transfer).paymentAlert;
    }

    async getByTransferId(transferId: number): Promise<TransferPaymentDetailsResponse> {
        const transfer = await this.getTransferWithPaymentDetails(transferId);
        return this.mapTransferToPaymentDetailsResponse(transfer);
    }

    async updateByTransferId(
        transferId: number,
        dto: UpdateTransferPaymentDetailsDto,
    ): Promise<TransferPaymentDetailsResponse> {
        return this.prisma.$transaction(async (prisma) => {
            const transfer = await this.getTransferWithPaymentDetails(transferId, prisma);
            const sharesMap = this.validateShares(transfer, dto.shares);
            this.validatePayments(transfer, sharesMap, dto.newPayments);

            const paymentDetailsId = transfer.paymentDetails!.id;

            if (dto.shares !== undefined && transfer.receiverLinks.length > 1) {
                await prisma.transferPaymentReceiverShare.deleteMany({
                    where: { paymentDetailsId },
                });

                const assignedShares = [...sharesMap.entries()]
                    .filter(([, amount]) => amount !== null)
                    .map(([receiverId, amount]) => ({
                        paymentDetailsId,
                        receiverId,
                        amount: amount!,
                    }));

                if (assignedShares.length > 0) {
                    await prisma.transferPaymentReceiverShare.createMany({
                        data: assignedShares,
                    });
                }
            }

            if ((dto.newPayments?.length ?? 0) > 0) {
                await prisma.transferPayment.createMany({
                    data: dto.newPayments!.map(payment => ({
                        paymentDetailsId,
                        receiverId: payment.receiverId,
                        amount: payment.amount,
                        paidAt: new Date(payment.paidAt),
                    })),
                });
            }

            const refreshed = await this.getTransferWithPaymentDetails(transferId, prisma);
            return this.mapTransferToPaymentDetailsResponse(refreshed);
        });
    }
}
