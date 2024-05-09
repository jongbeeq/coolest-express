/*
  Warnings:

  - Added the required column `amountProduct` to the `Category` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `category` ADD COLUMN `amountProduct` INTEGER NOT NULL;
