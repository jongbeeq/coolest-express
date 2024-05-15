-- DropForeignKey
ALTER TABLE `image` DROP FOREIGN KEY `Image_productOptionalItemId_fkey`;

-- AlterTable
ALTER TABLE `image` MODIFY `productOptionalItemId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Image` ADD CONSTRAINT `Image_productOptionalItemId_fkey` FOREIGN KEY (`productOptionalItemId`) REFERENCES `ProductOptionalItem`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
