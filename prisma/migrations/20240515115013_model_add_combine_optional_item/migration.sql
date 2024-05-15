/*
  Warnings:

  - You are about to drop the column `productOptionalItemId` on the `productoptionalitem` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `productoptionalitem` DROP FOREIGN KEY `ProductOptionalItem_productOptionalItemId_fkey`;

-- AlterTable
ALTER TABLE `productoptionalitem` DROP COLUMN `productOptionalItemId`;

-- CreateTable
CREATE TABLE `CombineOptionalItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `primaryId` INTEGER NOT NULL,
    `compoundId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CombineOptionalItem` ADD CONSTRAINT `CombineOptionalItem_primaryId_fkey` FOREIGN KEY (`primaryId`) REFERENCES `ProductOptionalItem`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CombineOptionalItem` ADD CONSTRAINT `CombineOptionalItem_compoundId_fkey` FOREIGN KEY (`compoundId`) REFERENCES `ProductOptionalItem`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
