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

## Estructura

```
docs/DISENO.md                 Diseño del sistema y plan de trabajo
prisma/schema.prisma           Modelo de datos
prisma/migrations/             Migraciones de la base de datos
prisma/seed.ts                 Datos iniciales
src/app/page.tsx               Panel principal
src/app/api/<recurso>/         API REST de cada módulo
src/lib/recursos.ts            Validación y configuración de cada recurso
src/lib/api.ts                 Manejadores genéricos (listar, crear, ver, actualizar, eliminar)
src/lib/integraciones/         Adaptadores para APIs externas (medicamentos)
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

Recursos: `personal`, `medicos`, `especialidades`, `consultorios`, `horarios`, `pacientes`, `citas`, `consultas`, `recetas`, `enfermedades`, `medicamentos`.

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

- Inicio de sesión y permisos por rol (paso 2 del plan).
- Pantallas de cada módulo y carga de firma y sello (pasos 2 y 3).
- Récipe en PDF (paso 3).
- La búsqueda distingue acentos ("gomez" no encuentra "Gómez"); se puede resolver con la extensión `unaccent` de PostgreSQL.
