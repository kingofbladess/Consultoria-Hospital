# Consultoría Hospital

Sistema para digitalizar la gestión de un hospital o clínica: plantilla de personal, médicos con firma y sello, especialidades, consultorios, pacientes, citas, historia clínica, récipes y vademécum farmacéutico.

El diseño completo está en [docs/DISENO.md](docs/DISENO.md).

## Tecnología

- Next.js 15 con TypeScript (pantallas y API REST)
- PostgreSQL con Prisma ORM
- Zod para validar los datos de la API

## Cómo ponerlo en marcha

Requisitos: Node.js 20 o superior y una base de datos PostgreSQL.

```bash
npm install
cp .env.example .env          # y edite DATABASE_URL con los datos de su base
npm run db:migrate            # crea las tablas
npm run db:seed               # carga especialidades, enfermedades y medicamentos de ejemplo
npm run dev                   # abre http://localhost:3000
```

Para revisar si todo responde: `GET http://localhost:3000/api/salud`.

### Sin PostgreSQL instalado

Prisma trae una base PostgreSQL local para desarrollo que no requiere instalar nada:

```bash
npx prisma dev -n hospital --detach   # muestra la URL "TCP" postgres://...; póngala en DATABASE_URL con &connection_limit=1&pgbouncer=true
npx prisma migrate deploy
npm run db:seed
```

Después de reiniciar la PC, vuelva a encenderla con `npx prisma dev -n hospital --detach`; los datos se conservan.

### Ingreso

Todo el sistema pide sesión. `npm run db:seed` crea los usuarios que estén en el `.env` (`ADMIN_EMAIL`/`ADMIN_CLAVE` y `RECEPCION_EMAIL`/`RECEPCION_CLAVE`); si el usuario ya existe, no cambia su contraseña. Las contraseñas se guardan cifradas con scrypt y la sesión es una cookie firmada con `AUTH_SECRET` que dura 12 horas. Recepción entra directo a la **Estación de registro** (`/registro`), pensada para la PC de la entrada: buscador por cédula o nombre, acciones con atajos (`Alt 1–6`), agenda de hoy y actividad reciente. `Ctrl K` abre el buscador global desde cualquier pantalla.

## Usuarios, roles y auditoría

- **Usuarios** (`/usuarios`, solo administración): crear cuentas, asignar rol, vincular a una persona de la plantilla, desactivar y cambiar contraseñas (mínimo 8 caracteres; se guardan cifradas). Un usuario vinculado a un médico emite los récipes a su nombre sin elegirlo.
- **Permisos por rol** (`src/lib/permisos.ts`, aplicados en el middleware a toda escritura de la API):

  | Rol | Puede modificar |
  |---|---|
  | Administración | Todo, incluidos usuarios y auditoría |
  | Médico | Pacientes, consultas, récipes, protocolos, plantillas, citas y su propia ficha |
  | Recepción | Pacientes y citas |
  | Farmacia | Medicamentos |

  Todos los roles pueden consultar. Solo administración elimina pacientes, médicos y medicamentos.
- **Auditoría** (`/auditoria`): quién creó, modificó o eliminó cada registro (y qué campos), y quién ingresó o salió, con filtros.

## Otras funciones

- **Búsqueda sin acentos ni mayúsculas**, por palabras: «maria perez» encuentra «Pérez, María» (`src/lib/busqueda.ts`, con `translate()` de PostgreSQL, sin extensiones).
- **Citas sin choques:** un médico o un paciente no puede tener dos citas activas a menos de 15 minutos; cancelar libera la hora.
- **Signos vitales en la consulta** (tensión, frecuencias, temperatura, saturación, peso y talla) con IMC y avisos de valores fuera de rango. El récipe pediátrico toma el peso de la última consulta.
- **Recordatorio de cita por WhatsApp** desde la ficha de la cita.
- Avisos de confirmación al guardar o eliminar, pantalla de carga y pantalla de error con reintento.

## Diseño: marca MPPD

La identidad sale de `branding-kit/branding-kit/` (BRANDING.md y PRODUCTO.md): consola institucional, lienzo crema, marca oliva, Inter + JetBrains Mono, vidrio (`.glass-*`), íconos Tabler y movimiento sobrio (≤ 320 ms, sin rebotes). Los tokens y el vidrio del kit están copiados sin cambios en `src/app/globals.css` (traducidos a CSS plano: el proyecto no usa Tailwind).

- **Artes institucionales** (generados con los scripts del kit, no se editan a mano):
  ```bash
  node branding-kit/branding-kit/scripts/optimize-mppd.mjs --public public
  node branding-kit/branding-kit/scripts/optimize-componentes.mjs --public public/marca
  node branding-kit/branding-kit/scripts/optimize-grados.mjs --public public/marca --manifest src/lib/marca/insignias-manifest.ts
  ```
- **Componente y grado militar** en pacientes y médicos: catálogo en `src/lib/marca/grados.ts` (copiado de los `indice.csv` del kit). Se respeta la regla del kit: el arte se busca por abreviatura y categoría, la Armada usa su denominación naval, y si un grado no tiene arte (cabos, Milicia) solo se escribe el texto.
- El récipe en PDF lleva el emblema del MPPD, el grado del médico y el pie institucional.

## Cómo está organizado

El flujo principal sigue la idea de DocGuía (récipe digital en tres pasos):

1. **Perfil del médico, una sola vez:** logo, firma, sello, COL y MPPS (`/medicos`).
2. **Crear el récipe:** medicamentos del vademécum o en texto libre, con dosis, frecuencia y duración; plantillas para lo que se receta a diario y dictado por voz (`/recetas/nuevo`).
3. **Enviarlo:** PDF por WhatsApp (en el teléfono va directo al chat; en la computadora se descarga y se abre el chat), o descargarlo e imprimirlo (`/recetas/<id>`).

### Récipe automático por protocolo

Al elegir paciente y diagnóstico CIE-10 (o al crear el récipe desde una consulta que ya tiene diagnóstico), el formulario busca el **protocolo** de esa enfermedad para el grupo de edad del paciente (pediátrico: menores de 12 años) y llena medicamentos, dosis, frecuencia, duración e indicaciones. El médico revisa y emite.

- **Dosis por peso:** los protocolos pediátricos pueden definir mg/kg por toma, máximo por toma y concentración del jarabe; al escribir el peso se calcula la dosis en ml (redondeada a medio ml, sin pasar el máximo). Lógica en `src/lib/protocolos.ts`.
- **Alergias:** si un medicamento choca con las alergias anotadas del paciente (por nombre o por familia: penicilinas, AINES, sulfas, cefalosporinas…), se marca en rojo y hay que confirmar la revisión antes de emitir.
- **Crear o ajustar protocolos:** emitir un récipe con diagnóstico y marcar «Guardar como protocolo». Se listan en `/recetas/protocolos`. `npm run db:seed` carga 7 protocolos de ejemplo que **el equipo médico debe revisar**.

Alrededor de ese flujo están los módulos de gestión: Pacientes, Médicos, Consultas (historia clínica), Récipes, Medicamentos (vademécum) y Citas. Se puede crear un récipe desde el paciente, la consulta o el médico.

```
src/app/(acceso)/login/        Pantalla de ingreso
src/app/(app)/layout.tsx       Marco interno: barra lateral, buscador Ctrl K, reloj
src/app/(app)/registro/        Estación de registro (recepción)
src/app/(app)/<modulo>/        Pantallas: lista, nuevo, [id] (ficha) y [id]/editar
src/app/(app)/<modulo>/campos.ts  Campos del formulario de cada módulo
src/app/(app)/recetas/         Récipes, plantillas y envío
src/middleware.ts              Exige sesión en todo el sistema
src/lib/sesion.ts              Firma y verificación de la sesión
src/app/api/<recurso>/         API REST de cada módulo
src/app/api/recetas/[id]/pdf   Récipe en PDF (?descargar=1 para guardarlo)
src/app/api/subidas/           Subida de imágenes (logo, firma, sello) a la carpeta uploads/
src/components/                Formulario genérico, botones y piezas compartidas
src/lib/pdfReceta.ts           Diseño del PDF del récipe (media carta)
src/lib/recursos.ts            Validación y configuración de cada recurso
src/lib/api.ts                 Manejadores genéricos (listar, crear, ver, actualizar, eliminar)
src/lib/integraciones/         Adaptadores para APIs externas (medicamentos)
prisma/schema.prisma           Modelo de datos
docs/DISENO.md                 Diseño del sistema y plan de trabajo
```

## API

Cada recurso responde a:

| Método | Ruta | Acción |
|--------|------|--------|
| `GET` | `/api/<recurso>?q=texto&pagina=1&porPagina=20` | Listar con búsqueda y paginación |
| `POST` | `/api/<recurso>` | Crear |
| `GET` | `/api/<recurso>/<id>` | Ver uno |
| `PATCH` | `/api/<recurso>/<id>` | Actualizar |
| `DELETE` | `/api/<recurso>/<id>` | Eliminar |

Recursos: `personal`, `medicos`, `especialidades`, `consultorios`, `horarios`, `pacientes`, `citas`, `consultas`, `recetas`, `plantillas`, `enfermedades`, `medicamentos`.

`POST /api/medicos` acepta `personal: { nombres, apellidos, cedula, ... }` para registrar al médico en un solo paso.

Ejemplo para crear un récipe:

```bash
curl -X POST http://localhost:3000/api/recetas \
  -H "Content-Type: application/json" \
  -d '{
    "pacienteId": "<id del paciente>",
    "medicoId": "<id del médico>",
    "items": [{
      "medicamentoId": "<id del medicamento>",
      "cantidad": "1 caja",
      "dosis": "1 tableta",
      "frecuencia": "cada 24 horas",
      "duracion": "30 días"
    }]
  }'
```

### Importar medicamentos desde una API externa

`POST /api/medicamentos/importar` con `{ "busqueda": "metformina" }` trae medicamentos del proveedor configurado en `PROVEEDOR_MEDICAMENTOS` y los guarda en el vademécum. Hoy solo existe el proveedor `local` (una lista de ejemplo). Para conectar una API real, cree un adaptador en `src/lib/integraciones/` que implemente `ProveedorMedicamentos` y regístrelo en `index.ts`.

## Pendiente

- Las imágenes se guardan en la carpeta `uploads/`; en producción hay que moverlas a un almacenamiento externo (Vercel Blob, S3).
- Envío automático por WhatsApp (sin que el médico adjunte el PDF) requiere la API de WhatsApp Business.
