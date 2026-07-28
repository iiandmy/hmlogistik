-- CreateTable
CREATE TABLE "transfers" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMPTZ,
    "shipped_at" TIMESTAMPTZ,
    "transporter" TEXT NOT NULL,
    "receiver" TEXT NOT NULL,
    "container" TEXT,
    "price" DECIMAL(12,2) NOT NULL,
    "cargo" TEXT NOT NULL,

    CONSTRAINT "transfers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "transfers_created_at_idx" ON "transfers"("created_at" DESC);

-- CreateIndex
CREATE INDEX "transfers_shipped_at_idx" ON "transfers"("shipped_at" DESC);

-- CreateIndex
CREATE INDEX "transfers_price_idx" ON "transfers"("price");
