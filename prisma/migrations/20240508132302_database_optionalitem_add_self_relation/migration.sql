/*
  Warnings:

  - You are about to drop the column `productId` on the `productoptionalitem` table. All the data in the column will be lost.
  - Added the required column `productOptionalItemId` to the `ProductOptionalItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productOptionalTypeId` to the `ProductOptionalItem` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `productoptionalitem` DROP FOREIGN KEY `ProductOptionalItem_productId_fkey`;

-- AlterTable
ALTER TABLE `productoptionalitem` DROP COLUMN `productId`,
    ADD COLUMN `productOptionalItemId` INTEGER NOT NULL,
    ADD COLUMN `productOptionalTypeId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `ProductOptionalItem` ADD CONSTRAINT `ProductOptionalItem_productOptionalItemId_fkey` FOREIGN KEY (`productOptionalItemId`) REFERENCES `ProductOptionalItem`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductOptionalItem` ADD CONSTRAINT `ProductOptionalItem_productOptionalTypeId_fkey` FOREIGN KEY (`productOptionalTypeId`) REFERENCES `ProductOptionalType`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
