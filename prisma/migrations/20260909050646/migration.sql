/*
  Warnings:

  - Added the required column `province` to the `Venue` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Venue` ADD COLUMN `province` VARCHAR(191) NOT NULL;
