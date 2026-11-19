import { rutasColeccion } from "@/lib/api";
import { recursoRecetas } from "@/lib/recursos";

export const { GET, POST } = rutasColeccion(recursoRecetas);
