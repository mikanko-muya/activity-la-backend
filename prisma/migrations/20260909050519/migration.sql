/*
  Warnings:

  - You are about to alter the column `price` on the `tickettype` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Decimal(10,2)`.

*/
-- AlterTable
ALTER TABLE `tickettype` MODIFY `price` DECIMAL(10, 2) NOT NULL;
