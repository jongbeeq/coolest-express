-- AddForeignKey
ALTER TABLE `ProductOptionalType` ADD CONSTRAINT `ProductOptionalType_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductOptionalItem` ADD CONSTRAINT `ProductOptionalItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `ProductOptionalType`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
