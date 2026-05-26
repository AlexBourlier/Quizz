-- CreateTable
CREATE TABLE `RoomModerator` (
    `id` VARCHAR(191) NOT NULL,
    `roomId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `RoomModerator_userId_idx`(`userId`),
    UNIQUE INDEX `RoomModerator_roomId_userId_key`(`roomId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RoomInvitation` (
    `id` VARCHAR(191) NOT NULL,
    `roomId` VARCHAR(191) NOT NULL,
    `invitedId` VARCHAR(191) NOT NULL,
    `invitedById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `RoomInvitation_invitedId_idx`(`invitedId`),
    UNIQUE INDEX `RoomInvitation_roomId_invitedId_key`(`roomId`, `invitedId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Settings` (
    `key` VARCHAR(191) NOT NULL,
    `value` TEXT NOT NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `User`
    ADD COLUMN `pendingAvatar` MEDIUMTEXT NULL,
    MODIFY COLUMN `avatar` TEXT NULL;

-- AddForeignKey
ALTER TABLE `RoomModerator` ADD CONSTRAINT `RoomModerator_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `Room`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `RoomModerator` ADD CONSTRAINT `RoomModerator_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RoomInvitation` ADD CONSTRAINT `RoomInvitation_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `Room`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `RoomInvitation` ADD CONSTRAINT `RoomInvitation_invitedId_fkey` FOREIGN KEY (`invitedId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `RoomInvitation` ADD CONSTRAINT `RoomInvitation_invitedById_fkey` FOREIGN KEY (`invitedById`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
