import { rutasColeccion } from "@/lib/api";
import { recursoEnfermedades } from "@/lib/recursos";

export const { GET, POST } = rutasColeccion(recursoEnfermedades);
