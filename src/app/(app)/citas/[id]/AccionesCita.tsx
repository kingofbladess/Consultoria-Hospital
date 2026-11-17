"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { EstadoCita } from "@/lib/formato";

// Cambios de estado posibles desde cada estado.
const SIGUIENTES: Record<EstadoCita, { estado: EstadoCita; texto: string; peligro?: boolean }[]> = {
  PENDIENTE: [
    { estado: "CONFIRMADA", texto: "Confirmar cita" },
    { estado: "NO_ASISTIO", texto: "Marcar que no asistió" },
    { estado: "CANCELADA", texto: "Cancelar cita", peligro: true },
  ],
  CONFIRMADA: [
    { estado: "ATENDIDA", texto: "Marcar como atendida" },
    { estado: "NO_ASISTIO", texto: "Marcar que no asistió" },
    { estado: "CANCELADA", texto: "Cancelar cita", peligro: true },
  ],
  ATENDIDA: [],
  CANCELADA: [{ estado: "PENDIENTE", texto: "Reactivar cita" }],
  NO_ASISTIO: [{ estado: "PENDIENTE", texto: "Reactivar cita" }],
};

export default function AccionesCita({ id, estado }: { id: string; estado: EstadoCita }) {
  const router = useRouter();
  const [enviando, setEnviando] = useState<EstadoCita | null>(null);
  const [error, setError] = useState("");

  async function cambiar(nuevo: EstadoCita) {
    setEnviando(nuevo);
    setError("");
    try {
      const respuesta = await fetch(`/api/citas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevo }),
      });
      if (!respuesta.ok) throw new Error();
      router.refresh();
    } catch {
      setError("No se pudo cambiar el estado. Intente de nuevo.");
    } finally {
      setEnviando(null);
    }
  }

  const opciones = SIGUIENTES[estado];
  if (opciones.length === 0) return null;

  return (
    <div className="acciones">
      {opciones.map((o) => (
        <button
          key={o.estado}
          type="button"
          className={`boton ${o.peligro ? "peligro" : ""}`}
          disabled={enviando !== null}
          onClick={() => cambiar(o.estado)}
        >
          {enviando === o.estado ? "Guardando…" : o.texto}
        </button>
      ))}
      {error && <span className="error-campo">{error}</span>}
    </div>
  );
}
