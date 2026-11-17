import { rutasElemento } from "@/lib/api";
import { recursoProtocolos } from "@/lib/recursos";

export const { GET, PATCH, DELETE } = rutasElemento(recursoProtocolos);
