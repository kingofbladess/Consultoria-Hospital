"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function BotonEliminar({
  accion,
  nombre,
  volverA,
  bloqueado,
}: {
  /** Ruta DELETE de la API. */
  accion: string;
  /** Cómo se nombra el registro en la confirmación, por ejemplo "a María Pérez". */
  nombre: string;
  volverA: string;
  /** Si viene, el registro no se puede eliminar y se explica por qué. */
  bloqueado?: string;
}) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState("");

  async function eliminar() {
    setEliminando(true);
    setError("");
    try {
      const respuesta = await fetch(accion, { method: "DELETE" });
      if (respuesta.ok) {
        router.push(`${volverA}${volverA.includes("?") ? "&" : "?"}aviso=eliminado`);
        router.refresh();
        return;
      }
      const datos = await respuesta.json().catch(() => ({}));
      setError(
        respuesta.status === 409 || respuesta.status === 403
          ? (datos.error ?? "No se puede eliminar porque otros registros dependen de él.")
          : "No se pudo eliminar. Intente de nuevo en unos segundos.",
      );
    } catch {
      setError("No se pudo conectar con el servidor. Intente de nuevo.");
    } finally {
      setEliminando(false);
    }
  }

  if (bloqueado) {
    return (
      <button type="button" className="boton" disabled title={bloqueado}>
        Eliminar
      </button>
    );
  }

  if (!confirmando) {
    return (
      <button type="button" className="boton peligro" onClick={() => setConfirmando(true)}>
        Eliminar
      </button>
    );
  }

  return (
    <div className="confirmar" role="alertdialog" aria-label={`Eliminar ${nombre}`}>
      <span>¿Eliminar {nombre}? Esta acción no se puede deshacer.</span>
      <div className="acciones">
        <button type="button" className="boton peligro" onClick={eliminar} disabled={eliminando}>
          {eliminando ? "Eliminando…" : `Eliminar ${nombre}`}
        </button>
        <button type="button" className="boton" onClick={() => setConfirmando(false)} disabled={eliminando} autoFocus>
          Conservar
        </button>
      </div>
      {error && <span className="error-campo">{error}</span>}
    </div>
  );
}
