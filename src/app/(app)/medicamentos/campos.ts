import type { Opcion, Seccion, Valores } from "@/components/Formulario";
import { nombreVia } from "@/lib/formato";
import type { Enfermedad, Medicamento } from "@prisma/client";

const VIAS = Object.entries(nombreVia).map(([valor, etiqueta]) => ({ valor, etiqueta }));

export function camposMedicamento(enfermedades: Opcion[]): Seccion[] {
  return [
    {
      titulo: "Medicamento",
      campos: [
        { nombre: "principioActivo", etiqueta: "Principio activo", obligatorio: true, ayuda: "Losartán potásico" },
        { nombre: "nombreComercial", etiqueta: "Nombre comercial", ayuda: "Cozaar" },
        { nombre: "presentacion", etiqueta: "Presentación", obligatorio: true, ayuda: "Tabletas, jarabe, ampollas…" },
        { nombre: "concentracion", etiqueta: "Concentración", ayuda: "50 mg" },
        { nombre: "via", etiqueta: "Vía de administración", tipo: "select", obligatorio: true, opciones: VIAS },
        { nombre: "laboratorio", etiqueta: "Laboratorio" },
        {
          nombre: "requiereRecipeEspecial",
          etiqueta: "Requiere récipe especial (psicotrópicos y estupefacientes)",
          tipo: "casilla",
          ancho: true,
        },
      ],
    },
    {
      titulo: "Uso",
      campos: [{ nombre: "enfermedadIds", etiqueta: "Enfermedades que trata", tipo: "varios", opciones: enfermedades }],
    },
  ];
}

export function valoresMedicamento(m: Medicamento & { enfermedades: Enfermedad[] }): Valores {
  return {
    principioActivo: m.principioActivo,
    nombreComercial: m.nombreComercial ?? "",
    presentacion: m.presentacion,
    concentracion: m.concentracion ?? "",
    via: m.via,
    laboratorio: m.laboratorio ?? "",
    requiereRecipeEspecial: m.requiereRecipeEspecial,
    enfermedadIds: m.enfermedades.map((e) => e.id),
  };
}
