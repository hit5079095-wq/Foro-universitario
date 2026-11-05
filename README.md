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

   El seed necesita `ADMIN_PASSWORD`; crea o actualiza el administrador `admin@foro.com`, tres estudiantes de demostración, categorías, ocho reportes y comentarios. Puede ejecutarse más de una vez sin duplicar estos registros. Los estudiantes de demostración usan `Estudiante123`.

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
| `PORT` | Puerto HTTP; por defecto `3000`. |
| `SUPABASE_URL` | URL del proyecto Supabase (si se necesita para integración adicional). |
| `SUPABASE_PUBLISHABLE_KEY` | Clave pública de Supabase (si se necesita para integración adicional). |
| `SUPABASE_SECRET_KEY` | Clave secreta de Supabase; mantener únicamente en el servidor. |
| `SUPABASE_JWKS_URL` | URL JWKS de Supabase (si se necesita para integración adicional). |

## Endpoints

Las rutas protegidas requieren `Authorization: Bearer <token>`. Los errores de validación devuelven HTTP 400 y detalle por campo en `data.errores`.

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
| PATCH | `/api/reportes/:id/estado` | Admin | Cambia estado. |
| GET / POST | `/api/reportes/:id/comentarios` | Público / Token | Lista comentarios paginados o agrega uno. |
| PUT / DELETE | `/api/comentarios/:id` | Token | Edita propio o borra propio/comentario moderado por admin. |
| GET | `/api/usuarios` | Admin | Lista usuarios sin correo ni hash de contraseña. |
| GET | `/api/usuarios/:id/reportes` | Público | Lista reportes de un usuario, paginados. |
| GET | `/api/estadisticas` | Público | Totales, conteos por estado/categoría y reportes recientes. |

La lista de reportes acepta `pagina`, `limite`, `categoriaId`, `estado`, `q`, `orden` (`recientes`, `antiguos` o `mas_comentados`) y `usuarioId`.

## Pruebas con Postman

1. Importa `pruebas.http` como referencia para las solicitudes, o crea una colección equivalente en Postman.
2. Ejecuta `/api/auth/login` con `admin@foro.com` y el valor local de `ADMIN_PASSWORD`; copia `token` a la autorización Bearer de Postman.
3. Para rutas de estudiante, registra e inicia sesión con una cuenta de prueba. El seed crea `ana@foro.com`, `luis@foro.com` y `sofia@foro.com` con clave `Estudiante123`.
4. Verifica los endpoints de salud y documentación, lista categorías/reportes y prueba operaciones protegidas con tokens de ambos roles.
5. Prueba entradas inválidas, permisos, paginación y filtros; comprueba que las respuestas no exponen `passwordHash` ni correos de otros usuarios.

## Notas de esquema

El esquema incluye el rol por defecto `estudiante` y la unicidad del nombre de categoría. `npm run prisma:push` sincroniza los cambios sin generar migraciones SQL versionadas. Antes de sincronizar una base existente, confirma que no tenga nombres de categorías duplicados.
