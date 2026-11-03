# SIGTAU: correcciones para integrar

Base revisada: `9e4438880f63d2d4d0cab73416bdc236e8bb70db` de RM24004/sigtau.
Trabajo preparado el 31 de octubre de 2026. No se modificó el repositorio remoto.

## Cambios

- Crear y editar modalidades y motivos con carga de datos, errores visibles y retorno al listado correcto. Se agregaron las dos rutas de edición que faltaban.
- Editar un usuario conserva su contraseña cuando el campo queda vacío. El backend también admite el valor vacío; al crear un usuario la contraseña sigue siendo obligatoria.
- La descripción de un motivo es opcional, como indica la interfaz; su nombre tiene el mismo límite de 100 caracteres que la entidad.
- Validación de modalidades en el servidor mediante `@Valid`.
- Las peticiones autenticadas consultan el usuario y rol actuales: eliminar un usuario o cambiar su rol modifica el acceso de su token anterior.
- Bloqueo por estudiante al inscribir para serializar sus solicitudes simultáneas a distintos horarios. Bloqueo por inscripción al cancelar para que una cancelación repetida no incremente cupos dos veces.
- Se rechaza crear o reprogramar tutorías en el pasado. Si hay inscripciones activas se rechaza cambiar el horario para no crear cruces en las agendas; se pueden cancelar las inscripciones antes de reprogramar. Esta regla debe confirmarse con el equipo.
- Archivo `.env.example` del frontend colocado en la raíz donde Vite lo espera.
- Corrección de avisos y errores de ESLint sin desactivar las reglas de React.
- Pruebas unitarias, integración del flujo principal y pruebas de interfaz preparadas. Workflow de GitHub Actions con Java 21, PostgreSQL 16 y Node 22.

## Verificación y límites

Resultado local: **13 pruebas de backend aprobadas**, sin fallos ni errores; **ESLint y compilación del frontend aprobados**.

- Backend: ejecutar `bash mvnw test` dentro de `backend/sigtau` con Java 21.
- En el entorno de preparación se ejecutó con Java 17 mediante `bash mvnw -Djava.version=17 test`. La configuración del proyecto conserva Java 21.
- La integración local usa H2 en modo PostgreSQL; esto no equivale a validar PostgreSQL real.
- Las pruebas de interfaz usan respuestas simuladas de la API y comprueban los formularios/rutas. No sustituyen una prueba completa con ambos servidores.
- La descarga de Chromium falló en el entorno de preparación: las cuatro pruebas de interfaz quedan pendientes de ejecución.
- El workflow quedó preparado, pero no se ejecutó en GitHub porque no se publicaron cambios.
- La concurrencia se corrigió a nivel de bloqueos; falta una prueba de carga simultánea sobre PostgreSQL real.

## Incorporar los cambios sin perder trabajo

El ZIP contiene `sigtau/` (código completo), `sigtau-mejoras.patch` y esta guía.
La opción recomendada para el compañero que ya tiene el repositorio:

1. Guardar o confirmar sus cambios locales y actualizar `main`.
2. Crear una rama: `git switch -c mejoras-gerson`.
3. Desde la raíz de su repositorio, comprobar el parche: `git apply --check ../sigtau-mejoras.patch` (ajustar la ruta al lugar donde se descomprimió).
4. Si la comprobación pasa, aplicar: `git apply ../sigtau-mejoras.patch`.
5. Si falla, no sobreescribir archivos: comparar los cambios con su versión más reciente y resolver las diferencias.
6. Ejecutar las verificaciones y revisar `git diff` antes de confirmar y subir la rama.

Si quiere probar la copia completa, descomprimir `sigtau/` en una carpeta separada. No incluye dependencias, credenciales locales ni datos reales.

## Arranque local

1. Usar Java 21, PostgreSQL y Node 22. El backend correcto es `backend/sigtau`, no la plantilla antigua de `backend/`.
2. Crear la base con `database/create_database.sql`. Configurar `DB_URL`, `DB_USER` y `DB_PASSWORD` según la instalación local.
3. Configurar `JWT_SECRET` (al menos 32 caracteres), `ADMIN_EMAIL`, `ADMIN_PASSWORD` y `CORS_ORIGIN`. Los valores predeterminados del repositorio son de desarrollo, no de publicación.
4. En `backend/sigtau`: `bash mvnw spring-boot:run` (Windows: `mvnw.cmd spring-boot:run`). Hibernate crea las tablas; DataSeeder crea los catálogos iniciales y el administrador si no existe.
5. En `frontend/sigtau-frontend`, copiar `.env.example` a `.env`, configurar `VITE_API_URL` si cambia el backend y ejecutar `npm ci` y `npm run dev`.
6. Entrar como administrador, crear carrera/materia y un tutor. Entrar como tutor para crear una tutoría futura. Registrarse como estudiante, inscribirse y cancelar.

## Verificaciones antes de la presentación

| Caso | Procedimiento | Resultado esperado |
|---|---|---|
| Catálogos | Crear y editar modalidad y motivo | Persisten los cambios y se vuelve al listado |
| Usuario | Editar teléfono dejando contraseña vacía | Guarda y permite entrar con la contraseña anterior |
| Inscripción | Inscribir un estudiante a tutoría futura | Descuenta exactamente un cupo |
| Duplicado | Repetir inscripción | Se rechaza sin descontar otro cupo |
| Horarios | Inscribirse en otra tutoría que se cruza | Se rechaza |
| Cancelación | Cancelar y repetir cancelación | Devuelve un solo cupo |
| Permisos | Cambiar rol de tutor a estudiante y reutilizar token | Ya no accede a funciones de tutor |
| Fechas | Crear tutoría pasada o cambiar horario con inscritos | Se rechaza con mensaje |
| Concurrencia | Dos estudiantes compiten por el último cupo | Solo uno logra inscribirse |

Para pruebas de interfaz: `npx playwright install chromium` y `npm run test:e2e` desde el frontend.
Para integración en PostgreSQL, usar una base EXCLUSIVA de pruebas mediante `TEST_DB_URL`, `TEST_DB_DRIVER=org.postgresql.Driver`, `TEST_DB_USER` y `TEST_DB_PASSWORD`. Las pruebas crean y eliminan tablas: nunca apuntarlas a una base con datos reales.

## Documentación académica que sigue pendiente

El código no reemplaza la entrega escrita. El equipo debe adjuntar capturas reales de al menos diez pantallas, evidencia de PostgreSQL, normalización, diccionario de datos, diagramas DFD, arquitectura, cronograma y casos de prueba con resultados reales. No afirmar que el software está terminado o todas las pruebas aprobadas hasta cerrar los pendientes anteriores y contrastar los requerimientos completos del proyecto.
