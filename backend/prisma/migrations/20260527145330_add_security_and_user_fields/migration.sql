-- AlterTable
ALTER TABLE `PrivateMessage` MODIFY `content` MEDIUMTEXT NOT NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `birthDate` DATETIME(3) NULL,
    ADD COLUMN `emailVerifiedAt` DATETIME(3) NULL,
    ADD COLUMN `emailVerifyToken` VARCHAR(128) NULL,
    ADD COLUMN `emailVerifyTokenExpiresAt` DATETIME(3) NULL,
    ADD COLUMN `guestExpiresAt` DATETIME(3) NULL,
    ADD COLUMN `isGuest` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isSuspended` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `parentalConsentAt` DATETIME(3) NULL,
    ADD COLUMN `parentalConsentToken` VARCHAR(128) NULL,
    ADD COLUMN `registrationIp` VARCHAR(64) NULL,
    ADD COLUMN `suspendedUntil` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `SecurityLog` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `event` VARCHAR(64) NOT NULL,
    `ipHash` VARCHAR(64) NULL,
    `userAgent` VARCHAR(512) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NOT NULL,

    INDEX `SecurityLog_userId_idx`(`userId`),
    INDEX `SecurityLog_ipHash_idx`(`ipHash`),
    INDEX `SecurityLog_event_createdAt_idx`(`event`, `createdAt`),
    INDEX `SecurityLog_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SecurityLog` ADD CONSTRAINT `SecurityLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
