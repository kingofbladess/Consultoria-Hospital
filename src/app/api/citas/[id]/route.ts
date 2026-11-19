import { rutasElemento } from "@/lib/api";
import { recursoCitas } from "@/lib/recursos";

export const { GET, PATCH, DELETE } = rutasElemento(recursoCitas);
