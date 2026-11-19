import { rutasColeccion } from "@/lib/api";
import { recursoPersonal } from "@/lib/recursos";

export const { GET, POST } = rutasColeccion(recursoPersonal);
