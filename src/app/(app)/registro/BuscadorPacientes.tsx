"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Icono from "@/components/Icono";

type Paciente = { id: string; nombres: string; apellidos: string; cedula: string | null; telefono: string | null };

/** Búsqueda inmediata por cédula o nombre: el primer paso de casi todo registro en recepción. */
export default function BuscadorPacientes() {
  const [q, setQ] = useState("");
  const [resultados, setResultados] = useState<Paciente[] | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const entrada = useRef<HTMLInputElement>(null);

  // La tecla "/" lleva el foco al buscador, como en los sistemas de escritorio.
  useEffect(() => {
    function tecla(e: KeyboardEvent) {
      const escribiendo = ["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement).tagName);
      if (e.key === "/" && !escribiendo) {
        e.preventDefault();
        entrada.current?.focus();
      }
    }
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, []);

  useEffect(() => {
    const texto = q.trim();
    if (texto.length < 2) {
      setResultados(null);
      setError("");
      return;
    }
    setCargando(true);
    const control = new AbortController();
    const espera = setTimeout(async () => {
      try {
        const r = await fetch(`/api/pacientes?q=${encodeURIComponent(texto)}&porPagina=6`, { signal: control.signal });
        if (!r.ok) throw new Error();
        setResultados((await r.json()).datos);
        setError("");
      } catch (e) {
        if ((e as Error).name !== "AbortError") setError("No se pudo buscar. Verifique la conexión e intente de nuevo.");
      } finally {
        setCargando(false);
      }
    }, 200);
    return () => {
      clearTimeout(espera);
      control.abort();
    };
  }, [q]);

  const pareceCedula = /\d{5,}/.test(q);
  const nuevo = `/pacientes/nuevo?${pareceCedula ? `cedula=${encodeURIComponent(q.trim())}` : `nombre=${encodeURIComponent(q.trim())}`}`;

  return (
    <section className="glass-panel glass-strong buscador-recepcion" aria-labelledby="titulo-buscador">
      <label htmlFor="buscar-paciente" id="titulo-buscador" className="buscador-etiqueta">
        ¿Quién llegó? Busque por cédula o nombre
      </label>
      <div className="buscador-caja">
        <Icono nombre="buscar" tamano={18} />
        <input
          ref={entrada}
          id="buscar-paciente"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="V-12345678 o María Pérez"
          autoComplete="off"
          autoFocus
        />
        {cargando ? <span className="girando" aria-label="Buscando" /> : <kbd>/</kbd>}
      </div>

      <div aria-live="polite">
        {error && <p className="error-campo">{error}</p>}
        {resultados && resultados.length === 0 && !error && (
          <div className="sin-resultados">
            <span>No hay ningún paciente con «{q.trim()}».</span>
            <Link href={nuevo} className="boton primario">
              <Icono nombre="usuarioMas" tamano={18} />
              Registrarlo ahora
            </Link>
          </div>
        )}
        {resultados && resultados.length > 0 && (
          <ul className="resultados-pacientes">
            {resultados.map((p, i) => (
              <li key={p.id} className="glass-row">
                <Link href={`/pacientes/${p.id}`} className="resultado-nombre">
                  <span className="iniciales" aria-hidden="true">
                    {p.nombres[0]}
                    {p.apellidos[0]}
                  </span>
                  <span>
                    <strong>
                      {p.apellidos}, {p.nombres}
                    </strong>
                    <small>
                      {p.cedula ?? "Sin cédula"}
                      {p.telefono && ` · ${p.telefono}`}
                    </small>
                  </span>
                </Link>
                <div className="acciones">
                  <Link href={`/citas/nuevo?pacienteId=${p.id}`} className="boton chico">
                    <Icono nombre="calendarioMas" />
                    Cita
                  </Link>
                  <Link href={`/consultas/nuevo?pacienteId=${p.id}`} className="boton chico">
                    <Icono nombre="consultas" />
                    Consulta
                  </Link>
                  <Link href={`/recetas/nuevo?pacienteId=${p.id}`} className="boton chico">
                    <Icono nombre="recetas" />
                    Récipe
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
