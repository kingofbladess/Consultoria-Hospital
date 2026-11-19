import { rutasColeccion } from "@/lib/api";
import { recursoHorarios } from "@/lib/recursos";

export const { GET, POST } = rutasColeccion(recursoHorarios);
