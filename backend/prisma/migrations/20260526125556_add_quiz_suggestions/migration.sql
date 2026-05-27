-- CreateTable
CREATE TABLE `QuizSuggestion` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('new_question', 'correction') NOT NULL,
    `submitterId` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NULL,
    `question` TEXT NOT NULL,
    `answer` VARCHAR(255) NOT NULL,
    `category` VARCHAR(64) NOT NULL,
    `difficulty` VARCHAR(32) NOT NULL,
    `status` ENUM('pending', 'accepted', 'rejected') NOT NULL DEFAULT 'pending',
    `adminComment` TEXT NULL,
    `reviewedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `QuizSuggestion_submitterId_status_idx`(`submitterId`, `status`),
    INDEX `QuizSuggestion_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `QuizSuggestion` ADD CONSTRAINT `QuizSuggestion_submitterId_fkey` FOREIGN KEY (`submitterId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QuizSuggestion` ADD CONSTRAINT `QuizSuggestion_reviewedById_fkey` FOREIGN KEY (`reviewedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QuizSuggestion` ADD CONSTRAINT `QuizSuggestion_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `QuizQuestion`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
