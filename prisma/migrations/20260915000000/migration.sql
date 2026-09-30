-- Brings the database in line with the schema, which had drifted:
--   * User.phone gained @unique in prisma/models/user.prisma
--   * Event.satus was renamed to Event.eventStatus in prisma/models/event.prisma
-- Neither change had a migration, so the DB still had the old shape.

-- Renames the column in place. Written as CHANGE rather than the DROP + ADD that
-- `prisma migrate dev` would have generated for a rename, so existing event
-- statuses survive.
ALTER TABLE `Event` CHANGE `satus` `eventStatus` ENUM('DRAFT', 'PUBLISHED', 'ONGOING', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT';

-- auth registers and logs in by phone, so duplicates would let findFirst pick an
-- arbitrary account. This fails if duplicates already exist; check first with:
--   SELECT phone, COUNT(*) c FROM `User` GROUP BY phone HAVING c > 1;
ALTER TABLE `User` ADD UNIQUE INDEX `User_phone_key`(`phone`);
