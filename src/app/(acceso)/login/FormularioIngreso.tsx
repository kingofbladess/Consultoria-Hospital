"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Icono from "@/components/Icono";

export default function FormularioIngreso({ destino }: { destino?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [verClave, setVerClave] = useState(false);
  const [mayusculas, setMayusculas] = useState(false);
  const [estado, setEstado] = useState<"" | "enviando" | "listo">("");
  const [error, setError] = useState("");
  const [sacudir, setSacudir] = useState(0);

  async function ingresar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !clave) {
      setError("Escriba su usuario y su contraseña.");
      setSacudir((n) => n + 1);
      return;
    }
    setEstado("enviando");
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, clave }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(d.error ?? "No se pudo ingresar. Intente de nuevo.");
        setEstado("");
        setSacudir((n) => n + 1);
        return;
      }
      setEstado("listo");
      router.push(destino ?? d.destino ?? "/");
      router.refresh();
    } catch {
      setError("No hay conexión con el servidor. Verifique la red del centro e intente de nuevo.");
      setEstado("");
      setSacudir((n) => n + 1);
    }
  }

  const detectarMayusculas = (e: React.KeyboardEvent) => setMayusculas(e.getModifierState?.("CapsLock") ?? false);

  return (
    <form className="formulario-ingreso" onSubmit={ingresar} noValidate key={sacudir} data-sacudir={sacudir > 0 || undefined}>
      <div className="campo">
        <label htmlFor="email">Usuario o correo</label>
        <div className="entrada-con-icono">
          <Icono nombre="usuario" tamano={16} />
          <input
            id="email"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin"
            aria-invalid={!!error}
            autoFocus
          />
        </div>
      </div>

      <div className="campo">
        <label htmlFor="clave">Contraseña</label>
        <div className="entrada-con-icono">
          <Icono nombre="candado" tamano={16} />
          <input
            id="clave"
            type={verClave ? "text" : "password"}
            autoComplete="current-password"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            onKeyUp={detectarMayusculas}
            onKeyDown={detectarMayusculas}
            aria-invalid={!!error}
            aria-describedby={mayusculas ? "aviso-mayus" : undefined}
          />
          <button
            type="button"
            className="boton-icono ver-clave"
            onClick={() => setVerClave((v) => !v)}
            aria-label={verClave ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={verClave}
          >
            <Icono nombre={verClave ? "ojoCerrado" : "ojo"} tamano={16} />
          </button>
        </div>
        {mayusculas && (
          <span className="aviso-mayus" id="aviso-mayus">
            Las mayúsculas están activadas.
          </span>
        )}
      </div>

      {error && (
        <p className="error-ingreso" role="alert">
          {error}
        </p>
      )}

      <button type="submit" className="boton primario grande ingresar" disabled={estado !== ""}>
        {estado === "enviando" ? (
          <>
            <span className="girando" aria-hidden="true" /> Verificando…
          </>
        ) : estado === "listo" ? (
          <>
            <Icono nombre="check" /> Ingresando…
          </>
        ) : (
          <>
            Ingresar
          </>
        )}
      </button>
    </form>
  );
}
