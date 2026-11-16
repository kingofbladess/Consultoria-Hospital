import { rutasColeccion } from "@/lib/api";
import { recursoMedicos } from "@/lib/recursos";

export const { GET, POST } = rutasColeccion(recursoMedicos);
