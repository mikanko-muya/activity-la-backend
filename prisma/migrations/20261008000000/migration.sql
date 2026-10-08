-- AlterTable
ALTER TABLE `Payment` ADD COLUMN `failureReason` VARCHAR(191) NULL,
    MODIFY `amount` DECIMAL(10, 2) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Payment_transactionRef_key` ON `Payment`(`transactionRef`);

-- CreateIndex
CREATE INDEX `Payment_orderId_status_idx` ON `Payment`(`orderId`, `status`);

