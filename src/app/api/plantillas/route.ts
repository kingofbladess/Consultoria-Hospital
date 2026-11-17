import { rutasColeccion } from "@/lib/api";
import { recursoPlantillas } from "@/lib/recursos";

export const { GET, POST } = rutasColeccion(recursoPlantillas);
