-- DropForeignKey
ALTER TABLE `productoptionalitem` DROP FOREIGN KEY `ProductOptionalItem_productOptionalTypeId_fkey`;

-- AlterTable
ALTER TABLE `productoptionalitem` MODIFY `price` INTEGER NULL,
    MODIFY `balance` INTEGER NULL,
    MODIFY `productOptionalTypeId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `ProductOptionalItem` ADD CONSTRAINT `ProductOptionalItem_productOptionalTypeId_fkey` FOREIGN KEY (`productOptionalTypeId`) REFERENCES `ProductOptionalType`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
