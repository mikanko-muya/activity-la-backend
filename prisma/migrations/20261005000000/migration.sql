-- DropForeignKey
ALTER TABLE `Notification` DROP FOREIGN KEY `Notification_eventId_fkey`;

-- DropForeignKey
ALTER TABLE `Notification` DROP FOREIGN KEY `Notification_userId_fkey`;

-- DropIndex
DROP INDEX `Notification_eventId_fkey` ON `Notification`;

-- DropIndex
DROP INDEX `Notification_userId_fkey` ON `Notification`;

-- AlterTable
ALTER TABLE `Notification` ADD COLUMN `couponId` VARCHAR(191) NULL,
    ADD COLUMN `orderId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `Notification_userId_isRead_idx` ON `Notification`(`userId`, `isRead`);

-- CreateIndex
CREATE INDEX `Notification_userId_createdAt_idx` ON `Notification`(`userId`, `createdAt`);

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_couponId_fkey` FOREIGN KEY (`couponId`) REFERENCES `Coupon`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

