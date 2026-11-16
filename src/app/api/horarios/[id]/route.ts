import { rutasElemento } from "@/lib/api";
import { recursoHorarios } from "@/lib/recursos";

export const { GET, PATCH, DELETE } = rutasElemento(recursoHorarios);
