import type { ViaAdministracion } from "@prisma/client";

/** Medicamento tal como lo entrega una API externa, ya normalizado al formato del sistema. */
export type MedicamentoExterno = {
  codigoExterno: string;
  principioActivo: string;
  nombreComercial?: string | null;
  presentacion: string;
  concentracion?: string | null;
  via?: ViaAdministracion;
  laboratorio?: string | null;
  requiereRecipeEspecial?: boolean;
};

/**
 * Contrato que cumple cada API de medicamentos.
 * Para conectar una API nueva, cree un archivo en esta carpeta que implemente
 * esta interfaz y regístrelo en index.ts.
 */
export interface ProveedorMedicamentos {
  /** Nombre corto que se guarda en el campo `fuente` del medicamento. */
  nombre: string;
  buscar(texto: string, limite: number): Promise<MedicamentoExterno[]>;
}
