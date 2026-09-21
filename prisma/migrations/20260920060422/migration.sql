/*
  Warnings:

  - Added the required column `eventId` to the `Coupon` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `coupon` ADD COLUMN `eventId` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `Coupon` ADD CONSTRAINT `Coupon_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
