/*
  Warnings:

  - You are about to alter the column `satus` on the `event` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(7))` to `Enum(EnumId(1))`.

*/
-- AlterTable
ALTER TABLE `Category` ADD COLUMN `iconPublicId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Event` MODIFY `satus` ENUM('DRAFT', 'PUBLISHED', 'ONGOING', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE `Organizer` ADD COLUMN `logoPublicId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `profilePublicId` VARCHAR(191) NULL;
