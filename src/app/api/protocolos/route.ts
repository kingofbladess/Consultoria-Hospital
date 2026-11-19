import { rutasColeccion } from "@/lib/api";
import { recursoProtocolos } from "@/lib/recursos";

export const { GET, POST } = rutasColeccion(recursoProtocolos);
