import type { Campo, Opcion } from "@/components/Formulario";
import { COMPONENTES, gradosDeComponente, nombreCategoria } from "./grados";

/** Campos de afiliación militar (componente → grado) para los formularios de paciente y de médico. */
export function camposMilitares(prefijo = ""): Campo[] {
  const opcionesPor: Record<string, Opcion[]> = Object.fromEntries(
    COMPONENTES.map((c) => [
      c.codigo,
      gradosDeComponente(c.codigo).map((g) => ({ valor: g.clave, etiqueta: g.nombre, grupo: nombreCategoria[g.categoria] })),
    ]),
  );
  return [
    {
      nombre: `${prefijo}componente`,
      etiqueta: "Componente de la FANB",
      tipo: "select",
      opciones: COMPONENTES.map((c) => ({ valor: c.codigo, etiqueta: c.nombre })),
      vacio: "No es personal militar",
    },
    {
      nombre: `${prefijo}grado`,
      etiqueta: "Grado",
      tipo: "select",
      dependeDe: `${prefijo}componente`,
      opcionesPor,
      vacio: "Sin grado",
    },
  ];
}
