-- AlterTable
ALTER TABLE "Medico" ADD COLUMN     "logoUrl" TEXT;

-- AlterTable
ALTER TABLE "RecetaItem" ADD COLUMN     "orden" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "cantidad" DROP NOT NULL;

-- CreateTable
CREATE TABLE "PlantillaReceta" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "medicoId" TEXT NOT NULL,
    "indicacionesGenerales" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlantillaReceta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlantillaItem" (
    "id" TEXT NOT NULL,
    "plantillaId" TEXT NOT NULL,
    "medicamentoId" TEXT,
    "descripcion" TEXT,
    "cantidad" TEXT,
    "dosis" TEXT NOT NULL,
    "frecuencia" TEXT NOT NULL,
    "duracion" TEXT NOT NULL,
    "indicaciones" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PlantillaItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlantillaReceta_medicoId_nombre_key" ON "PlantillaReceta"("medicoId", "nombre");

-- AddForeignKey
ALTER TABLE "PlantillaReceta" ADD CONSTRAINT "PlantillaReceta_medicoId_fkey" FOREIGN KEY ("medicoId") REFERENCES "Medico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantillaItem" ADD CONSTRAINT "PlantillaItem_plantillaId_fkey" FOREIGN KEY ("plantillaId") REFERENCES "PlantillaReceta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantillaItem" ADD CONSTRAINT "PlantillaItem_medicamentoId_fkey" FOREIGN KEY ("medicamentoId") REFERENCES "Medicamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

