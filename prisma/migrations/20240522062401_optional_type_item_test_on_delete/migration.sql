-- DropForeignKey
ALTER TABLE `optionaltypeitem` DROP FOREIGN KEY `OptionalTypeItem_productOptionalItemId_fkey`;

-- AddForeignKey
ALTER TABLE `OptionalTypeItem` ADD CONSTRAINT `OptionalTypeItem_productOptionalItemId_fkey` FOREIGN KEY (`productOptionalItemId`) REFERENCES `ProductOptionalItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
