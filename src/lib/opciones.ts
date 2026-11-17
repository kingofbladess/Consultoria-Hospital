import type { Opcion } from "@/components/Formulario";
import { conGrado } from "./marca/grados";
import { prisma } from "./prisma";

// Listas de opciones para los selects de los formularios.

export async function opcionesPacientes(): Promise<Opcion[]> {
  const pacientes = await prisma.paciente.findMany({
    orderBy: [{ apellidos: "asc" }, { nombres: "asc" }],
    select: { id: true, nombres: true, apellidos: true, cedula: true },
    take: 1000,
  });
  return pacientes.map((p) => ({
    valor: p.id,
    etiqueta: `${p.apellidos}, ${p.nombres}${p.cedula ? ` · ${p.cedula}` : ""}`,
  }));
}

export async function opcionesMedicos(): Promise<Opcion[]> {
  const medicos = await prisma.medico.findMany({
    where: { personal: { activo: true } },
    orderBy: { personal: { apellidos: "asc" } },
    include: { personal: true, especialidades: true },
  });
  return medicos.map((m) => ({
    valor: m.id,
    etiqueta: `${conGrado(`${m.personal.nombres} ${m.personal.apellidos}`, m.personal.grado)}${
      m.especialidades.length ? ` · ${m.especialidades.map((e) => e.nombre).join(", ")}` : ""
    }`,
  }));
}

export async function opcionesConsultorios(): Promise<Opcion[]> {
  const consultorios = await prisma.consultorio.findMany({ where: { activo: true }, orderBy: { nombre: "asc" } });
  return consultorios.map((c) => ({ valor: c.id, etiqueta: c.piso ? `${c.nombre} · Piso ${c.piso}` : c.nombre }));
}

export async function opcionesEspecialidades(): Promise<Opcion[]> {
  const especialidades = await prisma.especialidad.findMany({ orderBy: { nombre: "asc" } });
  return especialidades.map((e) => ({ valor: e.id, etiqueta: e.nombre }));
}

export async function opcionesEnfermedades(): Promise<Opcion[]> {
  const enfermedades = await prisma.enfermedad.findMany({ orderBy: { codigoCie10: "asc" } });
  return enfermedades.map((e) => ({ valor: e.id, etiqueta: `${e.codigoCie10} · ${e.nombre}` }));
}

/** Personas de la plantilla, para vincularlas a un usuario. */
export async function opcionesPersonal(): Promise<Opcion[]> {
  const personal = await prisma.personal.findMany({
    orderBy: [{ apellidos: "asc" }, { nombres: "asc" }],
    include: { medico: true },
  });
  return personal.map((p) => ({
    valor: p.id,
    etiqueta: `${conGrado(`${p.apellidos}, ${p.nombres}`, p.grado)} · ${p.medico ? "Médico" : p.cargo}`,
  }));
}
