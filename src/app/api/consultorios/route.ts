import { rutasColeccion } from "@/lib/api";
import { recursoConsultorios } from "@/lib/recursos";

export const { GET, POST } = rutasColeccion(recursoConsultorios);
