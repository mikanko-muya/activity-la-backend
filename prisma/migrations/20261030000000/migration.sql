-- English twins for every translated field. Lao stays in the original columns
-- and is the main language; the `En` column beside each is English. Both are
-- required wherever the Lao one is.
--
-- Each twin is added nullable, filled from its Lao column so existing rows meet
-- NOT NULL, then tightened: existing rows start with the same text in both
-- until someone edits them.
--
-- The touched text columns are also widened to what the API accepts. They were
-- VARCHAR(191), so a long event description or notification message was
-- refused by the database with a 500 instead of being saved. Widening keeps
-- every existing value.

-- Category
ALTER TABLE `Category` ADD COLUMN `nameEn` VARCHAR(191) NULL;
UPDATE `Category` SET `nameEn` = `name`;
ALTER TABLE `Category` MODIFY `nameEn` VARCHAR(191) NOT NULL;
CREATE UNIQUE INDEX `Category_nameEn_key` ON `Category`(`nameEn`);

-- Event
ALTER TABLE `Event`
    MODIFY `title` VARCHAR(255) NOT NULL,
    MODIFY `description` TEXT NOT NULL,
    ADD COLUMN `titleEn` VARCHAR(255) NULL,
    ADD COLUMN `descriptionEn` TEXT NULL;
UPDATE `Event` SET `titleEn` = `title`, `descriptionEn` = `description`;
ALTER TABLE `Event`
    MODIFY `titleEn` VARCHAR(255) NOT NULL,
    MODIFY `descriptionEn` TEXT NOT NULL;

-- TicketType
ALTER TABLE `TicketType`
    MODIFY `description` TEXT NULL,
    ADD COLUMN `nameEn` VARCHAR(191) NULL,
    ADD COLUMN `descriptionEn` TEXT NULL;
UPDATE `TicketType` SET `nameEn` = `name`, `descriptionEn` = `description`;
ALTER TABLE `TicketType` MODIFY `nameEn` VARCHAR(191) NOT NULL;

-- Organizer
ALTER TABLE `Organizer`
    MODIFY `description` TEXT NULL,
    ADD COLUMN `nameEn` VARCHAR(191) NULL,
    ADD COLUMN `descriptionEn` TEXT NULL;
UPDATE `Organizer` SET `nameEn` = `name`, `descriptionEn` = `description`;
ALTER TABLE `Organizer` MODIFY `nameEn` VARCHAR(191) NOT NULL;

-- Venue
ALTER TABLE `Venue`
    MODIFY `name` VARCHAR(255) NOT NULL,
    MODIFY `province` VARCHAR(255) NOT NULL,
    ADD COLUMN `nameEn` VARCHAR(255) NULL,
    ADD COLUMN `provinceEn` VARCHAR(255) NULL,
    ADD COLUMN `addressEn` VARCHAR(191) NULL;
UPDATE `Venue` SET `nameEn` = `name`, `provinceEn` = `province`, `addressEn` = `address`;
ALTER TABLE `Venue`
    MODIFY `nameEn` VARCHAR(255) NOT NULL,
    MODIFY `provinceEn` VARCHAR(255) NOT NULL,
    MODIFY `addressEn` VARCHAR(191) NOT NULL;

-- Notification
ALTER TABLE `Notification`
    MODIFY `title` VARCHAR(200) NOT NULL,
    MODIFY `message` VARCHAR(1000) NOT NULL,
    ADD COLUMN `titleEn` VARCHAR(200) NULL,
    ADD COLUMN `messageEn` VARCHAR(1000) NULL;
UPDATE `Notification` SET `titleEn` = `title`, `messageEn` = `message`;
ALTER TABLE `Notification`
    MODIFY `titleEn` VARCHAR(200) NOT NULL,
    MODIFY `messageEn` VARCHAR(1000) NOT NULL;
