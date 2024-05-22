/*
  Warnings:

  - The primary key for the `category` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `category` table. All the data in the column will be lost.
  - You are about to drop the column `categoryId` on the `productcategory` table. All the data in the column will be lost.
  - Added the required column `categoryTitle` to the `ProductCategory` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `productcategory` DROP FOREIGN KEY `ProductCategory_categoryId_fkey`;

-- DropIndex
DROP INDEX `Category_title_key` ON `category`;

-- AlterTable
ALTER TABLE `category` DROP PRIMARY KEY,
    DROP COLUMN `id`,
    ADD PRIMARY KEY (`title`);

-- AlterTable
ALTER TABLE `productcategory` DROP COLUMN `categoryId`,
    ADD COLUMN `categoryTitle` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `ProductCategory` ADD CONSTRAINT `ProductCategory_categoryTitle_fkey` FOREIGN KEY (`categoryTitle`) REFERENCES `Category`(`title`) ON DELETE CASCADE ON UPDATE CASCADE;
