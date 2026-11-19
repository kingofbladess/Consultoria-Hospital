import { rutasElemento } from "@/lib/api";
import { recursoPersonal } from "@/lib/recursos";

export const { GET, PATCH, DELETE } = rutasElemento(recursoPersonal);
