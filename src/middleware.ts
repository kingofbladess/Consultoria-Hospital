import { NextResponse, type NextRequest } from "next/server";
import { puedeEscribir, puedeVerAdministracion, SOLO_ADMIN } from "@/lib/permisos";
import { COOKIE_SESION, inicioPorRol, verificarSesion } from "@/lib/sesion";

// Todo el sistema exige sesión, salvo la pantalla de ingreso y la API de autenticación.
const PUBLICAS = ["/login", "/api/auth/", "/api/salud"];

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const sesion = await verificarSesion(req.cookies.get(COOKIE_SESION)?.value);

  if (pathname === "/login" && sesion) {
    return NextResponse.redirect(new URL(inicioPorRol(sesion.rol), req.url));
  }
  if (PUBLICAS.some((p) => pathname === p || pathname.startsWith(p))) return NextResponse.next();

  if (!sesion) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Su sesión venció. Ingrese de nuevo." }, { status: 401 });
    }
    const login = new URL("/login", req.url);
    if (pathname !== "/") login.searchParams.set("siguiente", pathname + search);
    return NextResponse.redirect(login);
  }

  // Permisos por rol.
  const [, seccion, recurso, idRegistro] = pathname.split("/");
  if (seccion === "api") {
    const soloAdmin = (SOLO_ADMIN as readonly string[]).includes(recurso);
    const escribe = req.method !== "GET" && req.method !== "HEAD";
    if ((soloAdmin && !puedeVerAdministracion(sesion.rol)) || (escribe && !puedeEscribir(sesion.rol, recurso, req.method, { idRegistro, medicoId: sesion.medicoId ?? undefined }))) {
      return NextResponse.json({ error: "Su rol no permite hacer este cambio. Pida a administración que lo haga o que ajuste sus permisos." }, { status: 403 });
    }
  } else if ((SOLO_ADMIN as readonly string[]).includes(seccion) && !puedeVerAdministracion(sesion.rol)) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  return NextResponse.next();
}

export const config = {
  // Los artes institucionales (emblema, escudos, insignias) son públicos: el ingreso los muestra sin sesión.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons/|marca/).*)"],
};
