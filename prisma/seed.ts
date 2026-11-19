import { PrismaClient } from "@prisma/client";
import { cifrarClave } from "../src/lib/clave";

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
  { principioActivo: "Paracetamol", presentacion: "Jarabe", concentracion: "120 mg/5 ml", enfermedades: ["J06.9"] },
];

// Protocolos de ejemplo: tratamiento de primera línea por enfermedad y grupo de edad.
// IMPORTANTE: son un punto de partida y el equipo médico del centro debe revisarlos y ajustarlos.
// "med" apunta a un medicamento sembrado arriba por principio activo + concentración.
type ItemProtocolo = {
  med: string;
  dosis?: string;
  frecuencia: string;
  duracion: string;
  cantidad?: string;
  indicaciones?: string;
  dosisMgKg?: number;
  dosisMaxMg?: number;
  mgPorMl?: number;
};
const protocolos: { cie10: string; grupo: "ADULTO" | "PEDIATRICO"; indicaciones?: string; notas?: string; items: ItemProtocolo[] }[] = [
  {
    cie10: "I10", grupo: "ADULTO",
    indicaciones: "Dieta baja en sal. Caminar 30 minutos al día. Anotar la tensión arterial en casa y traer el registro al control en 4 semanas.",
    notas: "Primera línea en adultos sin contraindicación para ARA II. Evitar en embarazo.",
    items: [{ med: "Losartán potásico 50 mg", dosis: "1 tableta", frecuencia: "una vez al día", duracion: "30 días", cantidad: "1 caja", indicaciones: "Tomar a la misma hora todos los días." }],
  },
  {
    cie10: "E11", grupo: "ADULTO",
    indicaciones: "Dieta baja en azúcares y harinas refinadas. Actividad física diaria. Control de glicemia y HbA1c en 3 meses.",
    notas: "Verificar función renal antes de iniciar metformina.",
    items: [{ med: "Metformina 850 mg", dosis: "1 tableta", frecuencia: "dos veces al día con desayuno y cena", duracion: "30 días", cantidad: "2 cajas", indicaciones: "Tomar con las comidas para evitar molestias estomacales." }],
  },
  {
    cie10: "J45", grupo: "ADULTO",
    indicaciones: "Evitar humo, polvo y cambios bruscos de temperatura. Acudir a emergencia si la falta de aire no mejora con el inhalador.",
    items: [{ med: "Salbutamol 100 mcg/dosis", dosis: "2 inhalaciones", frecuencia: "cada 4 a 6 horas si hay falta de aire", duracion: "30 días", cantidad: "1 inhalador" }],
  },
  {
    cie10: "J45", grupo: "PEDIATRICO",
    indicaciones: "Usar siempre con aerocámara. Evitar humo y polvo en casa. Acudir a emergencia si respira con dificultad o se le hunden las costillas al respirar.",
    items: [{ med: "Salbutamol 100 mcg/dosis", dosis: "2 inhalaciones con aerocámara", frecuencia: "cada 4 a 6 horas si hay falta de aire", duracion: "14 días", cantidad: "1 inhalador" }],
  },
  {
    cie10: "J06.9", grupo: "ADULTO",
    indicaciones: "Reposo relativo, abundantes líquidos y lavados nasales con solución fisiológica. Volver si la fiebre dura más de 3 días o hay dificultad para respirar.",
    notas: "Cuadro viral: no requiere antibiótico.",
    items: [{ med: "Paracetamol 500 mg", dosis: "1 tableta", frecuencia: "cada 6 horas si hay fiebre o dolor", duracion: "3 días", cantidad: "1 caja", indicaciones: "No pasar de 8 tabletas al día." }],
  },
  {
    cie10: "J06.9", grupo: "PEDIATRICO",
    indicaciones: "Abundantes líquidos y lavados nasales con solución fisiológica. Volver si la fiebre dura más de 3 días, si no quiere comer o si respira con dificultad.",
    notas: "Paracetamol 15 mg/kg por toma, máximo 1 g por toma y 5 tomas al día. Cuadro viral: no requiere antibiótico.",
    items: [{ med: "Paracetamol 120 mg/5 ml", frecuencia: "cada 6 horas si hay fiebre o dolor", duracion: "3 días", cantidad: "1 frasco", indicaciones: "Medir con la jeringa dosificadora. No dar más de 5 tomas al día.", dosisMgKg: 15, dosisMaxMg: 1000, mgPorMl: 24 }],
  },
  {
    cie10: "K21", grupo: "ADULTO",
    indicaciones: "Evitar comidas copiosas, grasas, café y alcohol. No acostarse hasta 3 horas después de comer. Elevar la cabecera de la cama.",
    items: [{ med: "Omeprazol 20 mg", dosis: "1 cápsula", frecuencia: "una vez al día en ayunas", duracion: "28 días", cantidad: "2 cajas", indicaciones: "Tomar 30 minutos antes del desayuno." }],
  },
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

  // Protocolos: solo se crean si todavía no existen, para no pisar los que el centro ya ajustó.
  const sembrados = await prisma.medicamento.findMany({ where: { fuente: "seed" } });
  const buscarMed = (nombre: string) =>
    sembrados.find((m) => `${m.principioActivo} ${m.concentracion}` === nombre) ??
    (() => {
      throw new Error(`El protocolo usa un medicamento que no existe: ${nombre}`);
    })();
  for (const p of protocolos) {
    const enfermedad = await prisma.enfermedad.findUniqueOrThrow({ where: { codigoCie10: p.cie10 } });
    const existe = await prisma.protocolo.findUnique({ where: { enfermedadId_grupo: { enfermedadId: enfermedad.id, grupo: p.grupo } } });
    if (existe) continue;
    await prisma.protocolo.create({
      data: {
        enfermedadId: enfermedad.id,
        grupo: p.grupo,
        indicacionesGenerales: p.indicaciones,
        notas: p.notas,
        items: {
          create: p.items.map(({ med, ...item }, orden) => ({ ...item, dosis: item.dosis ?? "", medicamentoId: buscarMed(med).id, orden })),
        },
      },
    });
  }

  // Usuarios iniciales: se crean solo si su correo y contraseña están en el .env.
  const usuarios = [
    { email: process.env.ADMIN_EMAIL, clave: process.env.ADMIN_CLAVE, nombre: "Administración", rol: "ADMIN" as const },
    { email: process.env.RECEPCION_EMAIL, clave: process.env.RECEPCION_CLAVE, nombre: "Recepción", rol: "RECEPCION" as const },
  ];
  for (const u of usuarios) {
    if (!u.email || !u.clave) continue;
    const email = u.email.trim().toLowerCase();
    const existe = await prisma.usuario.findUnique({ where: { email } });
    if (existe) continue; // No se pisa la contraseña de un usuario que ya existe.
    await prisma.usuario.create({ data: { email, nombre: u.nombre, rol: u.rol, claveHash: await cifrarClave(u.clave) } });
    console.log(`Usuario creado: ${email} (${u.rol})`);
  }

  console.log("Datos iniciales cargados.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
