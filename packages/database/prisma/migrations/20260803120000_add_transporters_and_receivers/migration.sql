-- CreateEnum
CREATE TYPE "TransporterType" AS ENUM ('Rail', 'Avia');

-- CreateTable
CREATE TABLE "receivers" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "is_placeholder" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transporters" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" "TransporterType" NOT NULL,
    "is_placeholder" BOOLEAN NOT NULL DEFAULT false,
    "payment_delay_days" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transporters_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "receivers" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "transporters" ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateTable
CREATE TABLE "transporter_delay_rules" (
    "id" BIGSERIAL NOT NULL,
    "transporter_id" BIGINT NOT NULL,
    "receiver_id" BIGINT NOT NULL,
    "payment_delay_days" INTEGER NOT NULL,

    CONSTRAINT "transporter_delay_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfer_receivers" (
    "transfer_id" BIGINT NOT NULL,
    "receiver_id" BIGINT NOT NULL,

    CONSTRAINT "transfer_receivers_pkey" PRIMARY KEY ("transfer_id","receiver_id")
);

-- CreateTable
CREATE TABLE "avia_transfer_receivers" (
    "avia_transfer_id" BIGINT NOT NULL,
    "receiver_id" BIGINT NOT NULL,

    CONSTRAINT "avia_transfer_receivers_pkey" PRIMARY KEY ("avia_transfer_id","receiver_id")
);

-- AlterTable
ALTER TABLE "transfers" ADD COLUMN "transporter_id" BIGINT;

-- AlterTable
ALTER TABLE "avia_transfers" ADD COLUMN "transporter_id" BIGINT;

-- CreateIndex
CREATE UNIQUE INDEX "receivers_name_key" ON "receivers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "transporters_name_type_key" ON "transporters"("name", "type");

-- CreateIndex
CREATE UNIQUE INDEX "transporter_delay_rules_transporter_id_receiver_id_key" ON "transporter_delay_rules"("transporter_id", "receiver_id");

-- CreateIndex
CREATE INDEX "transporter_delay_rules_receiver_id_idx" ON "transporter_delay_rules"("receiver_id");

-- CreateIndex
CREATE INDEX "transfer_receivers_receiver_id_idx" ON "transfer_receivers"("receiver_id");

-- CreateIndex
CREATE INDEX "avia_transfer_receivers_receiver_id_idx" ON "avia_transfer_receivers"("receiver_id");

-- CreateIndex
CREATE INDEX "transfers_transporter_id_idx" ON "transfers"("transporter_id");

-- CreateIndex
CREATE INDEX "avia_transfers_transporter_id_idx" ON "avia_transfers"("transporter_id");

-- Seed placeholders
INSERT INTO "transporters" ("name", "type", "is_placeholder", "payment_delay_days")
VALUES
    ('Placeholder', 'Rail', true, 0),
    ('Placeholder', 'Avia', true, NULL);

INSERT INTO "receivers" ("name", "is_placeholder")
VALUES ('Placeholder', true);

-- Backfill transporter references with placeholders
UPDATE "transfers"
SET "transporter_id" = (
    SELECT "id"
    FROM "transporters"
    WHERE "name" = 'Placeholder' AND "type" = 'Rail'
    LIMIT 1
);

UPDATE "avia_transfers"
SET "transporter_id" = (
    SELECT "id"
    FROM "transporters"
    WHERE "name" = 'Placeholder' AND "type" = 'Avia'
    LIMIT 1
);

-- Backfill receiver links with placeholder
INSERT INTO "transfer_receivers" ("transfer_id", "receiver_id")
SELECT
    "id",
    (
        SELECT "id"
        FROM "receivers"
        WHERE "name" = 'Placeholder'
        LIMIT 1
    )
FROM "transfers";

INSERT INTO "avia_transfer_receivers" ("avia_transfer_id", "receiver_id")
SELECT
    "id",
    (
        SELECT "id"
        FROM "receivers"
        WHERE "name" = 'Placeholder'
        LIMIT 1
    )
FROM "avia_transfers";

-- Make transporter links required after backfill
ALTER TABLE "transfers" ALTER COLUMN "transporter_id" SET NOT NULL;
ALTER TABLE "avia_transfers" ALTER COLUMN "transporter_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_transporter_id_fkey" FOREIGN KEY ("transporter_id") REFERENCES "transporters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avia_transfers" ADD CONSTRAINT "avia_transfers_transporter_id_fkey" FOREIGN KEY ("transporter_id") REFERENCES "transporters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transporter_delay_rules" ADD CONSTRAINT "transporter_delay_rules_transporter_id_fkey" FOREIGN KEY ("transporter_id") REFERENCES "transporters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transporter_delay_rules" ADD CONSTRAINT "transporter_delay_rules_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "receivers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_receivers" ADD CONSTRAINT "transfer_receivers_transfer_id_fkey" FOREIGN KEY ("transfer_id") REFERENCES "transfers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_receivers" ADD CONSTRAINT "transfer_receivers_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "receivers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avia_transfer_receivers" ADD CONSTRAINT "avia_transfer_receivers_avia_transfer_id_fkey" FOREIGN KEY ("avia_transfer_id") REFERENCES "avia_transfers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avia_transfer_receivers" ADD CONSTRAINT "avia_transfer_receivers_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "receivers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
