-- AlterTable
ALTER TABLE "BaseIngredient" ADD COLUMN "category" TEXT;

-- AlterTable
ALTER TABLE "FinishedProduct" ADD COLUMN "category" TEXT;
ALTER TABLE "FinishedProduct" ADD COLUMN "freezerInstructions" TEXT;
ALTER TABLE "FinishedProduct" ADD COLUMN "vacuumInstructions" TEXT;

-- AlterTable
ALTER TABLE "Recipe" ADD COLUMN "category" TEXT;
ALTER TABLE "Recipe" ADD COLUMN "prepTime" INTEGER;
ALTER TABLE "Recipe" ADD COLUMN "totalTime" INTEGER;
