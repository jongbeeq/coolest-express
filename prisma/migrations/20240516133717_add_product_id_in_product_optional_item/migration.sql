/*
  Warnings:

  - Added the required column `productId` to the `ProductOptionalItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `productoptionalitem` ADD COLUMN `productId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `ProductOptionalItem` ADD CONSTRAINT `ProductOptionalItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
