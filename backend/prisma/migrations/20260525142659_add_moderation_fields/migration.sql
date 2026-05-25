-- AlterTable
ALTER TABLE `room` ADD COLUMN `ageLimit` INTEGER NULL,
    ADD COLUMN `maxOccupants` INTEGER NULL,
    ADD COLUMN `rules` TEXT NULL;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `bannedAt` DATETIME(3) NULL,
    ADD COLUMN `color` VARCHAR(7) NULL,
    ADD COLUMN `mutedUntil` DATETIME(3) NULL;
