# Diseño del sistema: Consultoría Hospital

Este documento describe la estructura del sistema para digitalizar la gestión de un hospital o clínica: plantilla de personal, consultorios, médicos con firma y sello, pacientes, historias clínicas, récipes, especialidades y catálogo farmacéutico.

## 1. Objetivos

- Tener en un solo lugar los datos del personal, los médicos, los consultorios y los pacientes.
- Emitir récipes e indicaciones médicas en PDF con la firma y el sello del médico, listos para imprimir.
- Contar con un catálogo de medicamentos (vademécum) relacionado con enfermedades y especialidades, que pueda alimentarse desde APIs externas.
- Exponer todo a través de una API REST, para que otras aplicaciones (móvil, farmacia, laboratorio) puedan consumir los datos.

## 2. Tecnología

| Capa | Herramienta | Motivo |
|------|-------------|--------|
| Aplicación web y API | Next.js 15 (App Router) con TypeScript | Una sola base de código para pantallas y API REST |
| Base de datos | PostgreSQL | Relacional, robusta, gratuita y fácil de alojar |
| Acceso a datos | Prisma ORM | Esquema tipado y migraciones versionadas |
| Validación | Zod | Valida los datos que entran a la API |
| Integraciones | Carpeta `src/lib/integraciones` | Adaptadores para APIs externas (medicamentos, CIE-10, etc.) |

## 3. Roles de usuario

| Rol | Qué puede hacer |
|-----|-----------------|
| `ADMIN` | Todo: plantilla, consultorios, especialidades, usuarios y catálogos |
| `MEDICO` | Ver sus pacientes, registrar consultas, emitir récipes con su firma y sello |
| `RECEPCION` | Registrar pacientes y agendar citas |
| `FARMACIA` | Consultar récipes y administrar el catálogo de medicamentos |

El inicio de sesión y los permisos por rol se implementan en el paso 2 del plan.

## 4. Módulos

1. **Plantilla de personal**: todo el personal (médicos, enfermería, administración, farmacia), con cargo, cédula y contacto.
2. **Médicos**: datos profesionales del personal médico (MPPS, Colegio de Médicos), especialidades, firma y sello digital.
3. **Especialidades**: catálogo de especialidades médicas.
4. **Consultorios**: espacios físicos con ubicación y especialidad, y horarios de cada médico.
5. **Pacientes**: datos personales, antecedentes, alergias y tipo de sangre.
6. **Citas**: agenda de pacientes por médico y consultorio.
7. **Consultas (historia clínica)**: motivo, examen físico, diagnóstico (con código CIE-10) y plan.
8. **Récipes**: récipe con uno o varios medicamentos e indicaciones, ligado a la consulta.
9. **Enfermedades**: catálogo CIE-10, relacionado con especialidades.
10. **Medicamentos (vademécum)**: principio activo, nombre comercial, presentación, concentración, vía y laboratorio, relacionado con las enfermedades para las que está indicado.

## 5. Modelo de datos

El modelo completo está en [`prisma/schema.prisma`](../prisma/schema.prisma). Resumen de relaciones:

```
Usuario ──(0..1)── Personal ──(0..1)── Medico ──(n..m)── Especialidad
                                          │                   │
                                          ├── Horario ── Consultorio
                                          │
Paciente ── Cita ─────────────────────────┤
   │                                      │
   └── Consulta ──────────────────────────┤
          │                               │
          └── Receta ── RecetaItem ── Medicamento ──(n..m)── Enfermedad ── Especialidad
```

## 6. Formato del récipe (Venezuela)

Cada récipe impreso tiene dos partes: **récipe** (lo que entrega la farmacia) e **indicaciones** (cómo tomarlo). Debe incluir:

- Nombre del centro de salud y logo.
- Nombre completo del médico, cédula, **número MPPS** y **número del Colegio de Médicos**, y especialidad.
- Datos del paciente: nombre, cédula y edad.
- Fecha de emisión y número correlativo del récipe.
- Medicamentos: principio activo (y nombre comercial si aplica), presentación, concentración y cantidad.
- Indicaciones: dosis, frecuencia y duración del tratamiento.
- **Firma y sello** del médico.
- Los psicotrópicos y estupefacientes requieren récipe especial; el campo `requiereRecipeEspecial` del medicamento lo marca.

La generación del PDF se implementa en el paso 3 del plan.

## 7. API REST

Todas las rutas viven en `src/app/api`. Cada recurso tiene:

| Método | Ruta | Acción |
|--------|------|--------|
| `GET` | `/api/<recurso>?q=&pagina=&porPagina=` | Listar con búsqueda y paginación |
| `POST` | `/api/<recurso>` | Crear |
| `GET` | `/api/<recurso>/<id>` | Ver uno |
| `PATCH` | `/api/<recurso>/<id>` | Actualizar |
| `DELETE` | `/api/<recurso>/<id>` | Eliminar |

Recursos: `personal`, `medicos`, `especialidades`, `consultorios`, `horarios`, `pacientes`, `citas`, `consultas`, `recetas`, `enfermedades`, `medicamentos`.

Además, `GET /api/salud` indica si la aplicación y la base de datos responden.

### Integraciones con APIs externas

`src/lib/integraciones` define una interfaz `ProveedorMedicamentos`. Cada API externa (por ejemplo un vademécum o la API de medicamentos de la OMS/RxNorm) se agrega como un adaptador que implementa esa interfaz, y `POST /api/medicamentos/importar` usa el proveedor configurado para traer medicamentos al catálogo local. Así el resto del sistema no depende de una API específica.

## 8. Plan de trabajo

1. **Diseño y estructura base** (este paso): documento, proyecto, modelo de datos y API.
2. **Base del sistema**: inicio de sesión, permisos por rol, pantallas de plantilla, especialidades y consultorios, carga de firma y sello.
3. **Pacientes y récipes**: pantallas de pacientes, historia clínica, citas y emisión de récipes en PDF.
4. **Catálogo farmacéutico**: integración con APIs externas y búsqueda de medicamentos al recetar.
