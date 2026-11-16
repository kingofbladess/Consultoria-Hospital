import { rutasElemento } from "@/lib/api";
import { recursoConsultorios } from "@/lib/recursos";

export const { GET, PATCH, DELETE } = rutasElemento(recursoConsultorios);
