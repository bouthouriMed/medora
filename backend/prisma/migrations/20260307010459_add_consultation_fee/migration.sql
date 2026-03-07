-- AlterTable
ALTER TABLE "ClinicSettings" ADD COLUMN     "consultationFee" DOUBLE PRECISION NOT NULL DEFAULT 100.00,
ADD COLUMN     "invoiceItemPresets" JSONB;
