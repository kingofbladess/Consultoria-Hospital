-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'MEDICO', 'RECEPCION', 'FARMACIA');

-- CreateEnum
CREATE TYPE "TipoPersonal" AS ENUM ('MEDICO', 'ENFERMERIA', 'ADMINISTRATIVO', 'FARMACIA', 'LABORATORIO', 'OTRO');

-- CreateEnum
CREATE TYPE "DiaSemana" AS ENUM ('LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO');

-- CreateEnum
CREATE TYPE "Sexo" AS ENUM ('FEMENINO', 'MASCULINO');

-- CreateEnum
CREATE TYPE "EstadoCita" AS ENUM ('PENDIENTE', 'CONFIRMADA', 'ATENDIDA', 'CANCELADA', 'NO_ASISTIO');

-- CreateEnum
CREATE TYPE "ViaAdministracion" AS ENUM ('ORAL', 'SUBLINGUAL', 'TOPICA', 'INTRAVENOSA', 'INTRAMUSCULAR', 'SUBCUTANEA', 'INHALATORIA', 'OFTALMICA', 'OTICA', 'NASAL', 'RECTAL', 'VAGINAL', 'OTRA');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "claveHash" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'RECEPCION',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "personalId" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Personal" (
    "id" TEXT NOT NULL,
    "cedula" TEXT NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "tipo" "TipoPersonal" NOT NULL,
    "cargo" TEXT NOT NULL,
    "telefono" TEXT,
    "email" TEXT,
    "fechaIngreso" TIMESTAMP(3),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Personal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Medico" (
    "id" TEXT NOT NULL,
    "personalId" TEXT NOT NULL,
    "numeroMpps" TEXT NOT NULL,
    "numeroColegio" TEXT,
    "firmaUrl" TEXT,
    "selloUrl" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Medico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Especialidad" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "Especialidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consultorio" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "piso" TEXT,
    "ubicacion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "especialidadId" TEXT,

    CONSTRAINT "Consultorio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Horario" (
    "id" TEXT NOT NULL,
    "medicoId" TEXT NOT NULL,
    "consultorioId" TEXT NOT NULL,
    "dia" "DiaSemana" NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFin" TEXT NOT NULL,

    CONSTRAINT "Horario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Paciente" (
    "id" TEXT NOT NULL,
    "cedula" TEXT,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "fechaNacimiento" TIMESTAMP(3) NOT NULL,
    "sexo" "Sexo" NOT NULL,
    "telefono" TEXT,
    "email" TEXT,
    "direccion" TEXT,
    "tipoSangre" TEXT,
    "alergias" TEXT,
    "antecedentes" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Paciente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cita" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "medicoId" TEXT NOT NULL,
    "consultorioId" TEXT,
    "fechaHora" TIMESTAMP(3) NOT NULL,
    "motivo" TEXT,
    "estado" "EstadoCita" NOT NULL DEFAULT 'PENDIENTE',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cita_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consulta" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "medicoId" TEXT NOT NULL,
    "citaId" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "motivo" TEXT NOT NULL,
    "examenFisico" TEXT,
    "diagnostico" TEXT,
    "enfermedadId" TEXT,
    "plan" TEXT,

    CONSTRAINT "Consulta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Receta" (
    "id" TEXT NOT NULL,
    "numero" SERIAL NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "medicoId" TEXT NOT NULL,
    "consultaId" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "indicacionesGenerales" TEXT,

    CONSTRAINT "Receta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecetaItem" (
    "id" TEXT NOT NULL,
    "recetaId" TEXT NOT NULL,
    "medicamentoId" TEXT,
    "descripcion" TEXT,
    "cantidad" TEXT NOT NULL,
    "dosis" TEXT NOT NULL,
    "frecuencia" TEXT NOT NULL,
    "duracion" TEXT NOT NULL,
    "indicaciones" TEXT,

    CONSTRAINT "RecetaItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enfermedad" (
    "id" TEXT NOT NULL,
    "codigoCie10" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "especialidadId" TEXT,

    CONSTRAINT "Enfermedad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Medicamento" (
    "id" TEXT NOT NULL,
    "principioActivo" TEXT NOT NULL,
    "nombreComercial" TEXT,
    "presentacion" TEXT NOT NULL,
    "concentracion" TEXT,
    "via" "ViaAdministracion" NOT NULL DEFAULT 'ORAL',
    "laboratorio" TEXT,
    "requiereRecipeEspecial" BOOLEAN NOT NULL DEFAULT false,
    "fuente" TEXT NOT NULL DEFAULT 'local',
    "codigoExterno" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Medicamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_EspecialidadToMedico" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_EspecialidadToMedico_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_EnfermedadToMedicamento" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_EnfermedadToMedicamento_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_personalId_key" ON "Usuario"("personalId");

-- CreateIndex
CREATE UNIQUE INDEX "Personal_cedula_key" ON "Personal"("cedula");

-- CreateIndex
CREATE UNIQUE INDEX "Medico_personalId_key" ON "Medico"("personalId");

-- CreateIndex
CREATE UNIQUE INDEX "Medico_numeroMpps_key" ON "Medico"("numeroMpps");

-- CreateIndex
CREATE UNIQUE INDEX "Especialidad_nombre_key" ON "Especialidad"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Consultorio_nombre_key" ON "Consultorio"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Horario_consultorioId_dia_horaInicio_key" ON "Horario"("consultorioId", "dia", "horaInicio");

-- CreateIndex
CREATE UNIQUE INDEX "Paciente_cedula_key" ON "Paciente"("cedula");

-- CreateIndex
CREATE UNIQUE INDEX "Consulta_citaId_key" ON "Consulta"("citaId");

-- CreateIndex
CREATE UNIQUE INDEX "Receta_numero_key" ON "Receta"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "Enfermedad_codigoCie10_key" ON "Enfermedad"("codigoCie10");

-- CreateIndex
CREATE INDEX "Medicamento_principioActivo_idx" ON "Medicamento"("principioActivo");

-- CreateIndex
CREATE UNIQUE INDEX "Medicamento_fuente_codigoExterno_key" ON "Medicamento"("fuente", "codigoExterno");

-- CreateIndex
CREATE INDEX "_EspecialidadToMedico_B_index" ON "_EspecialidadToMedico"("B");

-- CreateIndex
CREATE INDEX "_EnfermedadToMedicamento_B_index" ON "_EnfermedadToMedicamento"("B");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_personalId_fkey" FOREIGN KEY ("personalId") REFERENCES "Personal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Medico" ADD CONSTRAINT "Medico_personalId_fkey" FOREIGN KEY ("personalId") REFERENCES "Personal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultorio" ADD CONSTRAINT "Consultorio_especialidadId_fkey" FOREIGN KEY ("especialidadId") REFERENCES "Especialidad"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Horario" ADD CONSTRAINT "Horario_medicoId_fkey" FOREIGN KEY ("medicoId") REFERENCES "Medico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Horario" ADD CONSTRAINT "Horario_consultorioId_fkey" FOREIGN KEY ("consultorioId") REFERENCES "Consultorio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cita" ADD CONSTRAINT "Cita_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cita" ADD CONSTRAINT "Cita_medicoId_fkey" FOREIGN KEY ("medicoId") REFERENCES "Medico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cita" ADD CONSTRAINT "Cita_consultorioId_fkey" FOREIGN KEY ("consultorioId") REFERENCES "Consultorio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consulta" ADD CONSTRAINT "Consulta_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consulta" ADD CONSTRAINT "Consulta_medicoId_fkey" FOREIGN KEY ("medicoId") REFERENCES "Medico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consulta" ADD CONSTRAINT "Consulta_citaId_fkey" FOREIGN KEY ("citaId") REFERENCES "Cita"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consulta" ADD CONSTRAINT "Consulta_enfermedadId_fkey" FOREIGN KEY ("enfermedadId") REFERENCES "Enfermedad"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receta" ADD CONSTRAINT "Receta_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receta" ADD CONSTRAINT "Receta_medicoId_fkey" FOREIGN KEY ("medicoId") REFERENCES "Medico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receta" ADD CONSTRAINT "Receta_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "Consulta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecetaItem" ADD CONSTRAINT "RecetaItem_recetaId_fkey" FOREIGN KEY ("recetaId") REFERENCES "Receta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecetaItem" ADD CONSTRAINT "RecetaItem_medicamentoId_fkey" FOREIGN KEY ("medicamentoId") REFERENCES "Medicamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enfermedad" ADD CONSTRAINT "Enfermedad_especialidadId_fkey" FOREIGN KEY ("especialidadId") REFERENCES "Especialidad"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EspecialidadToMedico" ADD CONSTRAINT "_EspecialidadToMedico_A_fkey" FOREIGN KEY ("A") REFERENCES "Especialidad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EspecialidadToMedico" ADD CONSTRAINT "_EspecialidadToMedico_B_fkey" FOREIGN KEY ("B") REFERENCES "Medico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EnfermedadToMedicamento" ADD CONSTRAINT "_EnfermedadToMedicamento_A_fkey" FOREIGN KEY ("A") REFERENCES "Enfermedad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EnfermedadToMedicamento" ADD CONSTRAINT "_EnfermedadToMedicamento_B_fkey" FOREIGN KEY ("B") REFERENCES "Medicamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;
