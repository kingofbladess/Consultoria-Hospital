-- AlterTable
ALTER TABLE "Consulta" ADD COLUMN     "frecuenciaCardiaca" INTEGER,
ADD COLUMN     "frecuenciaRespiratoria" INTEGER,
ADD COLUMN     "pesoKg" DOUBLE PRECISION,
ADD COLUMN     "saturacion" INTEGER,
ADD COLUMN     "tallaCm" DOUBLE PRECISION,
ADD COLUMN     "temperatura" DOUBLE PRECISION,
ADD COLUMN     "tensionDiastolica" INTEGER,
ADD COLUMN     "tensionSistolica" INTEGER;

-- CreateTable
CREATE TABLE "Auditoria" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" TEXT,
    "usuarioNombre" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "recurso" TEXT NOT NULL,
    "registroId" TEXT,
    "detalle" TEXT,

    CONSTRAINT "Auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Auditoria_fecha_idx" ON "Auditoria"("fecha");

-- CreateIndex
CREATE INDEX "Auditoria_recurso_registroId_idx" ON "Auditoria"("recurso", "registroId");

