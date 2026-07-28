-- CreateTable
CREATE TABLE "transfer_files" (
    "id" BIGSERIAL NOT NULL,
    "transfer_id" BIGINT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transfer_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "transfer_files_transfer_id_idx" ON "transfer_files"("transfer_id");

-- AddForeignKey
ALTER TABLE "transfer_files" ADD CONSTRAINT "transfer_files_transfer_id_fkey" FOREIGN KEY ("transfer_id") REFERENCES "transfers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
