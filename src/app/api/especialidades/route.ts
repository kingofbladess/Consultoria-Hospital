import { rutasColeccion } from "@/lib/api";
import { recursoEspecialidades } from "@/lib/recursos";

export const { GET, POST } = rutasColeccion(recursoEspecialidades);
