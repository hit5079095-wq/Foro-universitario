# Foro Universitario

Backend Node.js para reportes de problemas del campus.

## Configuración

1. Crea tu archivo `.env` copiando la plantilla:

   ```powershell
   Copy-Item .env.example .env
   ```

2. En Supabase, abre **Project Settings → Database → Connection string** y copia las credenciales de tu proyecto. Colócalas en `.env`:
   - `DATABASE_URL`: URL del pooler de Supabase en modo transacción (puerto `6543` y `pgbouncer=true`).
   - `DIRECT_URL`: URL directa de PostgreSQL (puerto `5432`), usada por Prisma para tareas de administración del esquema.
   - Reemplaza `[REF]`, `[PASSWORD]` y `[REGION]` de `.env.example` por los valores de tu proyecto. Si la contraseña contiene caracteres especiales, codifícala para una URL.
   - Define también `JWT_SECRET` con un valor secreto propio. No compartas ni subas `.env` al repositorio.
   - Completa `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` y `SUPABASE_JWKS_URL` desde la configuración de API Keys de tu proyecto. Mantén `SUPABASE_SECRET_KEY` únicamente en el backend; no la publiques ni la uses en el cliente.

3. Desde la raíz del proyecto, instala las dependencias y configura la base compartida:

   ```powershell
   npm install
   npx prisma generate
   npm run prisma:push
   npm run prisma:seed
   npm start
   ```

Todos los integrantes deben configurar en su `.env` las URLs del mismo proyecto de Supabase para usar la misma base de datos. `prisma:push` sincroniza el esquema; no borres tablas de una base compartida que ya tenga datos.
