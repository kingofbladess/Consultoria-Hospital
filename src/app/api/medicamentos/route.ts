import { rutasColeccion } from "@/lib/api";
import { recursoMedicamentos } from "@/lib/recursos";

export const { GET, POST } = rutasColeccion(recursoMedicamentos);
