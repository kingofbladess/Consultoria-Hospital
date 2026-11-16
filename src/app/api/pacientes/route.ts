import { rutasColeccion } from "@/lib/api";
import { recursoPacientes } from "@/lib/recursos";

export const { GET, POST } = rutasColeccion(recursoPacientes);
