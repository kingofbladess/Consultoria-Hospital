import { rutasElemento } from "@/lib/api";
import { recursoPlantillas } from "@/lib/recursos";

export const { GET, PATCH, DELETE } = rutasElemento(recursoPlantillas);
