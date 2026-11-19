import { rutasElemento } from "@/lib/api";
import { recursoRecetas } from "@/lib/recursos";

export const { GET, PATCH, DELETE } = rutasElemento(recursoRecetas);
