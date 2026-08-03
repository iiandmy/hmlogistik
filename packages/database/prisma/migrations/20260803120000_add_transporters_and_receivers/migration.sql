-- CreateEnum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TransporterType') THEN
        CREATE TYPE "TransporterType" AS ENUM ('Rail', 'Avia');
    END IF;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "receivers" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "is_placeholder" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "transporters" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" "TransporterType" NOT NULL,
    "is_placeholder" BOOLEAN NOT NULL DEFAULT false,
    "payment_delay_days" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transporters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "transporter_delay_rules" (
    "id" BIGSERIAL NOT NULL,
    "transporter_id" BIGINT NOT NULL,
    "receiver_id" BIGINT NOT NULL,
    "payment_delay_days" INTEGER NOT NULL,

    CONSTRAINT "transporter_delay_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "transfer_receivers" (
    "transfer_id" BIGINT NOT NULL,
    "receiver_id" BIGINT NOT NULL,

    CONSTRAINT "transfer_receivers_pkey" PRIMARY KEY ("transfer_id","receiver_id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "avia_transfer_receivers" (
    "avia_transfer_id" BIGINT NOT NULL,
    "receiver_id" BIGINT NOT NULL,

    CONSTRAINT "avia_transfer_receivers_pkey" PRIMARY KEY ("avia_transfer_id","receiver_id")
);

-- AlterTable
ALTER TABLE "transfers" ADD COLUMN IF NOT EXISTS "transporter_id" BIGINT;

-- AlterTable
ALTER TABLE "avia_transfers" ADD COLUMN IF NOT EXISTS "transporter_id" BIGINT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "receivers_name_key" ON "receivers"("name");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "transporters_name_type_key" ON "transporters"("name", "type");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "transporter_delay_rules_transporter_id_receiver_id_key" ON "transporter_delay_rules"("transporter_id", "receiver_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "transporter_delay_rules_receiver_id_idx" ON "transporter_delay_rules"("receiver_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "transfer_receivers_receiver_id_idx" ON "transfer_receivers"("receiver_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "avia_transfer_receivers_receiver_id_idx" ON "avia_transfer_receivers"("receiver_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "transfers_transporter_id_idx" ON "transfers"("transporter_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "avia_transfers_transporter_id_idx" ON "avia_transfers"("transporter_id");

-- Ensure timestamps exist for rows created during partial applies.
UPDATE "receivers"
SET "updated_at" = COALESCE("updated_at", "created_at", CURRENT_TIMESTAMP)
WHERE "updated_at" IS NULL;

UPDATE "transporters"
SET "updated_at" = COALESCE("updated_at", "created_at", CURRENT_TIMESTAMP)
WHERE "updated_at" IS NULL;

-- Seed placeholders
INSERT INTO "transporters" ("name", "type", "is_placeholder", "payment_delay_days", "created_at", "updated_at")
VALUES
    ('Placeholder', 'Rail', true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Placeholder', 'Avia', true, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("name", "type") DO NOTHING;

INSERT INTO "receivers" ("name", "is_placeholder", "created_at", "updated_at")
VALUES ('Placeholder', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;

-- Backfill transporter references with placeholders
UPDATE "transfers"
SET "transporter_id" = (
    SELECT "id"
    FROM "transporters"
    WHERE "name" = 'Placeholder' AND "type" = 'Rail'
    LIMIT 1
)
WHERE "transporter_id" IS NULL;

UPDATE "avia_transfers"
SET "transporter_id" = (
    SELECT "id"
    FROM "transporters"
    WHERE "name" = 'Placeholder' AND "type" = 'Avia'
    LIMIT 1
)
WHERE "transporter_id" IS NULL;

-- Backfill receiver links with placeholder only for rows that do not have links yet.
INSERT INTO "transfer_receivers" ("transfer_id", "receiver_id")
SELECT
    "transfers"."id",
    (
        SELECT "id"
        FROM "receivers"
        WHERE "name" = 'Placeholder'
        LIMIT 1
    )
FROM "transfers"
WHERE NOT EXISTS (
    SELECT 1
    FROM "transfer_receivers"
    WHERE "transfer_receivers"."transfer_id" = "transfers"."id"
)
ON CONFLICT ("transfer_id", "receiver_id") DO NOTHING;

INSERT INTO "avia_transfer_receivers" ("avia_transfer_id", "receiver_id")
SELECT
    "avia_transfers"."id",
    (
        SELECT "id"
        FROM "receivers"
        WHERE "name" = 'Placeholder'
        LIMIT 1
    )
FROM "avia_transfers"
WHERE NOT EXISTS (
    SELECT 1
    FROM "avia_transfer_receivers"
    WHERE "avia_transfer_receivers"."avia_transfer_id" = "avia_transfers"."id"
)
ON CONFLICT ("avia_transfer_id", "receiver_id") DO NOTHING;

-- Make transporter links required after backfill
ALTER TABLE "transfers" ALTER COLUMN "transporter_id" SET NOT NULL;
ALTER TABLE "avia_transfers" ALTER COLUMN "transporter_id" SET NOT NULL;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transfers_transporter_id_fkey') THEN
        ALTER TABLE "transfers" ADD CONSTRAINT "transfers_transporter_id_fkey" FOREIGN KEY ("transporter_id") REFERENCES "transporters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'avia_transfers_transporter_id_fkey') THEN
        ALTER TABLE "avia_transfers" ADD CONSTRAINT "avia_transfers_transporter_id_fkey" FOREIGN KEY ("transporter_id") REFERENCES "transporters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transporter_delay_rules_transporter_id_fkey') THEN
        ALTER TABLE "transporter_delay_rules" ADD CONSTRAINT "transporter_delay_rules_transporter_id_fkey" FOREIGN KEY ("transporter_id") REFERENCES "transporters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transporter_delay_rules_receiver_id_fkey') THEN
        ALTER TABLE "transporter_delay_rules" ADD CONSTRAINT "transporter_delay_rules_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "receivers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transfer_receivers_transfer_id_fkey') THEN
        ALTER TABLE "transfer_receivers" ADD CONSTRAINT "transfer_receivers_transfer_id_fkey" FOREIGN KEY ("transfer_id") REFERENCES "transfers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transfer_receivers_receiver_id_fkey') THEN
        ALTER TABLE "transfer_receivers" ADD CONSTRAINT "transfer_receivers_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "receivers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'avia_transfer_receivers_avia_transfer_id_fkey') THEN
        ALTER TABLE "avia_transfer_receivers" ADD CONSTRAINT "avia_transfer_receivers_avia_transfer_id_fkey" FOREIGN KEY ("avia_transfer_id") REFERENCES "avia_transfers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'avia_transfer_receivers_receiver_id_fkey') THEN
        ALTER TABLE "avia_transfer_receivers" ADD CONSTRAINT "avia_transfer_receivers_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "receivers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- AlterTable
ALTER TABLE "receivers" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "transporters" ALTER COLUMN "updated_at" DROP DEFAULT;
