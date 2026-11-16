import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Datos iniciales: especialidades, algunas enfermedades CIE-10 y medicamentos de uso común.
const especialidades = [
  "Medicina General", "Medicina Interna", "Pediatría", "Ginecología y Obstetricia", "Cardiología",
  "Dermatología", "Endocrinología", "Gastroenterología", "Neumonología", "Neurología",
  "Oftalmología", "Otorrinolaringología", "Psiquiatría", "Traumatología", "Urología",
];

const enfermedades: { codigoCie10: string; nombre: string; especialidad: string }[] = [
  { codigoCie10: "I10", nombre: "Hipertensión esencial (primaria)", especialidad: "Cardiología" },
  { codigoCie10: "E11", nombre: "Diabetes mellitus tipo 2", especialidad: "Endocrinología" },
  { codigoCie10: "J45", nombre: "Asma", especialidad: "Neumonología" },
  { codigoCie10: "J06.9", nombre: "Infección aguda de las vías respiratorias superiores", especialidad: "Medicina General" },
  { codigoCie10: "K21", nombre: "Enfermedad por reflujo gastroesofágico", especialidad: "Gastroenterología" },
  { codigoCie10: "F41.1", nombre: "Trastorno de ansiedad generalizada", especialidad: "Psiquiatría" },
];

const medicamentos = [
  { principioActivo: "Losartán potásico", presentacion: "Tabletas", concentracion: "50 mg", enfermedades: ["I10"] },
  { principioActivo: "Amlodipino", presentacion: "Tabletas", concentracion: "5 mg", enfermedades: ["I10"] },
  { principioActivo: "Metformina", presentacion: "Tabletas", concentracion: "850 mg", enfermedades: ["E11"] },
  { principioActivo: "Salbutamol", presentacion: "Inhalador", concentracion: "100 mcg/dosis", via: "INHALATORIA" as const, enfermedades: ["J45"] },
  { principioActivo: "Paracetamol", presentacion: "Tabletas", concentracion: "500 mg", enfermedades: ["J06.9"] },
  { principioActivo: "Omeprazol", presentacion: "Cápsulas", concentracion: "20 mg", enfermedades: ["K21"] },
  { principioActivo: "Clonazepam", presentacion: "Tabletas", concentracion: "2 mg", requiereRecipeEspecial: true, enfermedades: ["F41.1"] },
];

async function main() {
  for (const nombre of especialidades) {
    await prisma.especialidad.upsert({ where: { nombre }, create: { nombre }, update: {} });
  }

  for (const e of enfermedades) {
    const especialidad = await prisma.especialidad.findUniqueOrThrow({ where: { nombre: e.especialidad } });
    await prisma.enfermedad.upsert({
      where: { codigoCie10: e.codigoCie10 },
      create: { codigoCie10: e.codigoCie10, nombre: e.nombre, especialidadId: especialidad.id },
      update: {},
    });
  }

  for (const { enfermedades: codigos, ...m } of medicamentos) {
    const codigoExterno = `SEED-${m.principioActivo}-${m.concentracion}`;
    await prisma.medicamento.upsert({
      where: { fuente_codigoExterno: { fuente: "seed", codigoExterno } },
      create: {
        ...m,
        fuente: "seed",
        codigoExterno,
        enfermedades: { connect: codigos.map((codigoCie10) => ({ codigoCie10 })) },
      },
      update: {},
    });
  }

  console.log("Datos iniciales cargados.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
