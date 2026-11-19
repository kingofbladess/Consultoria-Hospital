import { rutasElemento } from "@/lib/api";
import { recursoPacientes } from "@/lib/recursos";

export const { GET, PATCH, DELETE } = rutasElemento(recursoPacientes);
