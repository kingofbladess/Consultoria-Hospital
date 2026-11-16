import { proveedorLocal } from "./local";
import type { ProveedorMedicamentos } from "./tipos";

export type { MedicamentoExterno, ProveedorMedicamentos } from "./tipos";

// Registro de APIs de medicamentos disponibles. Agregue aquí cada adaptador nuevo.
const proveedores: Record<string, ProveedorMedicamentos> = {
  local: proveedorLocal,
};

/** Devuelve el proveedor indicado en la variable PROVEEDOR_MEDICAMENTOS (por defecto "local"). */
export function obtenerProveedorMedicamentos(): ProveedorMedicamentos {
  const nombre = process.env.PROVEEDOR_MEDICAMENTOS ?? "local";
  const proveedor = proveedores[nombre];
  if (!proveedor) throw new Error(`Proveedor de medicamentos desconocido: ${nombre}`);
  return proveedor;
}
