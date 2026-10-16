-- AlterTable
ALTER TABLE `Payment` ADD COLUMN `deepLink` TEXT NULL,
    ADD COLUMN `expiresAt` DATETIME(3) NULL,
    ADD COLUMN `gatewayRef` VARCHAR(191) NULL,
    ADD COLUMN `qrCode` TEXT NULL;

