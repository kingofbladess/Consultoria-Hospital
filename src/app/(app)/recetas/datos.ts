import type { Medicamento } from "@prisma/client";
import { edad, nombreMedicamento } from "@/lib/formato";
import { opcionesEnfermedades, opcionesMedicos, opcionesPacientes } from "@/lib/opciones";
import { prisma } from "@/lib/prisma";
import type { FichaPaciente, ItemReceta, PlantillaOpcion, ProtocoloOpcion } from "./FormularioReceta";

type ItemGuardado = {
  medicamentoId: string | null;
  medicamento: Medicamento | null;
  descripcion: string | null;
  cantidad: string | null;
  dosis: string;
  frecuencia: string;
  duracion: string;
  indicaciones: string | null;
  dosisMgKg?: number | null;
  dosisMaxMg?: number | null;
  mgPorMl?: number | null;
};

/** Convierte los items guardados (récipe, plantilla o protocolo) al formato del formulario. */
export function itemsAFormulario(items: ItemGuardado[]): ItemReceta[] {
  return items.map((i) => ({
    medicamentoId: i.medicamentoId ?? "",
    nombre: i.medicamento ? nombreMedicamento(i.medicamento) : (i.descripcion ?? ""),
    cantidad: i.cantidad ?? "",
    dosis: i.dosis,
    frecuencia: i.frecuencia,
    duracion: i.duracion,
    indicaciones: i.indicaciones ?? "",
    ...(i.dosisMgKg ? { regla: { dosisMgKg: i.dosisMgKg, dosisMaxMg: i.dosisMaxMg ?? null, mgPorMl: i.mgPorMl ?? null } } : {}),
  }));
}

const conItems = { items: { include: { medicamento: true }, orderBy: { orden: "asc" as const } } };

/** Todo lo que necesita el formulario de récipe: pacientes, médicos, vademécum, plantillas y protocolos. */
export async function cargarOpcionesReceta() {
  const [pacientes, fichas, pesos, medicos, enfermedades, medicamentos, plantillas, protocolos] = await Promise.all([
    opcionesPacientes(),
    prisma.paciente.findMany({ select: { id: true, fechaNacimiento: true, alergias: true }, take: 1000 }),
    // Último peso anotado en consulta de cada paciente (para la dosis pediátrica).
    prisma.consulta.findMany({
      where: { pesoKg: { not: null } },
      orderBy: { fecha: "desc" },
      distinct: ["pacienteId"],
      select: { pacienteId: true, pesoKg: true, fecha: true },
    }),
    opcionesMedicos(),
    opcionesEnfermedades(),
    prisma.medicamento.findMany({ orderBy: [{ principioActivo: "asc" }, { concentracion: "asc" }], take: 3000 }),
    prisma.plantillaReceta.findMany({ orderBy: { nombre: "asc" }, include: conItems }),
    prisma.protocolo.findMany({ include: { ...conItems, enfermedad: true } }),
  ]);
  return {
    pacientes,
    // Edad y alergias de cada paciente: deciden el protocolo y las advertencias.
    fichas: Object.fromEntries(
      fichas.map((p): [string, FichaPaciente] => {
        const peso = pesos.find((x) => x.pacienteId === p.id);
        return [p.id, { edad: edad(p.fechaNacimiento), alergias: p.alergias, peso: peso?.pesoKg ?? null, pesoFecha: peso ? peso.fecha.toLocaleDateString("es-VE", { timeZone: "America/Caracas" }) : null }];
      }),
    ),
    medicos,
    enfermedades,
    medicamentos: medicamentos.map((m) => ({ valor: m.id, etiqueta: nombreMedicamento(m) })),
    plantillas: plantillas.map(
      (p): PlantillaOpcion => ({
        id: p.id,
        nombre: p.nombre,
        medicoId: p.medicoId,
        indicacionesGenerales: p.indicacionesGenerales ?? "",
        items: itemsAFormulario(p.items),
      }),
    ),
    protocolos: protocolos.map(
      (p): ProtocoloOpcion => ({
        id: p.id,
        enfermedadId: p.enfermedadId,
        enfermedad: `${p.enfermedad.codigoCie10} · ${p.enfermedad.nombre}`,
        grupo: p.grupo,
        indicacionesGenerales: p.indicacionesGenerales ?? "",
        notas: p.notas ?? "",
        items: itemsAFormulario(p.items),
      }),
    ),
  };
}
