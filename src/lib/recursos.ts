import { z } from "zod";
import type { ConfigRecurso } from "./api";

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
});

export const recursoPersonal: ConfigRecurso = {
  modelo: "personal",
  crear: personal,
  actualizar: personal.partial(),
  camposBusqueda: ["cedula", "nombres", "apellidos", "cargo"],
  include: { medico: true },
  orderBy: [{ apellidos: "asc" }, { nombres: "asc" }],
};

// ─── Médicos ─────────────────────────────────────────────────────────

const medico = z.object({
  personalId: texto,
  numeroMpps: texto,
  numeroColegio: textoOpcional,
  firmaUrl: textoOpcional,
  selloUrl: textoOpcional,
  especialidadIds: ids,
});

export const recursoMedicos: ConfigRecurso = {
  modelo: "medico",
  crear: medico,
  actualizar: medico.omit({ personalId: true }).partial(),
  camposBusqueda: ["numeroMpps", "numeroColegio"],
  include: { personal: true, especialidades: true },
  orderBy: { creadoEn: "desc" },
  aCrear: (d) => relacion(d, "especialidadIds", "especialidades", "connect"),
  aActualizar: (d) => relacion(d, "especialidadIds", "especialidades", "set"),
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
});

export const recursoPacientes: ConfigRecurso = {
  modelo: "paciente",
  crear: paciente,
  actualizar: paciente.partial(),
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

export const recursoCitas: ConfigRecurso = {
  modelo: "cita",
  crear: cita,
  actualizar: cita.partial(),
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
});

export const recursoConsultas: ConfigRecurso = {
  modelo: "consulta",
  crear: consulta,
  actualizar: consulta.omit({ pacienteId: true, medicoId: true }).partial(),
  camposBusqueda: ["motivo", "diagnostico"],
  include: { paciente: true, medico: { include: { personal: true } }, enfermedad: true },
  orderBy: { fecha: "desc" },
};

// ─── Récipes ─────────────────────────────────────────────────────────

const recetaItem = z
  .object({
    medicamentoId: textoOpcional,
    descripcion: textoOpcional,
    cantidad: texto,
    dosis: texto,
    frecuencia: texto,
    duracion: texto,
    indicaciones: textoOpcional,
  })
  .refine((i) => i.medicamentoId || i.descripcion, {
    message: "Indique un medicamento del catálogo o una descripción",
  });

const receta = z.object({
  pacienteId: texto,
  medicoId: texto,
  consultaId: textoOpcional,
  indicacionesGenerales: textoOpcional,
  items: z.array(recetaItem).min(1, "El récipe necesita al menos un medicamento"),
});

export const recursoRecetas: ConfigRecurso = {
  modelo: "receta",
  crear: receta,
  actualizar: receta.omit({ pacienteId: true, medicoId: true }).partial(),
  camposBusqueda: ["indicacionesGenerales"],
  include: {
    paciente: true,
    medico: { include: { personal: true, especialidades: true } },
    items: { include: { medicamento: true } },
  },
  orderBy: { numero: "desc" },
  aCrear: ({ items, ...resto }) => ({ ...resto, items: { create: items } }),
  // Al actualizar los items se reemplaza la lista completa.
  aActualizar: ({ items, ...resto }) =>
    items ? { ...resto, items: { deleteMany: {}, create: items } } : resto,
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
