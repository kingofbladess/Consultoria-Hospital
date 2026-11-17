import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { registrar, sesionDePeticion } from "./auditoria";
import { idsPorTexto } from "./busqueda";
import { prisma } from "./prisma";

type Datos = Record<string, unknown>;

/** Operaciones de Prisma que usa el CRUD genérico. */
type Delegado = {
  findMany(args: unknown): Promise<unknown[]>;
  count(args: unknown): Promise<number>;
  findUnique(args: unknown): Promise<unknown>;
  create(args: unknown): Promise<unknown>;
  update(args: unknown): Promise<unknown>;
  delete(args: unknown): Promise<unknown>;
};

export type ConfigRecurso = {
  /** Nombre del modelo en el cliente de Prisma, por ejemplo "paciente". */
  modelo: keyof typeof prisma & string;
  crear: ZodType<Datos>;
  actualizar: ZodType<Datos>;
  /** Campos de texto donde busca el parámetro `q` (sin distinguir acentos ni mayúsculas). */
  camposBusqueda?: string[];
  include?: Datos;
  orderBy?: Datos | Datos[];
  /** Convierte los datos validados al formato de Prisma (por ejemplo, relaciones). */
  aCrear?: (datos: Datos) => Datos;
  aActualizar?: (datos: Datos) => Datos;
  /** Regla de negocio antes de guardar (por ejemplo, choques de horario). Lanza ErrorNegocio si no se cumple. */
  validar?: (datos: Datos, id?: string) => Promise<void>;
};

/** Error de una regla del negocio: se responde 409 con el mensaje tal cual al usuario. */
export class ErrorNegocio extends Error {}

type ContextoId = { params: Promise<{ id: string }> };

export function respuestaError(error: unknown) {
  if (error instanceof ErrorNegocio) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }
  if (error instanceof ZodError) {
    return NextResponse.json({ error: "Datos inválidos", detalles: error.flatten().fieldErrors }, { status: 400 });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002")
      return NextResponse.json({ error: "Ya existe un registro con esos datos", campos: error.meta?.target }, { status: 409 });
    if (error.code === "P2025") return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 });
    if (error.code === "P2003")
      return NextResponse.json(
        { error: "No se puede completar: hay otros registros que dependen de este o que no existen." },
        { status: 409 },
      );
  }
  if (error instanceof SyntaxError) {
    return NextResponse.json({ error: "El cuerpo no es JSON válido" }, { status: 400 });
  }
  console.error(error);
  return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
}

function delegado(config: ConfigRecurso): Delegado {
  return prisma[config.modelo] as unknown as Delegado;
}

const idDe = (registro: unknown) => (registro as { id?: string })?.id ?? null;

/** Crea los manejadores GET (lista) y POST de /api/<recurso>. */
export function rutasColeccion(config: ConfigRecurso) {
  async function GET(req: Request) {
    try {
      const url = new URL(req.url);
      const q = url.searchParams.get("q")?.trim();
      const pagina = Math.max(1, Number(url.searchParams.get("pagina")) || 1);
      const porPagina = Math.min(100, Math.max(1, Number(url.searchParams.get("porPagina")) || 20));

      const where = q && config.camposBusqueda?.length ? { id: { in: await idsPorTexto(config.modelo, config.camposBusqueda, q) } } : {};

      const [datos, total] = await Promise.all([
        delegado(config).findMany({ where, include: config.include, orderBy: config.orderBy, skip: (pagina - 1) * porPagina, take: porPagina }),
        delegado(config).count({ where }),
      ]);
      return NextResponse.json({ datos, total, pagina, porPagina });
    } catch (error) {
      return respuestaError(error);
    }
  }

  async function POST(req: Request) {
    try {
      const datos = config.crear.parse(await req.json());
      await config.validar?.(datos);
      const creado = await delegado(config).create({ data: config.aCrear ? config.aCrear(datos) : datos, include: config.include });
      await registrar(await sesionDePeticion(req), "CREAR", config.modelo, idDe(creado));
      return NextResponse.json(creado, { status: 201 });
    } catch (error) {
      return respuestaError(error);
    }
  }

  return { GET, POST };
}

/** Crea los manejadores GET, PATCH y DELETE de /api/<recurso>/<id>. */
export function rutasElemento(config: ConfigRecurso) {
  async function GET(_req: Request, { params }: ContextoId) {
    try {
      const { id } = await params;
      const registro = await delegado(config).findUnique({ where: { id }, include: config.include });
      if (!registro) return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 });
      return NextResponse.json(registro);
    } catch (error) {
      return respuestaError(error);
    }
  }

  async function PATCH(req: Request, { params }: ContextoId) {
    try {
      const { id } = await params;
      const datos = config.actualizar.parse(await req.json());
      await config.validar?.(datos, id);
      const actualizado = await delegado(config).update({
        where: { id },
        data: config.aActualizar ? config.aActualizar(datos) : datos,
        include: config.include,
      });
      await registrar(await sesionDePeticion(req), "ACTUALIZAR", config.modelo, id, Object.keys(datos).join(", "));
      return NextResponse.json(actualizado);
    } catch (error) {
      return respuestaError(error);
    }
  }

  async function DELETE(req: Request, { params }: ContextoId) {
    try {
      const { id } = await params;
      await delegado(config).delete({ where: { id } });
      await registrar(await sesionDePeticion(req), "ELIMINAR", config.modelo, id);
      return new NextResponse(null, { status: 204 });
    } catch (error) {
      return respuestaError(error);
    }
  }

  return { GET, PATCH, DELETE };
}
