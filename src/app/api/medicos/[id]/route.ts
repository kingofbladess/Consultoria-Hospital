import { rutasElemento } from "@/lib/api";
import { recursoMedicos } from "@/lib/recursos";

export const { GET, PATCH, DELETE } = rutasElemento(recursoMedicos);
