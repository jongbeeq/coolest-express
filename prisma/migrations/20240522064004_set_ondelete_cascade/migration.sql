-- DropForeignKey
ALTER TABLE `cart` DROP FOREIGN KEY `Cart_userId_fkey`;

-- DropForeignKey
ALTER TABLE `combineoptionalitem` DROP FOREIGN KEY `CombineOptionalItem_combineId_fkey`;

-- DropForeignKey
ALTER TABLE `combineoptionalitem` DROP FOREIGN KEY `CombineOptionalItem_primaryId_fkey`;

-- DropForeignKey
ALTER TABLE `image` DROP FOREIGN KEY `Image_productId_fkey`;

-- DropForeignKey
ALTER TABLE `optionaltypeitem` DROP FOREIGN KEY `OptionalTypeItem_productOptionalTypeId_fkey`;

-- DropForeignKey
ALTER TABLE `productcategory` DROP FOREIGN KEY `ProductCategory_categoryId_fkey`;

-- DropForeignKey
ALTER TABLE `productcategory` DROP FOREIGN KEY `ProductCategory_productId_fkey`;

-- DropForeignKey
ALTER TABLE `productoptionalitem` DROP FOREIGN KEY `ProductOptionalItem_productId_fkey`;

-- DropForeignKey
ALTER TABLE `productoptionaltype` DROP FOREIGN KEY `ProductOptionalType_productId_fkey`;

-- AddForeignKey
ALTER TABLE `ProductCategory` ADD CONSTRAINT `ProductCategory_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductCategory` ADD CONSTRAINT `ProductCategory_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductOptionalType` ADD CONSTRAINT `ProductOptionalType_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductOptionalItem` ADD CONSTRAINT `ProductOptionalItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OptionalTypeItem` ADD CONSTRAINT `OptionalTypeItem_productOptionalTypeId_fkey` FOREIGN KEY (`productOptionalTypeId`) REFERENCES `ProductOptionalType`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CombineOptionalItem` ADD CONSTRAINT `CombineOptionalItem_primaryId_fkey` FOREIGN KEY (`primaryId`) REFERENCES `ProductOptionalItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CombineOptionalItem` ADD CONSTRAINT `CombineOptionalItem_combineId_fkey` FOREIGN KEY (`combineId`) REFERENCES `ProductOptionalItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Image` ADD CONSTRAINT `Image_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Cart` ADD CONSTRAINT `Cart_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
