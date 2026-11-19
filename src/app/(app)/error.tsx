"use client";

import Link from "next/link";
import { useEffect } from "react";
import Icono from "@/components/Icono";

// Si una pantalla falla (por ejemplo, la base de datos no responde), se explica y se ofrece reintentar
// sin perder el marco ni la sesión.
export default function ErrorPantalla({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => console.error(error), [error]);
  return (
    <div className="vacio error-pantalla" role="alert">
      <p className="text-caption">Algo no salió bien</p>
      <h1>No se pudo mostrar esta pantalla</h1>
      <p>
        Puede ser que la base de datos no esté respondiendo. Intente de nuevo en unos segundos; si se repite, avise a administración
        {error.digest ? ` con el código ${error.digest}` : ""}.
      </p>
      <div className="acciones">
        <button type="button" className="boton primario" onClick={reset}>
          <Icono nombre="repetir" />
          Reintentar
        </button>
        <Link href="/" className="boton">
          Ir al panel
        </Link>
      </div>
    </div>
  );
}
