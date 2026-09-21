/*
  Warnings:

  - You are about to drop the column `coverImgUrl` on the `event` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `event` DROP COLUMN `coverImgUrl`,
    ADD COLUMN `coverImagePublicId` VARCHAR(191) NULL,
    ADD COLUMN `coverImageUrl` VARCHAR(191) NULL;
