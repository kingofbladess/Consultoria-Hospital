import { rutasElemento } from "@/lib/api";
import { recursoEnfermedades } from "@/lib/recursos";

export const { GET, PATCH, DELETE } = rutasElemento(recursoEnfermedades);
