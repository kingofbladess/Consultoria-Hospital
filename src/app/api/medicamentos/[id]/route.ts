import { rutasElemento } from "@/lib/api";
import { recursoMedicamentos } from "@/lib/recursos";

export const { GET, PATCH, DELETE } = rutasElemento(recursoMedicamentos);
