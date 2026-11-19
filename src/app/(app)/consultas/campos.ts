import type { Opcion, Seccion, Valores } from "@/components/Formulario";
import { fechaHoraInput } from "@/lib/formato";
import type { Consulta } from "@prisma/client";

/** Signos vitales con su rango posible (el mismo que valida la API) y su unidad. */
export const SIGNOS = [
  { nombre: "tensionSistolica", etiqueta: "Tensión sistólica", unidad: "mmHg", min: 50, max: 260, ayuda: "120" },
  { nombre: "tensionDiastolica", etiqueta: "Tensión diastólica", unidad: "mmHg", min: 30, max: 160, ayuda: "80" },
  { nombre: "frecuenciaCardiaca", etiqueta: "Frecuencia cardíaca", unidad: "lpm", min: 20, max: 250, ayuda: "72" },
  { nombre: "frecuenciaRespiratoria", etiqueta: "Frecuencia respiratoria", unidad: "rpm", min: 5, max: 80, ayuda: "16" },
  { nombre: "temperatura", etiqueta: "Temperatura", unidad: "°C", min: 30, max: 45, ayuda: "36,5" },
  { nombre: "saturacion", etiqueta: "Saturación de oxígeno", unidad: "%", min: 50, max: 100, ayuda: "98" },
  { nombre: "pesoKg", etiqueta: "Peso", unidad: "kg", min: 0.5, max: 350, ayuda: "70" },
  { nombre: "tallaCm", etiqueta: "Talla", unidad: "cm", min: 30, max: 250, ayuda: "170" },
] as const;

export type OpcionesConsulta = { pacientes: Opcion[]; medicos: Opcion[]; enfermedades: Opcion[] };

/** Al editar no se cambia el paciente ni el médico de una consulta ya registrada. */
export function camposConsulta({ pacientes, medicos, enfermedades }: OpcionesConsulta, edicion = false): Seccion[] {
  return [
    {
      titulo: "Datos de la consulta",
      campos: [
        ...(edicion
          ? []
          : [
              { nombre: "pacienteId", etiqueta: "Paciente", tipo: "select" as const, obligatorio: true, opciones: pacientes, ancho: true },
              { nombre: "medicoId", etiqueta: "Médico", tipo: "select" as const, obligatorio: true, opciones: medicos },
              { nombre: "citaId", etiqueta: "Cita", tipo: "oculto" as const },
            ]),
        { nombre: "fecha", etiqueta: "Fecha y hora", tipo: "fechaHora", obligatorio: true },
        { nombre: "motivo", etiqueta: "Motivo de consulta", tipo: "area", obligatorio: true },
      ],
    },
    {
      titulo: "Signos vitales",
      campos: SIGNOS.map((s) => ({ ...s, tipo: "numero" as const })),
    },
    {
      titulo: "Evaluación",
      campos: [
        { nombre: "examenFisico", etiqueta: "Examen físico", tipo: "area", ayuda: "Hallazgos por sistemas…" },
        { nombre: "enfermedadId", etiqueta: "Diagnóstico CIE-10", tipo: "select", opciones: enfermedades, vacio: "Sin código", ancho: true },
        { nombre: "diagnostico", etiqueta: "Diagnóstico (descripción)", tipo: "area" },
        { nombre: "plan", etiqueta: "Plan e indicaciones", tipo: "area", ayuda: "Tratamiento, exámenes solicitados, control…" },
      ],
    },
  ];
}

export function valoresConsulta(c: Consulta): Valores {
  return {
    fecha: fechaHoraInput(c.fecha),
    motivo: c.motivo,
    examenFisico: c.examenFisico ?? "",
    enfermedadId: c.enfermedadId ?? "",
    diagnostico: c.diagnostico ?? "",
    plan: c.plan ?? "",
    ...Object.fromEntries(
      SIGNOS.map((s) => {
        const v = c[s.nombre];
        return [s.nombre, v === null ? "" : String(v).replace(".", ",")];
      }),
    ),
  };
}
