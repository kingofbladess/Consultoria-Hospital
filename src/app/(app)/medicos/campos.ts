import type { Opcion, Seccion, Valores } from "@/components/Formulario";
import type { Especialidad, Medico, Personal } from "@prisma/client";
import { camposMilitares } from "@/lib/marca/campos";

export function camposMedico(especialidades: Opcion[], edicion = false): Seccion[] {
  return [
    {
      titulo: "Datos personales",
      campos: [
        { nombre: "personal.nombres", etiqueta: "Nombres", obligatorio: true },
        { nombre: "personal.apellidos", etiqueta: "Apellidos", obligatorio: true },
        { nombre: "personal.cedula", etiqueta: "Cédula", obligatorio: true, ayuda: "V-12345678" },
        { nombre: "personal.telefono", etiqueta: "Teléfono", tipo: "tel", ayuda: "0414-1234567" },
        { nombre: "personal.email", etiqueta: "Correo electrónico", tipo: "email" },
        { nombre: "personal.cargo", etiqueta: "Cargo", ayuda: "Médico adjunto" },
        // Un médico nuevo siempre empieza activo; al editar se puede desactivar.
        ...(edicion
          ? [{ nombre: "personal.activo", etiqueta: "Activo (aparece al agendar citas)", tipo: "casilla" as const, ancho: true }]
          : []),
      ],
    },
    {
      titulo: "Afiliación militar",
      campos: camposMilitares("personal."),
    },
    {
      titulo: "Datos profesionales",
      campos: [
        { nombre: "numeroMpps", etiqueta: "Número MPPS", obligatorio: true },
        { nombre: "numeroColegio", etiqueta: "COL (Colegio de Médicos)" },
        { nombre: "especialidadIds", etiqueta: "Especialidades", tipo: "varios", opciones: especialidades },
      ],
    },
    {
      titulo: "Identidad en el récipe",
      campos: [
        { nombre: "logoUrl", etiqueta: "Logo", tipo: "imagen", ayuda: "PNG o JPG, máximo 2 MB." },
        { nombre: "firmaUrl", etiqueta: "Firma", tipo: "imagen", ayuda: "Firma en papel blanco, fotografiada de cerca." },
        { nombre: "selloUrl", etiqueta: "Sello", tipo: "imagen", ayuda: "PNG con fondo transparente queda mejor." },
      ],
    },
  ];
}

export function valoresMedico(m: Medico & { personal: Personal; especialidades: Especialidad[] }): Valores {
  return {
    "personal.nombres": m.personal.nombres,
    "personal.apellidos": m.personal.apellidos,
    "personal.cedula": m.personal.cedula,
    "personal.telefono": m.personal.telefono ?? "",
    "personal.email": m.personal.email ?? "",
    "personal.cargo": m.personal.cargo,
    "personal.activo": m.personal.activo,
    "personal.componente": m.personal.componente ?? "",
    "personal.grado": m.personal.grado ?? "",
    numeroMpps: m.numeroMpps,
    numeroColegio: m.numeroColegio ?? "",
    especialidadIds: m.especialidades.map((e) => e.id),
    logoUrl: m.logoUrl ?? "",
    firmaUrl: m.firmaUrl ?? "",
    selloUrl: m.selloUrl ?? "",
  };
}

export const MENSAJE_DUPLICADO = "Ya hay un médico o miembro del personal con esa cédula o ese número MPPS.";
