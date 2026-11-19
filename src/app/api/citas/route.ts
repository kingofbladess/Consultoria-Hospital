import { rutasColeccion } from "@/lib/api";
import { recursoCitas } from "@/lib/recursos";

export const { GET, POST } = rutasColeccion(recursoCitas);
