/*
  Warnings:

  - Made the column `productOptionalTypeId` on table `productoptionalitem` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `productoptionalitem` DROP FOREIGN KEY `ProductOptionalItem_productOptionalTypeId_fkey`;

-- AlterTable
ALTER TABLE `productoptionalitem` MODIFY `productOptionalTypeId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `ProductOptionalItem` ADD CONSTRAINT `ProductOptionalItem_productOptionalTypeId_fkey` FOREIGN KEY (`productOptionalTypeId`) REFERENCES `ProductOptionalType`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
