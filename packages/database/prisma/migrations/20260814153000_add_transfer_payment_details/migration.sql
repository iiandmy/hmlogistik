-- CreateTable
CREATE TABLE IF NOT EXISTS "transfer_payment_details" (
    "id" BIGSERIAL NOT NULL,
    "transfer_id" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "transfer_payment_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "transfer_payment_receiver_shares" (
    "id" BIGSERIAL NOT NULL,
    "payment_details_id" BIGINT NOT NULL,
    "receiver_id" BIGINT NOT NULL,
    "amount" DECIMAL(12,2),

    CONSTRAINT "transfer_payment_receiver_shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "transfer_payments" (
    "id" BIGSERIAL NOT NULL,
    "payment_details_id" BIGINT NOT NULL,
    "receiver_id" BIGINT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "paid_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transfer_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "transfer_payment_details_transfer_id_key" ON "transfer_payment_details"("transfer_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "transfer_payment_receiver_shares_payment_details_id_receiver_id_key" ON "transfer_payment_receiver_shares"("payment_details_id", "receiver_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "transfer_payment_receiver_shares_receiver_id_idx" ON "transfer_payment_receiver_shares"("receiver_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "transfer_payments_payment_details_id_idx" ON "transfer_payments"("payment_details_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "transfer_payments_receiver_id_idx" ON "transfer_payments"("receiver_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "transfer_payments_paid_at_idx" ON "transfer_payments"("paid_at" DESC);

-- Backfill payment details for legacy transfers before enabling application usage.
INSERT INTO "transfer_payment_details" ("transfer_id", "created_at", "updated_at")
SELECT t."id", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "transfers" t
LEFT JOIN "transfer_payment_details" pd ON pd."transfer_id" = t."id"
WHERE pd."id" IS NULL;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transfer_payment_details_transfer_id_fkey') THEN
        ALTER TABLE "transfer_payment_details" ADD CONSTRAINT "transfer_payment_details_transfer_id_fkey" FOREIGN KEY ("transfer_id") REFERENCES "transfers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transfer_payment_receiver_shares_payment_details_id_fkey') THEN
        ALTER TABLE "transfer_payment_receiver_shares" ADD CONSTRAINT "transfer_payment_receiver_shares_payment_details_id_fkey" FOREIGN KEY ("payment_details_id") REFERENCES "transfer_payment_details"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transfer_payment_receiver_shares_receiver_id_fkey') THEN
        ALTER TABLE "transfer_payment_receiver_shares" ADD CONSTRAINT "transfer_payment_receiver_shares_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "receivers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transfer_payments_payment_details_id_fkey') THEN
        ALTER TABLE "transfer_payments" ADD CONSTRAINT "transfer_payments_payment_details_id_fkey" FOREIGN KEY ("payment_details_id") REFERENCES "transfer_payment_details"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transfer_payments_receiver_id_fkey') THEN
        ALTER TABLE "transfer_payments" ADD CONSTRAINT "transfer_payments_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "receivers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;
