-- AlterTable
ALTER TABLE `product` MODIFY `balance` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `productoptionalitem` MODIFY `balance` INTEGER NULL DEFAULT 0;
