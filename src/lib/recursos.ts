import { z } from "zod";
import { ErrorNegocio, type ConfigRecurso } from "./api";
import { prisma } from "./prisma";
import { COMPONENTES, gradosDeComponente } from "./marca/grados";

// Esquemas de validación y configuración de cada recurso de la API.
// Para agregar un recurso nuevo: defina su esquema aquí y cree sus dos archivos route.ts.

const texto = z.string().trim().min(1);
const textoOpcional = z.string().trim().optional().nullable();
const hora = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Formato HH:MM");
const ids = z.array(z.string()).optional();

type Datos = Record<string, unknown>;

/** Convierte una lista de ids en una relación muchos a muchos de Prisma. */
function relacion(datos: Datos, campoIds: string, campoRelacion: string, modo: "connect" | "set"): Datos {
  const { [campoIds]: lista, ...resto } = datos;
  if (!Array.isArray(lista)) return resto;
  return { ...resto, [campoRelacion]: { [modo]: lista.map((id) => ({ id })) } };
}

// Afiliación militar (opcional): componente de la FANB y grado del catálogo del kit de marca.
const militar = {
  componente: z.enum(COMPONENTES.map((c) => c.codigo) as [string, ...string[]]).optional().nullable(),
  grado: textoOpcional,
};

/** El grado debe existir en el componente elegido (la Armada usa su denominación naval). */
function validarGrado(d: { componente?: string | null; grado?: string | null }, ctx: z.RefinementCtx) {
  if (!d.grado) return;
  if (!d.componente) {
    ctx.addIssue({ code: "custom", path: ["grado"], message: "Indique primero el componente" });
  } else if (!gradosDeComponente(d.componente).some((g) => g.clave === d.grado)) {
    ctx.addIssue({ code: "custom", path: ["grado"], message: "Ese grado no existe en el componente elegido" });
  }
}

/** Igual que validarGrado, para los datos personales que viajan dentro del médico. */
function validarGradoAnidado(p: { componente?: string | null; grado?: string | null }, ctx: z.RefinementCtx) {
  if (p.grado && !p.componente) {
    ctx.addIssue({ code: "custom", path: ["personal", "grado"], message: "Indique primero el componente" });
  } else if (p.grado && p.componente && !gradosDeComponente(p.componente).some((g) => g.clave === p.grado)) {
    ctx.addIssue({ code: "custom", path: ["personal", "grado"], message: "Ese grado no existe en el componente elegido" });
  }
}

// ─── Personal ────────────────────────────────────────────────────────

const personal = z.object({
  cedula: texto,
  nombres: texto,
  apellidos: texto,
  tipo: z.enum(["MEDICO", "ENFERMERIA", "ADMINISTRATIVO", "FARMACIA", "LABORATORIO", "OTRO"]),
  cargo: texto,
  telefono: textoOpcional,
  email: z.string().email().optional().nullable(),
  fechaIngreso: z.coerce.date().optional().nullable(),
  activo: z.boolean().optional(),
  ...militar,
});

export const recursoPersonal: ConfigRecurso = {
  modelo: "personal",
  crear: personal.superRefine(validarGrado),
  actualizar: personal.partial().superRefine(validarGrado),
  camposBusqueda: ["cedula", "nombres", "apellidos", "cargo"],
  include: { medico: true },
  orderBy: [{ apellidos: "asc" }, { nombres: "asc" }],
};

// ─── Médicos ─────────────────────────────────────────────────────────

// Un médico se puede crear a partir de un miembro del personal existente (personalId)
// o en un solo paso enviando sus datos personales (personal), que se guardan como personal tipo MEDICO.
const datosPersonalesMedico = personal.omit({ tipo: true, cargo: true }).extend({ cargo: textoOpcional });

const medico = z.object({
  personalId: textoOpcional,
  personal: datosPersonalesMedico.optional(),
  numeroMpps: texto,
  numeroColegio: textoOpcional,
  logoUrl: textoOpcional,
  firmaUrl: textoOpcional,
  selloUrl: textoOpcional,
  especialidadIds: ids,
});

export const recursoMedicos: ConfigRecurso = {
  modelo: "medico",
  crear: medico
    .refine((d) => d.personalId || d.personal, {
      message: "Indique personalId o los datos personales del médico",
      path: ["personalId"],
    })
    .superRefine((d, ctx) => d.personal && validarGradoAnidado(d.personal, ctx)),
  actualizar: medico
    .omit({ personalId: true, personal: true })
    .extend({ personal: datosPersonalesMedico.partial().optional() })
    .partial()
    .superRefine((d, ctx) => d.personal && validarGradoAnidado(d.personal, ctx)),
  camposBusqueda: ["numeroMpps", "numeroColegio"],
  include: { personal: true, especialidades: true },
  orderBy: { creadoEn: "desc" },
  aCrear: (d) => {
    const { personal: datosPersonales, personalId, ...resto } = relacion(d, "especialidadIds", "especialidades", "connect");
    if (!datosPersonales) return { ...resto, personalId };
    const p = datosPersonales as Datos;
    return { ...resto, personal: { create: { ...p, cargo: p.cargo ?? "Médico", tipo: "MEDICO" } } };
  },
  aActualizar: (d) => {
    const { personal: datosPersonales, ...resto } = relacion(d, "especialidadIds", "especialidades", "set");
    if (!datosPersonales) return resto;
    // El cargo es obligatorio en la base: si llega vacío se conserva el que tenía.
    const { cargo, ...p } = datosPersonales as Datos;
    return { ...resto, personal: { update: cargo ? { ...p, cargo } : p } };
  },
};

// ─── Especialidades y consultorios ───────────────────────────────────

const especialidad = z.object({ nombre: texto, descripcion: textoOpcional });

export const recursoEspecialidades: ConfigRecurso = {
  modelo: "especialidad",
  crear: especialidad,
  actualizar: especialidad.partial(),
  camposBusqueda: ["nombre"],
  orderBy: { nombre: "asc" },
};

const consultorio = z.object({
  nombre: texto,
  piso: textoOpcional,
  ubicacion: textoOpcional,
  activo: z.boolean().optional(),
  especialidadId: textoOpcional,
});

export const recursoConsultorios: ConfigRecurso = {
  modelo: "consultorio",
  crear: consultorio,
  actualizar: consultorio.partial(),
  camposBusqueda: ["nombre", "ubicacion"],
  include: { especialidad: true },
  orderBy: { nombre: "asc" },
};

const horario = z.object({
  medicoId: texto,
  consultorioId: texto,
  dia: z.enum(["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO", "DOMINGO"]),
  horaInicio: hora,
  horaFin: hora,
});

export const recursoHorarios: ConfigRecurso = {
  modelo: "horario",
  crear: horario,
  actualizar: horario.partial(),
  validar: async (d, id) => {
    const actual = id ? await prisma.horario.findUnique({ where: { id } }) : null;
    const inicio = (d.horaInicio as string | undefined) ?? actual?.horaInicio;
    const fin = (d.horaFin as string | undefined) ?? actual?.horaFin;
    if (inicio && fin && fin <= inicio) throw new ErrorNegocio("La hora de fin debe ser posterior a la hora de inicio.");
    const medicoId = (d.medicoId as string | undefined) ?? actual?.medicoId;
    const consultorioId = (d.consultorioId as string | undefined) ?? actual?.consultorioId;
    const dia = (d.dia as string | undefined) ?? actual?.dia;
    if (!inicio || !fin || !medicoId || !consultorioId || !dia) return;
    const conflictos = await prisma.horario.findMany({
      where: { id: id ? { not: id } : undefined, dia: dia as "LUNES" | "MARTES" | "MIERCOLES" | "JUEVES" | "VIERNES" | "SABADO" | "DOMINGO", OR: [{ medicoId }, { consultorioId }] },
      select: { medicoId: true, consultorioId: true, horaInicio: true, horaFin: true },
    });
    const choque = conflictos.find((h) => inicio < h.horaFin && fin > h.horaInicio);
    if (choque) throw new ErrorNegocio(choque.medicoId === medicoId
      ? "El médico ya tiene un horario que se cruza ese día."
      : "El consultorio ya está ocupado en ese horario.");
  },
  include: { medico: { include: { personal: true } }, consultorio: true },
  orderBy: [{ dia: "asc" }, { horaInicio: "asc" }],
};

// ─── Pacientes, citas y consultas ────────────────────────────────────

const paciente = z.object({
  cedula: textoOpcional,
  nombres: texto,
  apellidos: texto,
  fechaNacimiento: z.coerce.date(),
  sexo: z.enum(["FEMENINO", "MASCULINO"]),
  telefono: textoOpcional,
  email: z.string().email().optional().nullable(),
  direccion: textoOpcional,
  tipoSangre: textoOpcional,
  alergias: textoOpcional,
  antecedentes: textoOpcional,
  ...militar,
});

export const recursoPacientes: ConfigRecurso = {
  modelo: "paciente",
  crear: paciente.superRefine(validarGrado),
  actualizar: paciente.partial().superRefine(validarGrado),
  camposBusqueda: ["cedula", "nombres", "apellidos"],
  orderBy: [{ apellidos: "asc" }, { nombres: "asc" }],
};

const cita = z.object({
  pacienteId: texto,
  medicoId: texto,
  consultorioId: textoOpcional,
  fechaHora: z.coerce.date(),
  motivo: textoOpcional,
  estado: z.enum(["PENDIENTE", "CONFIRMADA", "ATENDIDA", "CANCELADA", "NO_ASISTIO"]).optional(),
});

const MARGEN_CITA_MS = 15 * 60 * 1000;
const ACTIVAS = ["PENDIENTE", "CONFIRMADA"] as const;

/** Evita agendar dos citas activas del mismo médico, o del mismo paciente, a menos de 15 minutos. */
async function validarCita(d: Datos, id?: string) {
  const actual = id ? await prisma.cita.findUnique({ where: { id } }) : null;
  const estado = (d.estado as string | undefined) ?? actual?.estado ?? "PENDIENTE";
  if (!ACTIVAS.includes(estado as (typeof ACTIVAS)[number])) return; // Cancelar o marcar asistencia nunca choca.
  const fechaHora = (d.fechaHora as Date | undefined) ?? actual?.fechaHora;
  const medicoId = (d.medicoId as string | undefined) ?? actual?.medicoId;
  const pacienteId = (d.pacienteId as string | undefined) ?? actual?.pacienteId;
  if (!fechaHora || !medicoId) return;

  const rango = { gt: new Date(fechaHora.getTime() - MARGEN_CITA_MS), lt: new Date(fechaHora.getTime() + MARGEN_CITA_MS) };
  const choque = await prisma.cita.findFirst({
    where: {
      id: id ? { not: id } : undefined,
      estado: { in: [...ACTIVAS] },
      fechaHora: rango,
      OR: [{ medicoId }, ...(pacienteId ? [{ pacienteId }] : [])],
    },
    include: { paciente: true, medico: { include: { personal: true } } },
  });
  if (!choque) return;
  const hora = choque.fechaHora.toLocaleTimeString("es-VE", { timeZone: "America/Caracas", hour: "2-digit", minute: "2-digit" });
  throw new ErrorNegocio(
    choque.medicoId === medicoId
      ? `${choque.medico.personal.nombres} ${choque.medico.personal.apellidos} ya tiene una cita a las ${hora} con ${choque.paciente.nombres} ${choque.paciente.apellidos}. Elija otra hora (al menos 15 minutos de diferencia).`
      : `${choque.paciente.nombres} ${choque.paciente.apellidos} ya tiene otra cita a las ${hora}. Elija otra hora.`,
  );
}

export const recursoCitas: ConfigRecurso = {
  modelo: "cita",
  crear: cita,
  actualizar: cita.partial(),
  validar: validarCita,
  camposBusqueda: ["motivo"],
  include: { paciente: true, medico: { include: { personal: true } }, consultorio: true },
  orderBy: { fechaHora: "asc" },
};

const consulta = z.object({
  pacienteId: texto,
  medicoId: texto,
  citaId: textoOpcional,
  fecha: z.coerce.date().optional(),
  motivo: texto,
  examenFisico: textoOpcional,
  diagnostico: textoOpcional,
  enfermedadId: textoOpcional,
  plan: textoOpcional,
  tensionSistolica: z.number().int().min(50, "Revise la tensión sistólica").max(260, "Revise la tensión sistólica").optional().nullable(),
  tensionDiastolica: z.number().int().min(30, "Revise la tensión diastólica").max(160, "Revise la tensión diastólica").optional().nullable(),
  frecuenciaCardiaca: z.number().int().min(20, "Revise la frecuencia cardíaca").max(250, "Revise la frecuencia cardíaca").optional().nullable(),
  frecuenciaRespiratoria: z.number().int().min(5, "Revise la frecuencia respiratoria").max(80, "Revise la frecuencia respiratoria").optional().nullable(),
  temperatura: z.number().min(30, "Revise la temperatura").max(45, "Revise la temperatura").optional().nullable(),
  saturacion: z.number().int().min(50, "Revise la saturación").max(100, "Revise la saturación").optional().nullable(),
  pesoKg: z.number().min(0.5, "Revise el peso").max(350, "Revise el peso").optional().nullable(),
  tallaCm: z.number().min(30, "Revise la talla").max(250, "Revise la talla").optional().nullable(),
});

export const recursoConsultas: ConfigRecurso = {
  modelo: "consulta",
  crear: consulta,
  actualizar: consulta.omit({ pacienteId: true, medicoId: true }).partial(),
  validar: async (d, id) => {
    const actual = id ? await prisma.consulta.findUnique({ where: { id } }) : null;
    const citaId = Object.hasOwn(d, "citaId") ? d.citaId as string | null : actual?.citaId;
    if (!citaId) return;
    const pacienteId = (d.pacienteId as string | undefined) ?? actual?.pacienteId;
    const medicoId = (d.medicoId as string | undefined) ?? actual?.medicoId;
    const cita = await prisma.cita.findUnique({ where: { id: citaId } });
    if (!cita) throw new ErrorNegocio("La cita seleccionada no existe.");
    if (["CANCELADA", "NO_ASISTIO"].includes(cita.estado)) throw new ErrorNegocio("No se puede registrar una consulta desde una cita cancelada o con inasistencia.");
    if (cita.pacienteId !== pacienteId || cita.medicoId !== medicoId) throw new ErrorNegocio("La cita debe corresponder al mismo paciente y médico de la consulta.");
  },
  camposBusqueda: ["motivo", "diagnostico"],
  include: { paciente: true, medico: { include: { personal: true } }, enfermedad: true },
  orderBy: { fecha: "desc" },
};

// ─── Récipes ─────────────────────────────────────────────────────────

const recetaItem = z
  .object({
    medicamentoId: textoOpcional,
    descripcion: textoOpcional,
    cantidad: textoOpcional,
    dosis: texto,
    frecuencia: texto,
    duracion: texto,
    indicaciones: textoOpcional,
  })
  .refine((i) => i.medicamentoId || i.descripcion, {
    message: "Indique un medicamento del catálogo o una descripción",
  });

const items = z.array(recetaItem).min(1, "El récipe necesita al menos un medicamento");

/** Guarda los items en el orden en que se escribieron. */
const conOrden = (lista: unknown) => (lista as Datos[]).map((item, orden) => ({ ...item, orden }));

const receta = z.object({
  pacienteId: texto,
  medicoId: texto,
  consultaId: textoOpcional,
  enfermedadId: textoOpcional,
  indicacionesGenerales: textoOpcional,
  items,
});

export const recursoRecetas: ConfigRecurso = {
  modelo: "receta",
  crear: receta,
  actualizar: receta.omit({ pacienteId: true, medicoId: true }).partial(),
  validar: async (d, id) => {
    const actual = id ? await prisma.receta.findUnique({ where: { id } }) : null;
    const consultaId = Object.hasOwn(d, "consultaId") ? d.consultaId as string | null : actual?.consultaId;
    if (!consultaId) return;
    const pacienteId = (d.pacienteId as string | undefined) ?? actual?.pacienteId;
    const medicoId = (d.medicoId as string | undefined) ?? actual?.medicoId;
    const vinculada = await prisma.consulta.findUnique({ where: { id: consultaId } });
    if (!vinculada) throw new ErrorNegocio("La consulta seleccionada no existe.");
    if (vinculada.pacienteId !== pacienteId || vinculada.medicoId !== medicoId) throw new ErrorNegocio("La receta debe corresponder al paciente y médico de la consulta.");
  },
  camposBusqueda: ["indicacionesGenerales"],
  include: {
    paciente: true,
    medico: { include: { personal: true, especialidades: true } },
    items: { include: { medicamento: true }, orderBy: { orden: "asc" } },
  },
  orderBy: { numero: "desc" },
  aCrear: ({ items, ...resto }) => ({ ...resto, items: { create: conOrden(items) } }),
  // Al actualizar los items se reemplaza la lista completa.
  aActualizar: ({ items, ...resto }) =>
    items ? { ...resto, items: { deleteMany: {}, create: conOrden(items) } } : resto,
};

// Plantillas: medicamentos que el médico receta a diario, para reutilizarlos en un récipe nuevo.
const plantilla = z.object({
  nombre: texto,
  medicoId: texto,
  indicacionesGenerales: textoOpcional,
  items,
});

export const recursoPlantillas: ConfigRecurso = {
  modelo: "plantillaReceta",
  crear: plantilla,
  actualizar: plantilla.omit({ medicoId: true }).partial(),
  camposBusqueda: ["nombre"],
  include: { items: { include: { medicamento: true }, orderBy: { orden: "asc" } } },
  orderBy: { nombre: "asc" },
  aCrear: ({ items, ...resto }) => ({ ...resto, items: { create: conOrden(items) } }),
  aActualizar: ({ items, ...resto }) =>
    items ? { ...resto, items: { deleteMany: {}, create: conOrden(items) } } : resto,
};

// Protocolos: tratamiento habitual por enfermedad y grupo de edad. Llenan el récipe automáticamente.
const numeroPositivo = z.number().positive().optional().nullable();
const protocoloItem = z
  .object({
    medicamentoId: textoOpcional,
    descripcion: textoOpcional,
    cantidad: textoOpcional,
    dosis: z.string().trim().optional().default(""),
    frecuencia: texto,
    duracion: texto,
    indicaciones: textoOpcional,
    dosisMgKg: numeroPositivo,
    dosisMaxMg: numeroPositivo,
    mgPorMl: numeroPositivo,
  })
  .refine((i) => i.medicamentoId || i.descripcion, { message: "Indique un medicamento del catálogo o una descripción" })
  .refine((i) => i.dosis || i.dosisMgKg, { message: "Indique la dosis fija o la dosis por kg" });

const protocolo = z.object({
  enfermedadId: texto,
  grupo: z.enum(["ADULTO", "PEDIATRICO"]),
  indicacionesGenerales: textoOpcional,
  notas: textoOpcional,
  items: z.array(protocoloItem).min(1, "El protocolo necesita al menos un medicamento"),
});

export const recursoProtocolos: ConfigRecurso = {
  modelo: "protocolo",
  crear: protocolo,
  actualizar: protocolo.omit({ enfermedadId: true, grupo: true }).partial(),
  include: { enfermedad: true, items: { include: { medicamento: true }, orderBy: { orden: "asc" } } },
  orderBy: [{ enfermedad: { codigoCie10: "asc" } }, { grupo: "asc" }],
  aCrear: ({ items, ...resto }) => ({ ...resto, items: { create: conOrden(items) } }),
  aActualizar: ({ items, ...resto }) =>
    items ? { ...resto, items: { deleteMany: {}, create: conOrden(items) } } : resto,
};

// ─── Enfermedades y medicamentos ─────────────────────────────────────

const enfermedad = z.object({
  codigoCie10: texto,
  nombre: texto,
  especialidadId: textoOpcional,
});

export const recursoEnfermedades: ConfigRecurso = {
  modelo: "enfermedad",
  crear: enfermedad,
  actualizar: enfermedad.partial(),
  camposBusqueda: ["codigoCie10", "nombre"],
  include: { especialidad: true },
  orderBy: { codigoCie10: "asc" },
};

export const viasAdministracion = [
  "ORAL", "SUBLINGUAL", "TOPICA", "INTRAVENOSA", "INTRAMUSCULAR", "SUBCUTANEA",
  "INHALATORIA", "OFTALMICA", "OTICA", "NASAL", "RECTAL", "VAGINAL", "OTRA",
] as const;

export const esquemaMedicamento = z.object({
  principioActivo: texto,
  nombreComercial: textoOpcional,
  presentacion: texto,
  concentracion: textoOpcional,
  via: z.enum(viasAdministracion).optional(),
  laboratorio: textoOpcional,
  requiereRecipeEspecial: z.boolean().optional(),
  fuente: z.string().optional(),
  codigoExterno: textoOpcional,
  enfermedadIds: ids,
});

export const recursoMedicamentos: ConfigRecurso = {
  modelo: "medicamento",
  crear: esquemaMedicamento,
  actualizar: esquemaMedicamento.partial(),
  camposBusqueda: ["principioActivo", "nombreComercial", "laboratorio"],
  include: { enfermedades: true },
  orderBy: { principioActivo: "asc" },
  aCrear: (d) => relacion(d, "enfermedadIds", "enfermedades", "connect"),
  aActualizar: (d) => relacion(d, "enfermedadIds", "enfermedades", "set"),
};
