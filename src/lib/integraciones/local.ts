import type { MedicamentoExterno, ProveedorMedicamentos } from "./tipos";

// Lista pequeña de ejemplo para probar la importación sin depender de una API externa.
const catalogo: MedicamentoExterno[] = [
  { codigoExterno: "LOC-001", principioActivo: "Paracetamol", presentacion: "Tabletas", concentracion: "500 mg", via: "ORAL" },
  { codigoExterno: "LOC-002", principioActivo: "Ibuprofeno", presentacion: "Tabletas", concentracion: "400 mg", via: "ORAL" },
  { codigoExterno: "LOC-003", principioActivo: "Amoxicilina", presentacion: "Cápsulas", concentracion: "500 mg", via: "ORAL" },
  { codigoExterno: "LOC-004", principioActivo: "Losartán potásico", presentacion: "Tabletas", concentracion: "50 mg", via: "ORAL" },
  { codigoExterno: "LOC-005", principioActivo: "Metformina", presentacion: "Tabletas", concentracion: "850 mg", via: "ORAL" },
  { codigoExterno: "LOC-006", principioActivo: "Omeprazol", presentacion: "Cápsulas", concentracion: "20 mg", via: "ORAL" },
  { codigoExterno: "LOC-007", principioActivo: "Salbutamol", presentacion: "Inhalador", concentracion: "100 mcg/dosis", via: "INHALATORIA" },
  { codigoExterno: "LOC-008", principioActivo: "Clonazepam", presentacion: "Tabletas", concentracion: "2 mg", via: "ORAL", requiereRecipeEspecial: true },
];

export const proveedorLocal: ProveedorMedicamentos = {
  nombre: "local",
  async buscar(texto, limite) {
    const t = texto.toLowerCase();
    return catalogo.filter((m) => m.principioActivo.toLowerCase().includes(t)).slice(0, limite);
  },
};
