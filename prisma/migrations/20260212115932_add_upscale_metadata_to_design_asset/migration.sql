-- AlterTable
ALTER TABLE "DesignAsset" ADD COLUMN     "sourceHeightPx" INTEGER,
ADD COLUMN     "sourceWidthPx" INTEGER,
ADD COLUMN     "upscaleFactor" INTEGER,
ADD COLUMN     "upscaleProvider" TEXT;
