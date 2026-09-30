-- Adds the Cloudinary handle for an event's cover image.
--
-- Event had coverImgUrl but no public id, so replacing or deleting a cover left
-- the old file orphaned in Cloudinary with nothing to address it by. Category,
-- User and Organizer all keep one (iconPublicId, profilePublicId, logoPublicId);
-- Event was the only image-bearing model without it.
--
-- Additive and nullable: existing rows get NULL, and the service skips cleanup
-- when it is NULL, so covers uploaded before this migration simply stay put.

ALTER TABLE `Event` ADD COLUMN `coverImgPublicId` VARCHAR(191) NULL;
