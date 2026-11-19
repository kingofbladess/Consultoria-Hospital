import type { NombreIcono } from "@/components/Icono";

// Módulos de la consola. Cada uno lleva un color institucional de acompañamiento (ver globals.css,
// «Colores de acompañamiento»): el oliva sigue siendo la marca y la acción principal.
export type ColorModulo = "oliva" | "naval" | "petroleo" | "vino" | "oro" | "ciruela";

export const MODULOS: { ruta: string; nombre: string; icono: NombreIcono; color: ColorModulo }[] = [
  { ruta: "/pacientes", nombre: "Pacientes", icono: "pacientes", color: "oliva" },
  { ruta: "/medicos", nombre: "Médicos", icono: "medicos", color: "naval" },
  { ruta: "/consultas", nombre: "Consultas", icono: "consultas", color: "petroleo" },
  { ruta: "/recetas", nombre: "Récipes", icono: "recetas", color: "vino" },
  { ruta: "/medicamentos", nombre: "Medicamentos", icono: "medicamentos", color: "oro" },
  { ruta: "/citas", nombre: "Citas", icono: "citas", color: "ciruela" },
];

/** Acciones rápidas con su atajo de teclado (Alt + número). */
export const ACCIONES: { ruta: string; nombre: string; icono: NombreIcono; tecla: string; color: ColorModulo }[] = [
  { ruta: "/pacientes/nuevo", nombre: "Registrar paciente", icono: "usuarioMas", tecla: "1", color: "oliva" },
  { ruta: "/citas/nuevo", nombre: "Agendar cita", icono: "calendarioMas", tecla: "2", color: "ciruela" },
  { ruta: "/consultas/nuevo", nombre: "Registrar consulta", icono: "consultas", tecla: "3", color: "petroleo" },
  { ruta: "/recetas/nuevo", nombre: "Crear récipe", icono: "recetas", tecla: "4", color: "vino" },
  { ruta: "/medicos/nuevo", nombre: "Registrar médico", icono: "medicos", tecla: "5", color: "naval" },
  { ruta: "/medicamentos/nuevo", nombre: "Agregar medicamento", icono: "medicamentos", tecla: "6", color: "oro" },
];

/** Color del módulo al que pertenece una ruta. */
export function colorDeRuta(ruta: string): ColorModulo {
  return MODULOS.find((m) => ruta === m.ruta || ruta.startsWith(`${m.ruta}/`))?.color ?? "oliva";
}
