import type { Opcion, Seccion, Valores } from "@/components/Formulario";
import { estadosCita, fechaHoraInput } from "@/lib/formato";
import type { Cita } from "@prisma/client";

export type OpcionesCita = { pacientes: Opcion[]; medicos: Opcion[]; consultorios: Opcion[] };

export function camposCita({ pacientes, medicos, consultorios }: OpcionesCita, edicion = false): Seccion[] {
  return [
    {
      titulo: "Cita",
      campos: [
        { nombre: "pacienteId", etiqueta: "Paciente", tipo: "select", obligatorio: true, opciones: pacientes, ancho: true },
        { nombre: "medicoId", etiqueta: "Médico", tipo: "select", obligatorio: true, opciones: medicos },
        { nombre: "consultorioId", etiqueta: "Consultorio", tipo: "select", opciones: consultorios, vacio: "Sin asignar" },
        { nombre: "fechaHora", etiqueta: "Fecha y hora", tipo: "fechaHora", obligatorio: true },
        ...(edicion
          ? [
              {
                nombre: "estado",
                etiqueta: "Estado",
                tipo: "select" as const,
                obligatorio: true,
                opciones: Object.entries(estadosCita).map(([valor, e]) => ({ valor, etiqueta: e.etiqueta })),
              },
            ]
          : []),
        { nombre: "motivo", etiqueta: "Motivo", tipo: "area", ayuda: "Control, dolor de cabeza, resultados de laboratorio…" },
      ],
    },
  ];
}

export function valoresCita(c: Cita): Valores {
  return {
    pacienteId: c.pacienteId,
    medicoId: c.medicoId,
    consultorioId: c.consultorioId ?? "",
    fechaHora: fechaHoraInput(c.fechaHora),
    estado: c.estado,
    motivo: c.motivo ?? "",
  };
}
