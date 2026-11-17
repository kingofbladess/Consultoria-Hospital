-- CreateEnum
CREATE TYPE "GrupoEtario" AS ENUM ('ADULTO', 'PEDIATRICO');

-- AlterTable
ALTER TABLE "Receta" ADD COLUMN     "enfermedadId" TEXT;

-- CreateTable
CREATE TABLE "Protocolo" (
    "id" TEXT NOT NULL,
    "enfermedadId" TEXT NOT NULL,
    "grupo" "GrupoEtario" NOT NULL,
    "indicacionesGenerales" TEXT,
    "notas" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Protocolo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProtocoloItem" (
    "id" TEXT NOT NULL,
    "protocoloId" TEXT NOT NULL,
    "medicamentoId" TEXT,
    "descripcion" TEXT,
    "cantidad" TEXT,
    "dosis" TEXT NOT NULL DEFAULT '',
    "frecuencia" TEXT NOT NULL,
    "duracion" TEXT NOT NULL,
    "indicaciones" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "dosisMgKg" DOUBLE PRECISION,
    "dosisMaxMg" DOUBLE PRECISION,
    "mgPorMl" DOUBLE PRECISION,

    CONSTRAINT "ProtocoloItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Protocolo_enfermedadId_grupo_key" ON "Protocolo"("enfermedadId", "grupo");

-- AddForeignKey
ALTER TABLE "Receta" ADD CONSTRAINT "Receta_enfermedadId_fkey" FOREIGN KEY ("enfermedadId") REFERENCES "Enfermedad"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Protocolo" ADD CONSTRAINT "Protocolo_enfermedadId_fkey" FOREIGN KEY ("enfermedadId") REFERENCES "Enfermedad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProtocoloItem" ADD CONSTRAINT "ProtocoloItem_protocoloId_fkey" FOREIGN KEY ("protocoloId") REFERENCES "Protocolo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProtocoloItem" ADD CONSTRAINT "ProtocoloItem_medicamentoId_fkey" FOREIGN KEY ("medicamentoId") REFERENCES "Medicamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

