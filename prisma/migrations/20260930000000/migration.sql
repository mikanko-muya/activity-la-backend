-- Reconciles the two lineages that grew from 20260914053434 in parallel.
--
-- Both branches added migrations from the same base and renamed some of the
-- same columns differently, so interleaved by filename they could not replay.
-- The order-module lineage (20260916094115 .. 20260929032834) is kept intact
-- and everything the other branch did arrives here, as one migration at the
-- end. That keeps history linear and replayable on a fresh database.
--
-- Applying this needs a reset: it assumes the state the order-module lineage
-- leaves behind, not the state either developer's database is in today.

-- Event: the column was misspelled `satus` from the first migration. CHANGE
-- rather than DROP + ADD, so existing statuses survive the rename.
-- coverImgPublicId is the Cloudinary handle for the cover image; without it a
-- replaced or deleted cover is orphaned with nothing to address it by.
-- isFree went to DEFAULT false in 20260923033951; the model says true.
ALTER TABLE `Event`
    CHANGE `satus` `eventStatus` ENUM('DRAFT', 'PUBLISHED', 'ONGOING', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    ADD COLUMN `coverImgPublicId` VARCHAR(191) NULL,
    MODIFY `isFree` BOOLEAN NOT NULL DEFAULT true;

-- User: SUPERADMIN sits above ADMIN. Widening an ENUM is additive and does not
-- rewrite existing rows.
ALTER TABLE `User` MODIFY `role` ENUM('USER', 'ADMIN', 'SUPERADMIN') NOT NULL DEFAULT 'USER';

-- Registration and login both key on phone, so duplicates would let findFirst
-- return an arbitrary account. Fails if duplicates already exist; check with
--   SELECT phone, COUNT(*) c FROM `User` GROUP BY phone HAVING c > 1;
ALTER TABLE `User` ADD UNIQUE INDEX `User_phone_key`(`phone`);

-- Coupon: isUsed was dropped in 20260924044605, but a single boolean could only
-- say "finished", never "3 of 50 redeemed". usedCount is the cheap authority for
-- the total-uses limit; isActive is the admin kill switch.
ALTER TABLE `Coupon`
    ADD COLUMN `usageLimit` INT NULL,
    ADD COLUMN `usedCount` INT NOT NULL DEFAULT 0,
    ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true;

-- CouponUsage becomes CouponRedemption. Same table, one name: both branches
-- arrived at an identical design independently. usedAt becomes redeemedAt, and
-- the duplicated timestamps go - createdAt said the same thing as usedAt, and
-- updatadAt was a typo for a column nothing updates.
RENAME TABLE `CouponUsage` TO `CouponRedemption`;

ALTER TABLE `CouponRedemption` DROP FOREIGN KEY `CouponUsage_couponId_fkey`;
ALTER TABLE `CouponRedemption` DROP FOREIGN KEY `CouponUsage_userId_fkey`;
ALTER TABLE `CouponRedemption` DROP FOREIGN KEY `CouponUsage_orderId_fkey`;

ALTER TABLE `CouponRedemption`
    CHANGE `usedAt` `redeemedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    DROP COLUMN `createdAt`,
    DROP COLUMN `updatadAt`;

-- Dropped and recreated rather than renamed: this server is MariaDB, which does
-- not accept ALTER TABLE ... RENAME INDEX. The foreign keys were removed above,
-- so the indexes are free to go and are rebuilt under their new names before the
-- constraints are put back.
ALTER TABLE `CouponRedemption` DROP INDEX `CouponUsage_orderId_key`;
ALTER TABLE `CouponRedemption` DROP INDEX `CouponUsage_couponId_userId_key`;
ALTER TABLE `CouponRedemption` ADD UNIQUE INDEX `CouponRedemption_orderId_key`(`orderId`);
ALTER TABLE `CouponRedemption` ADD UNIQUE INDEX `CouponRedemption_couponId_userId_key`(`couponId`, `userId`);

-- RESTRICT, not SetNull or Cascade: a redemption with no coupon is meaningless,
-- and a coupon that has been redeemed should be deactivated rather than deleted.
ALTER TABLE `CouponRedemption` ADD CONSTRAINT `CouponRedemption_couponId_fkey` FOREIGN KEY (`couponId`) REFERENCES `Coupon`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `CouponRedemption` ADD CONSTRAINT `CouponRedemption_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `CouponRedemption` ADD CONSTRAINT `CouponRedemption_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- OrderItem held money as Int while TicketType.price and Order.*Amount are
-- Decimal(10,2). The three disagreed, and writing a Decimal into an Int column
-- fails outright.
ALTER TABLE `OrderItem`
    MODIFY `unitPrice` DECIMAL(10, 2) NOT NULL,
    MODIFY `subtotal` DECIMAL(10, 2) NOT NULL;
