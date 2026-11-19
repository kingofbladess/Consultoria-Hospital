import { rutasColeccion } from "@/lib/api";
import { recursoConsultas } from "@/lib/recursos";

export const { GET, POST } = rutasColeccion(recursoConsultas);
