# Foro Universitario

Plataforma para registrar y dar seguimiento a reportes de problemas del campus. El repositorio está dividido en dos proyectos:

- **`backend/`**: API REST con Node.js, Express 5, Prisma 6 y PostgreSQL (Supabase). Autenticación JWT, roles estudiante/administrador, categorías, reportes, votos, comentarios, historial de estados, estadísticas y documentación Swagger.
- **`frontend/`**: interfaz en React 18 + Vite 5 + Tailwind CSS 3.

## Estructura

```
backend/
  prisma/              esquema y seed
  scripts/             utilidades (probar-supabase.mjs)
  src/
    server.js          arranque del servidor
    app.js             configuración de Express (seguridad, rutas, estáticos del frontend)
    config/            variables de entorno y Swagger
    database/          cliente Prisma, selección de conexión y datos demo en memoria
    repositories/      acceso a datos (patrón repository)
      prisma/          implementación sobre PostgreSQL
      memoria/         implementación en memoria (sin base de datos)
    services/          reglas de negocio
    controllers/       capa HTTP
    routes/            definición de rutas /api
    middlewares/       autenticación, roles, validación y errores
    validators/        esquemas Zod
    utils/             errores HTTP, paginación, serializadores, permisos
  test/                pruebas con node:test
frontend/
  src/
    api/               clientes de la API
    context/           sesión (AuthContext)
    hooks/             lógica de datos y UI
    components/        layout, reportes, sidebar, modales y toast
    utils/             formato de fechas y estados
```

Flujo de una petición: `routes → middlewares → controllers → services → repositories → Prisma / memoria`. Si no hay `DATABASE_URL` o PostgreSQL no responde, el backend usa automáticamente los repositorios en memoria con datos de demostración (admin `admin@foro.com` / `ADMIN_PASSWORD` o `Admin1234`; estudiantes `ana@foro.com`, `luis@foro.com`, `sofia@foro.com` / `Estudiante123`).

## Requisitos

- Node.js 20 o posterior y npm.
- PostgreSQL disponible (se recomienda Supabase) con credenciales para `DATABASE_URL` y `DIRECT_URL`. Opcional: sin base de datos se usa el modo en memoria.
- Una clave privada para `JWT_SECRET` y otra de al menos 8 caracteres para `ADMIN_PASSWORD`.

## Instalación y ejecución

1. Clona el repositorio y, en la carpeta raíz, instala todo (raíz, backend y frontend):

   ```sh
   npm install
   ```

2. Copia `backend/.env.example` como `backend/.env` (en PowerShell: `Copy-Item backend/.env.example backend/.env`) y configura las variables. No publiques `.env`.
3. Genera el cliente Prisma, sincroniza el esquema y carga los datos de demostración:

   ```sh
   npm run build --prefix backend
   npm run prisma:push --prefix backend
   npm run prisma:seed --prefix backend
   ```

   El seed necesita `ADMIN_PASSWORD`; crea o actualiza el administrador `admin@foro.com`, tres estudiantes de demostración, categorías, ocho reportes y comentarios. Puede ejecutarse más de una vez sin duplicar registros. Los estudiantes de demostración usan `Estudiante123`.

4. Desarrollo (backend en `:3000` y Vite en `:5173` con proxy de `/api` al backend):

   ```sh
   npm run dev
   ```

   Abre `http://localhost:5173`. También puedes levantar cada parte por separado con `npm run dev:backend` y `npm run dev:frontend`.

5. Producción (Express sirve el build del frontend y la API en el mismo puerto):

   ```sh
   npm run build
   npm start
   ```

   Abre `http://localhost:3000`. Swagger está en `http://localhost:3000/api/docs`.

| Script (raíz) | Acción |
|---|---|
| `npm run dev` | Backend + frontend en modo desarrollo. |
| `npm run build` | `prisma generate` y build de Vite (`frontend/dist`). |
| `npm start` | Inicia el backend, que sirve también `frontend/dist`. |
| `npm test` | Pruebas del backend. |

## Variables de entorno

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | URL PostgreSQL del pooler de Supabase para la aplicación. |
| `DIRECT_URL` | URL directa PostgreSQL usada por Prisma para sincronizar el esquema. |
| `JWT_SECRET` | Secreto propio para firmar los JWT. |
| `JWT_EXPIRES_IN` | Vigencia del token (por ejemplo, `2h`). |
| `CORS_ORIGIN` | Orígenes permitidos separados por comas. Por defecto: `http://localhost:5173,http://localhost:3000`. |
| `ADMIN_PASSWORD` | Contraseña inicial del administrador, mínimo 8 caracteres. |
| `PORT` | Puerto HTTP; por defecto `3000`. Si está ocupado, el servidor muestra un mensaje en español. |
| `SUPABASE_URL` | URL del proyecto Supabase (si se necesita para integración adicional). |
| `SUPABASE_PUBLISHABLE_KEY` | Clave pública de Supabase (si se necesita para integración adicional). |
| `SUPABASE_SECRET_KEY` | Clave secreta de Supabase; mantener únicamente en el servidor. |
| `SUPABASE_JWKS_URL` | URL JWKS de Supabase (si se necesita para integración adicional). |

## Respuestas y validaciones

Las respuestas usan el sobre `{ status, message, data }`. Las rutas protegidas requieren `Authorization: Bearer <token>`. Los errores de validación devuelven HTTP 400 y detalle por campo en `data.errores`.

Los correos se guardan y consultan en minúsculas, por lo que las variantes de mayúsculas/minúsculas corresponden a la misma cuenta. Las contraseñas de registro y cambio admiten entre 8 y 72 caracteres. `categoriaId` acepta enteros positivos numéricos o texto numérico, como el valor `"1"` enviado por un formulario HTML.

La paginación de reportes y comentarios usa `pagina` y `limite`; este último debe ser positivo y cualquier valor superior a 50 se ajusta a 50. Un JWT expirado responde HTTP 401 con `message: "Token expirado"` y `data.codigo: "TOKEN_EXPIRADO"`. Un body JSON mal formado responde HTTP 400 con `El cuerpo de la petición no es un JSON válido`.

Los reportes pueden incluir `ubicacion` (hasta 100 caracteres) e `imagenUrl` (URL HTTP/HTTPS); ambos pueden omitirse o enviarse como `null` para limpiar su valor. El campo `actualizadoEn` se actualiza automáticamente. El listado permite filtrar con `ubicacion` y ordenar por `mas_apoyados`. Las respuestas de reporte incluyen `totalVotos` y, al presentar un JWT válido, también `yaVote`.

Los votos son únicos por usuario y reporte: un segundo `POST` devuelve HTTP 409. `DELETE` quita el voto propio. El historial público registra los cambios de estado en la misma transacción de actualización. El cambio de rol requiere admin; un administrador no puede quitarse su propio rol. Estas funciones no requieren variables nuevas en `.env`.

## Endpoints

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/api/salud` | Público | Comprueba servidor y base de datos. |
| GET | `/api/docs` | Público | Documentación interactiva OpenAPI/Swagger. |
| POST | `/api/auth/registro` | Público | Registra un estudiante. |
| POST | `/api/auth/login` | Público | Inicia sesión y entrega JWT con rol. |
| GET / PUT | `/api/auth/perfil` | Token | Consulta o edita el perfil propio. |
| PUT | `/api/auth/password` | Token | Cambia contraseña con contraseña actual. |
| GET | `/api/auth/mis-reportes` | Token | Lista reportes propios con paginación. |
| GET / POST | `/api/categorias` | Público / Admin | Lista o crea categorías. |
| PUT / DELETE | `/api/categorias/:id` | Admin | Edita o elimina categoría sin reportes. |
| GET / POST | `/api/reportes` | Público / Token | Lista/filtra reportes o crea uno. |
| GET / PUT / DELETE | `/api/reportes/:id` | Público / Token | Consulta, edita propio o elimina propio/reporte moderado por admin. |
| PATCH | `/api/reportes/:id/estado` | Token (autor o admin) | Cambia estado; los demás reciben HTTP 403 y se devuelve el reporte completo serializado. |
| POST / DELETE | `/api/reportes/:id/votos` | Token | Registra o quita el voto propio. |
| GET | `/api/reportes/:id/historial` | Público | Lista cambios de estado del más reciente al más antiguo. |
| GET / POST | `/api/reportes/:id/comentarios` | Público / Token | Lista comentarios paginados o agrega uno. |
| PUT / DELETE | `/api/comentarios/:id` | Token | Edita propio o borra propio/comentario moderado por admin. |
| GET | `/api/usuarios` | Admin | Lista usuarios sin correo ni hash de contraseña. |
| PATCH | `/api/usuarios/:id/rol` | Admin | Cambia el rol a `estudiante` o `admin`; no permite que el admin se quite su propio rol. |
| GET | `/api/usuarios/:id/reportes` | Público | Lista reportes de un usuario, paginados. |
| GET | `/api/estadisticas` | Público | Totales, conteos por estado/categoría y reportes recientes. |

La lista de reportes acepta `pagina`, `limite`, `categoriaId`, `estado`, `q`, `ubicacion`, `orden` (`recientes`, `antiguos`, `mas_comentados` o `mas_apoyados`) y `usuarioId`.

## Pruebas rápidas

1. Importa `backend/pruebas.http` en VS Code con REST Client o úsalo como referencia para Postman.
2. Ejecuta `npm test` para las pruebas automatizadas (esquemas, middleware, services, repositorios en memoria y un flujo HTTP completo).
3. Inicia sesión como admin con `admin@foro.com` y el valor local de `ADMIN_PASSWORD`; usa `data.token` como Bearer token admin. Registra/inicia sesión como estudiante para obtener un segundo token.
4. Registra un correo mixto como `Ana@x.com` e inicia sesión con `ana@x.com`; debe acceder a la misma cuenta.
5. Crea/edita un reporte con ubicación e imagen HTTP/HTTPS; filtra con `?ubicacion=aula` y comprueba la coincidencia parcial sin distinguir mayúsculas.
6. Vota dos veces por el mismo reporte (201 y 409), revisa `totalVotos` y `yaVote` con/sin token, y quita el voto con DELETE.
7. Cambia el estado y consulta `/api/reportes/:id/historial`; debe mostrar el autor del cambio y el registro más reciente primero.
8. Cambia el rol de otro usuario con admin. Intenta cambiar el propio rol admin a estudiante (403) y prueba el endpoint sin admin (401/403).
9. Prueba cambiar estado con el token del autor y con el de admin (200 y reporte completo), y con otro estudiante (403).
10. Comprueba que contraseñas de registro/cambio de más de 72 caracteres y JSON mal formado respondan 400, y que un JWT vencido responda 401 con el código indicado.
11. Ejecuta `npm run prisma:seed --prefix backend` dos veces y confirma que no duplica datos. Revisa que la lista de usuarios no exponga correo ni `passwordHash`.

## Notas de esquema

El esquema incluye el rol por defecto `estudiante` y la unicidad del nombre de categoría. `npm run prisma:push --prefix backend` sincroniza los cambios sin generar migraciones SQL versionadas. Antes de sincronizar una base existente, confirma que no tenga nombres de categorías duplicados.
