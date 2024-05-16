/*
  Warnings:

  - You are about to drop the column `compoundId` on the `combineoptionalitem` table. All the data in the column will be lost.
  - You are about to drop the column `productOptionalTypeId` on the `productoptionalitem` table. All the data in the column will be lost.
  - Added the required column `combineId` to the `CombineOptionalItem` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `combineoptionalitem` DROP FOREIGN KEY `CombineOptionalItem_compoundId_fkey`;

-- DropForeignKey
ALTER TABLE `productoptionalitem` DROP FOREIGN KEY `ProductOptionalItem_productOptionalTypeId_fkey`;

-- AlterTable
ALTER TABLE `combineoptionalitem` DROP COLUMN `compoundId`,
    ADD COLUMN `combineId` INTEGER NOT NULL,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `productoptionalitem` DROP COLUMN `productOptionalTypeId`;

-- CreateTable
CREATE TABLE `OptionalTypeItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `productOptionalItemId` INTEGER NOT NULL,
    `productOptionalTypeId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `OptionalTypeItem` ADD CONSTRAINT `OptionalTypeItem_productOptionalTypeId_fkey` FOREIGN KEY (`productOptionalTypeId`) REFERENCES `ProductOptionalType`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OptionalTypeItem` ADD CONSTRAINT `OptionalTypeItem_productOptionalItemId_fkey` FOREIGN KEY (`productOptionalItemId`) REFERENCES `ProductOptionalItem`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CombineOptionalItem` ADD CONSTRAINT `CombineOptionalItem_combineId_fkey` FOREIGN KEY (`combineId`) REFERENCES `ProductOptionalItem`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
