CREATE TABLE "avia_transfers" (
    "id" BIGSERIAL NOT NULL,
    "departed_at" TIMESTAMPTZ,
    "invoice_number" TEXT,
    "cargo_spaces" INTEGER NOT NULL,
    "volume" DECIMAL(12,3) NOT NULL,
    "weight" DECIMAL(12,3) NOT NULL,
    "usd_rate" DECIMAL(12,2),
    "cny_rate" DECIMAL(12,2),
    "transporter" TEXT NOT NULL,
    "receiver" TEXT NOT NULL,

    CONSTRAINT "avia_transfers_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "avia_transfers_departed_at_idx" ON "avia_transfers"("departed_at" DESC);
CREATE INDEX "avia_transfers_invoice_number_idx" ON "avia_transfers"("invoice_number");
