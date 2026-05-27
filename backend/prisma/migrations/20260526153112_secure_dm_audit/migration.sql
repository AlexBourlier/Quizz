-- AlterTable
ALTER TABLE `privatemessage` ADD COLUMN `authTag` VARCHAR(64) NULL,
    ADD COLUMN `expiresAt` DATETIME(3) NULL,
    ADD COLUMN `keyVersion` VARCHAR(16) NOT NULL DEFAULT 'cbc-v1',
    MODIFY `iv` VARCHAR(64) NOT NULL;

-- CreateTable
CREATE TABLE `ReportedMessage` (
    `id` VARCHAR(191) NOT NULL,
    `originalMessageId` VARCHAR(191) NULL,
    `encryptedContent` TEXT NOT NULL,
    `iv` VARCHAR(64) NOT NULL,
    `authTag` VARCHAR(64) NULL,
    `keyVersion` VARCHAR(16) NOT NULL,
    `senderId` VARCHAR(191) NOT NULL,
    `recipientId` VARCHAR(191) NOT NULL,
    `reporterId` VARCHAR(191) NOT NULL,
    `reason` TEXT NULL,
    `status` ENUM('pending', 'reviewed', 'actioned', 'dismissed') NOT NULL DEFAULT 'pending',
    `moderatorNote` TEXT NULL,
    `reviewedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NOT NULL,
    `resolvedAt` DATETIME(3) NULL,

    INDEX `ReportedMessage_status_expiresAt_idx`(`status`, `expiresAt`),
    INDEX `ReportedMessage_reporterId_idx`(`reporterId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AdminAuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `adminId` VARCHAR(191) NOT NULL,
    `action` ENUM('view_reported_message', 'decrypt_message', 'export_data', 'delete_message', 'ban_user', 'unban_user', 'promote_user', 'review_report', 'access_dm_history', 'rotate_encryption_key', 'modify_permissions') NOT NULL,
    `targetUserId` VARCHAR(191) NULL,
    `targetMessageId` VARCHAR(191) NULL,
    `ipAddress` VARCHAR(45) NULL,
    `reason` TEXT NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NOT NULL,

    INDEX `AdminAuditLog_adminId_idx`(`adminId`),
    INDEX `AdminAuditLog_action_idx`(`action`),
    INDEX `AdminAuditLog_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EncryptionKeyVersion` (
    `version` VARCHAR(191) NOT NULL,
    `algorithm` VARCHAR(32) NOT NULL DEFAULT 'aes-256-gcm',
    `isActive` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `retiredAt` DATETIME(3) NULL,

    INDEX `EncryptionKeyVersion_isActive_idx`(`isActive`),
    PRIMARY KEY (`version`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `PrivateMessage_expiresAt_idx` ON `PrivateMessage`(`expiresAt`);

-- AddForeignKey
ALTER TABLE `ReportedMessage` ADD CONSTRAINT `ReportedMessage_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReportedMessage` ADD CONSTRAINT `ReportedMessage_recipientId_fkey` FOREIGN KEY (`recipientId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReportedMessage` ADD CONSTRAINT `ReportedMessage_reporterId_fkey` FOREIGN KEY (`reporterId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReportedMessage` ADD CONSTRAINT `ReportedMessage_reviewedById_fkey` FOREIGN KEY (`reviewedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AdminAuditLog` ADD CONSTRAINT `AdminAuditLog_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
