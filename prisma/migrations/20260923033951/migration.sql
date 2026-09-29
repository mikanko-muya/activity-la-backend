/*
  Warnings:

  - You are about to drop the column `coverImagePublicId` on the `event` table. All the data in the column will be lost.
  - You are about to drop the column `coverImageUrl` on the `event` table. All the data in the column will be lost.
  - You are about to drop the column `bannerType` on the `eventbanner` table. All the data in the column will be lost.
  - You are about to drop the column `coverImgUrl` on the `eventbanner` table. All the data in the column will be lost.
  - You are about to drop the column `endAt` on the `eventbanner` table. All the data in the column will be lost.
  - You are about to drop the column `endDate` on the `eventbanner` table. All the data in the column will be lost.
  - You are about to drop the column `organizerId` on the `eventbanner` table. All the data in the column will be lost.
  - You are about to drop the column `startAt` on the `eventbanner` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `eventbanner` table. All the data in the column will be lost.
  - You are about to alter the column `subtotalAmount` on the `order` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Decimal(10,2)`.
  - You are about to alter the column `discountTotalAmount` on the `order` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Decimal(10,2)`.
  - You are about to alter the column `totalAmount` on the `order` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Decimal(10,2)`.
  - Added the required column `imagePublicId` to the `EventBanner` table without a default value. This is not possible if the table is not empty.
  - Added the required column `imageUrl` to the `EventBanner` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `eventbanner` DROP FOREIGN KEY `EventBanner_organizerId_fkey`;

-- DropForeignKey
ALTER TABLE `notification` DROP FOREIGN KEY `Notification_eventId_fkey`;

-- DropIndex
DROP INDEX `EventBanner_organizerId_fkey` ON `eventbanner`;

-- DropIndex
DROP INDEX `Notification_eventId_fkey` ON `notification`;

-- AlterTable
ALTER TABLE `event` DROP COLUMN `coverImagePublicId`,
    DROP COLUMN `coverImageUrl`,
    ADD COLUMN `coverImgUrl` VARCHAR(191) NULL,
    MODIFY `isFree` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `eventbanner` DROP COLUMN `bannerType`,
    DROP COLUMN `coverImgUrl`,
    DROP COLUMN `endAt`,
    DROP COLUMN `endDate`,
    DROP COLUMN `organizerId`,
    DROP COLUMN `startAt`,
    DROP COLUMN `startDate`,
    ADD COLUMN `imagePublicId` VARCHAR(191) NOT NULL,
    ADD COLUMN `imageUrl` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `notification` MODIFY `eventId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `order` MODIFY `subtotalAmount` DECIMAL(10, 2) NOT NULL,
    MODIFY `discountTotalAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    MODIFY `totalAmount` DECIMAL(10, 2) NOT NULL;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
