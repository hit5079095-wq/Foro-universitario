# Foro Universitario - Backend

API REST para registrar y dar seguimiento a reportes de problemas del campus. Usa Node.js, Express, Prisma 6 y PostgreSQL (Supabase); ofrece autenticación JWT, perfiles, roles de estudiante/administrador, categorías, reportes, comentarios, estadísticas y documentación Swagger.

## Requisitos

- Node.js 20 o posterior y npm.
- PostgreSQL disponible; se recomienda un proyecto Supabase.
- Credenciales de conexión para `DATABASE_URL` y `DIRECT_URL`.
- Una clave privada para `JWT_SECRET` y otra clave de al menos 8 caracteres para `ADMIN_PASSWORD`.

## Instalación y ejecución

1. Clona el repositorio y abre una terminal en la carpeta raíz.
2. Instala los paquetes:

   ```sh
   npm install
   ```

3. Copia `.env.example` como `.env` (en PowerShell: `Copy-Item .env.example .env`) y configura las variables. No publiques `.env`.
4. Genera el cliente Prisma y sincroniza el esquema:

   ```sh
   npx prisma generate
   npm run prisma:push
   ```

5. Carga los datos de demostración:

   ```sh
   npm run prisma:seed
   ```

   El seed necesita `ADMIN_PASSWORD`; crea o actualiza el administrador `admin@foro.com`, tres estudiantes de demostración, categorías, ocho reportes y comentarios. Puede ejecutarse más de una vez sin duplicar registros ni regenerar hashes si las contraseñas ya coinciden. Los estudiantes de demostración usan `Estudiante123`.

6. Inicia el servidor:

   ```sh
   npm start
   ```

La API escucha en `http://localhost:3000`. La interfaz interactiva de Swagger está en `http://localhost:3000/api/docs`.

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
| GET / POST | `/api/reportes/:id/comentarios` | Público / Token | Lista comentarios paginados o agrega uno. |
| PUT / DELETE | `/api/comentarios/:id` | Token | Edita propio o borra propio/comentario moderado por admin. |
| GET | `/api/usuarios` | Admin | Lista usuarios sin correo ni hash de contraseña. |
| GET | `/api/usuarios/:id/reportes` | Público | Lista reportes de un usuario, paginados. |
| GET | `/api/estadisticas` | Público | Totales, conteos por estado/categoría y reportes recientes. |

La lista de reportes acepta `pagina`, `limite`, `categoriaId`, `estado`, `q`, `orden` (`recientes`, `antiguos` o `mas_comentados`) y `usuarioId`.

## Pruebas rápidas

1. Importa `pruebas.http` en VS Code con REST Client o úsalo como referencia para Postman.
2. Ejecuta `npm test` para las pruebas automatizadas de esquemas y middleware.
3. Inicia sesión como admin con `admin@foro.com` y el valor local de `ADMIN_PASSWORD`; usa `data.token` como Bearer token admin. Registra/inicia sesión como estudiante para obtener un segundo token.
4. Registra un correo mixto como `Ana@x.com` e inicia sesión con `ana@x.com`; debe acceder a la misma cuenta.
5. Crea un reporte usando `categoriaId: "1"` y solicita `limite=100` en reportes y comentarios; el reporte debe aceptar la categoría y ambas listas indicar `limite: 50`.
6. Prueba cambiar estado con el token del autor y con el de admin (200 y reporte completo), y con otro estudiante (403).
7. Comprueba que contraseñas de registro/cambio de más de 72 caracteres y JSON mal formado respondan 400, y que un JWT vencido responda 401 con el código indicado.
8. Ejecuta `npm run prisma:seed` dos veces y confirma que no duplica datos. Revisa que la lista de usuarios no exponga correo ni `passwordHash`.

## Notas de esquema

El esquema incluye el rol por defecto `estudiante` y la unicidad del nombre de categoría. `npm run prisma:push` sincroniza los cambios sin generar migraciones SQL versionadas. Antes de sincronizar una base existente, confirma que no tenga nombres de categorías duplicados.
