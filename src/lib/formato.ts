// Utilidades de presentación compartidas por las pantallas.

/** Zona horaria del centro de salud. Venezuela usa UTC-4 todo el año. */
export const ZONA = "America/Caracas";
export const DESFASE = "-04:00";

/**
 * Las fechas sin hora (como la de nacimiento) se guardan a medianoche UTC.
 * Se formatean en UTC para que no se corran un día.
 */
export function fechaCorta(fecha: Date | string): string {
  return new Date(fecha).toLocaleDateString("es-VE", { timeZone: "UTC", day: "2-digit", month: "2-digit", year: "numeric" });
}

/** Día de un instante (récipe emitido, último ingreso) en la hora local del centro: dd/mm/aaaa. */
export function fechaDia(fecha: Date | string): string {
  return new Date(fecha).toLocaleDateString("es-VE", { timeZone: ZONA, day: "2-digit", month: "2-digit", year: "numeric" });
}

/** Fecha y hora de un evento (cita, consulta) en la hora local del centro. */
export function fechaHora(fecha: Date | string): string {
  return new Date(fecha).toLocaleString("es-VE", {
    timeZone: ZONA,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function hora(fecha: Date | string): string {
  return new Date(fecha).toLocaleTimeString("es-VE", { timeZone: ZONA, hour: "2-digit", minute: "2-digit" });
}

/** "martes, 17 de noviembre de 2026" en la hora local del centro. */
export function fechaLarga(fecha: Date | string): string {
  return new Date(fecha).toLocaleDateString("es-VE", {
    timeZone: ZONA,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Devuelve "AAAA-MM-DD" para un <input type="date"> (fechas sin hora, guardadas en UTC). */
export function fechaInput(fecha: Date | string): string {
  return new Date(fecha).toISOString().slice(0, 10);
}

/** Devuelve "AAAA-MM-DDTHH:MM" en hora local del centro, para un <input type="datetime-local">. */
export function fechaHoraInput(fecha: Date | string): string {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: ZONA,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date(fecha))
      .map((p) => [p.type, p.value]),
  );
  return `${partes.year}-${partes.month}-${partes.day}T${partes.hour}:${partes.minute}`;
}

/** Día "AAAA-MM-DD" en hora local del centro. */
export function diaLocal(fecha: Date | string = new Date()): string {
  return fechaHoraInput(fecha).slice(0, 10);
}

/** Inicio del día "AAAA-MM-DD" en hora local del centro. */
export function inicioDia(dia: string): Date {
  return new Date(`${dia}T00:00:00${DESFASE}`);
}

export function edad(fechaNacimiento: Date | string, hoy = new Date()): number {
  const n = new Date(fechaNacimiento);
  let anios = hoy.getUTCFullYear() - n.getUTCFullYear();
  const mes = hoy.getUTCMonth() - n.getUTCMonth();
  if (mes < 0 || (mes === 0 && hoy.getUTCDate() < n.getUTCDate())) anios--;
  return anios;
}

export function nombreCompleto(p: { nombres: string; apellidos: string }): string {
  return `${p.nombres} ${p.apellidos}`;
}

type MedicamentoBasico = {
  principioActivo: string;
  concentracion: string | null;
  nombreComercial: string | null;
  presentacion: string;
};

/** "Losartán potásico 50 mg (Cozaar, Tabletas)" */
export function nombreMedicamento(m: MedicamentoBasico): string {
  const base = [m.principioActivo, m.concentracion].filter(Boolean).join(" ");
  const extra = [m.nombreComercial, m.presentacion].filter(Boolean).join(", ");
  return extra ? `${base} (${extra})` : base;
}

/** Nombre de un item de récipe: el del vademécum o el texto libre que escribió el médico. */
export function nombreItem(item: { descripcion: string | null; medicamento: MedicamentoBasico | null }): string {
  return item.medicamento ? nombreMedicamento(item.medicamento) : (item.descripcion ?? "");
}

/** "1 tableta cada 8 horas durante 7 días." */
export function posologia(item: { dosis: string; frecuencia: string; duracion: string }): string {
  const duracion = /^\d/.test(item.duracion) ? `durante ${item.duracion}` : item.duracion;
  return `${item.dosis} ${item.frecuencia}, ${duracion}.`;
}

/** Convierte un teléfono venezolano (0414-1234567) al formato internacional de WhatsApp (584141234567). */
export function telefonoWhatsapp(telefono: string | null | undefined): string {
  const digitos = (telefono ?? "").replace(/\D/g, "");
  if (digitos.startsWith("58")) return digitos;
  if (digitos.startsWith("0")) return `58${digitos.slice(1)}`;
  if (digitos.length === 10) return `58${digitos}`;
  return digitos;
}

export const nombreSexo: Record<string, string> = {
  FEMENINO: "Femenino",
  MASCULINO: "Masculino",
};

export const estadosCita = {
  PENDIENTE: { etiqueta: "Pendiente", tono: "neutro" },
  CONFIRMADA: { etiqueta: "Confirmada", tono: "info" },
  ATENDIDA: { etiqueta: "Atendida", tono: "exito" },
  CANCELADA: { etiqueta: "Cancelada", tono: "apagado" },
  NO_ASISTIO: { etiqueta: "No asistió", tono: "alerta" },
} as const;

export type EstadoCita = keyof typeof estadosCita;

export const nombreVia: Record<string, string> = {
  ORAL: "Oral",
  SUBLINGUAL: "Sublingual",
  TOPICA: "Tópica",
  INTRAVENOSA: "Intravenosa",
  INTRAMUSCULAR: "Intramuscular",
  SUBCUTANEA: "Subcutánea",
  INHALATORIA: "Inhalatoria",
  OFTALMICA: "Oftálmica",
  OTICA: "Ótica",
  NASAL: "Nasal",
  RECTAL: "Rectal",
  VAGINAL: "Vaginal",
  OTRA: "Otra",
};
