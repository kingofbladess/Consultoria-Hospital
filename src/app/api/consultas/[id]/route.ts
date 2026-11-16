import { rutasElemento } from "@/lib/api";
import { recursoConsultas } from "@/lib/recursos";

export const { GET, PATCH, DELETE } = rutasElemento(recursoConsultas);
