import { rutasElemento } from "@/lib/api";
import { recursoEspecialidades } from "@/lib/recursos";

export const { GET, PATCH, DELETE } = rutasElemento(recursoEspecialidades);
