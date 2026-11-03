# SIGTAU · Sistema de Gestión de Tutorías

Los estudiantes se registran, consultan las tutorías disponibles y se inscriben. Los tutores publican
y administran sus tutorías; el administrador gestiona catálogos, usuarios e inscripciones.


## Estructura
- `backend/sigtau` – API REST (Spring Boot 3.5, Java 21, JPA, PostgreSQL, JWT)
- `frontend/sigtau-frontend` – Interfaz (React 19, Vite, Bootstrap)
- `database/create_database.sql` – crea la base `sigtau`

## Roles
| Rol | Puede |
|---|---|
| **STUDENT** | Registrarse, ver tutorías, inscribirse, ver y cancelar sus inscripciones |
| **TUTOR** | Crear/editar/eliminar **sus** tutorías y ver sus inscritos |
| **ADMIN** | Todo lo anterior + carreras, materias, modalidades, motivos y usuarios (crear tutores) |

El registro público **siempre** crea un estudiante; el rol nunca viene del cliente.

## Reglas de inscripción
- La tutoría debe estar abierta, no haber comenzado y tener cupos.
- No se permite inscribirse dos veces ni en dos tutorías con horario traslapado.
- El estudiante se toma del token JWT; el cupo se descuenta con bloqueo de fila (sin sobrecupo por concurrencia).
- Al cancelar se devuelve el cupo; se puede indicar un motivo del catálogo.

## Ejecutar
1. PostgreSQL: ejecutar `database/create_database.sql`.
2. Backend: `cd backend/sigtau && ./mvnw spring-boot:run`
   Variables opcionales: `DB_URL, DB_USER, DB_PASSWORD, JWT_SECRET, CORS_ORIGIN, ADMIN_EMAIL, ADMIN_PASSWORD`.
   Al iniciar se crean roles, modalidades, motivos y el admin inicial (`admin@sigtau.local` / `Admin123!`; **cambiar**).
3. Frontend: `cd frontend/sigtau-frontend && npm install && npm run dev` (http://localhost:5173).
   La URL de la API se configura con `VITE_API_URL` (ver `.env.example`).
4. Tests: `cd backend/sigtau && ./mvnw test`

Flujo sugerido: entrar como admin → crear carreras y materias → crear un usuario TUTOR → el tutor crea tutorías →
un estudiante se registra e inscribe.

## Qué se reciclo del proyecto Gamerstore
| Gamerstore | SIGTAU |
|---|---|
| Category | **Career** (carrera) |
| Brand | **Subject** (materia, ahora ligada a una carrera) |
| Platform | **Modality** (presencial / virtual / híbrida) |
| Product (stock) | **Tutoring** (el stock pasa a ser cupos) |
| Entry / Exit | **Enrollment** (inscripción / cancelación) |
| Reason | Motivo de cancelación |
| User / Role | User / Role (+ rol TUTOR y STUDENT) |
| Supplier, Country | eliminados (no aplican) |
| JWT, Security, DTOs, GlobalExceptionHandler, Navbar, Login, pantallas CRUD | reutilizados y adaptados |

## API principal
| Método | Ruta | Acceso |
|---|---|---|
| POST | `/auth/login`, `/auth/register` | público |
| GET | `/careers`, `/subjects`, `/modalities` | público |
| GET | `/tutorings`, `/tutorings/{id}` | autenticado |
| GET | `/tutorings/mine` | TUTOR, ADMIN |
| POST/PUT/DELETE | `/tutorings` | TUTOR (solo las suyas), ADMIN |
| POST | `/enrollments` | STUDENT |
| GET | `/enrollments/my` | STUDENT |
| GET | `/enrollments[?tutoringId=]` | TUTOR (las suyas), ADMIN |
| PUT | `/enrollments/{id}/cancel` | STUDENT (la suya), ADMIN |
| CRUD | `/careers`, `/subjects`, `/modalities`, `/reasons`, `/users`, `/roles` | ADMIN |

## Correcciones y verificación

Consultar [la guía de integración y pruebas](docs/ENTREGA_GERSON.md).

- Backend: `cd backend/sigtau && bash mvnw test` (Java 21).
- Frontend: `cd frontend/sigtau-frontend && npm ci && npm run lint && npm run build`.
- Interfaz: `npx playwright install chromium && npm run test:e2e` desde el frontend.
- `.github/workflows/verify.yml` comprueba backend con PostgreSQL de prueba y frontend al subir cambios.
