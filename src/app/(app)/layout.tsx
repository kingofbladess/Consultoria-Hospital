import { redirect } from "next/navigation";
import Marco from "@/components/Marco";
import { nombreRol } from "@/lib/sesion";
import { sesionActual } from "@/lib/sesionServidor";

export default async function MarcoInterno({ children }: { children: React.ReactNode }) {
  const sesion = await sesionActual();
  if (!sesion) redirect("/login");

  return (
    <Marco nombre={sesion.nombre} rol={nombreRol[sesion.rol]} esAdmin={sesion.rol === "ADMIN"}>
      {children}
    </Marco>
  );
}
