"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Icono from "./Icono";

// Confirmación breve tras guardar o eliminar. La pantalla de destino recibe ?aviso=… y la muestra;
// el parámetro se quita de la dirección para que no reaparezca al recargar.

const MENSAJES: Record<string, { texto: string; tono: "exito" | "info" }> = {
  creado: { texto: "Registro creado.", tono: "exito" },
  guardado: { texto: "Cambios guardados.", tono: "exito" },
  eliminado: { texto: "Registro eliminado.", tono: "info" },
};

export default function Aviso() {
  const params = useSearchParams();
  const ruta = usePathname();
  const router = useRouter();
  const [mensaje, setMensaje] = useState<(typeof MENSAJES)[string] | null>(null);

  useEffect(() => {
    const clave = params.get("aviso");
    if (!clave || !MENSAJES[clave]) return;
    setMensaje(MENSAJES[clave]);
    const resto = new URLSearchParams(params);
    resto.delete("aviso");
    router.replace(resto.size ? `${ruta}?${resto}` : ruta, { scroll: false });
    const t = setTimeout(() => setMensaje(null), 4000);
    return () => clearTimeout(t);
  }, [params, ruta, router]);

  if (!mensaje) return null;
  return (
    <div className={`aviso-flotante ${mensaje.tono}`} role="status">
      <Icono nombre="check" />
      <span>{mensaje.texto}</span>
      <button type="button" className="boton-icono" onClick={() => setMensaje(null)} aria-label="Cerrar aviso">
        <Icono nombre="cerrar" />
      </button>
    </div>
  );
}
