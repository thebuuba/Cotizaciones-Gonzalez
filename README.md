# Cotizaciones González

PWA privada para una sola persona. Guarda primero en IndexedDB, sincroniza inmediatamente con Supabase cuando hay internet y conserva una cola local cuando no hay conexión.

## Desarrollo local

```bash
npm install
copy .env.example .env.local
npm run dev
```

Completa `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`. La aplicación bloquea el acceso si Supabase no está configurado. Nunca uses una clave `service_role` o `sb_secret_` en la PWA.

## Supabase

```bash
supabase login
supabase link --project-ref yyfrfptxzaokmfcsfoxf
supabase migration list --linked
supabase db push --linked --dry-run
supabase db push --linked
```

RLS limita las filas al propietario y `business-assets` es privado. La sincronización ocurre al iniciar, guardar, recuperar internet, volver a la app, cada 60 segundos mientras está visible y desde el botón manual.

## Pruebas E2E privadas

Copia `.env.e2e.example` a `.env.e2e.local` y completa las credenciales del único propietario. Este archivo está ignorado por Git.

```bash
npm run test:e2e
```

## Keep-alive de Supabase

El workflow `Supabase keep-alive` consulta la base cada seis horas, a las
00:17, 06:17, 12:17 y 18:17 UTC. Se puede ejecutar manualmente desde Actions.
Configura en el repositorio de GitHub la variable `SUPABASE_URL` y el secreto
`SUPABASE_PUBLISHABLE_KEY` con la URL y clave pública del proyecto.

La consulta anónima a `export_diagnostics` debe responder `200` con `[]`:
comprueba PostgreSQL sin exponer filas protegidas por RLS ni usar claves de
administrador. No modifica datos y falla si la consulta no funciona o devuelve filas.

Esto reduce el riesgo de pausa por inactividad en Free; no garantiza que nunca
se pause. [Supabase recomienda un plan de pago para evitar esa pausa](https://supabase.com/docs/guides/platform/free-project-pausing).
Además, [GitHub desactiva los workflows programados de repositorios públicos tras 60 días sin actividad](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/disable-and-enable-workflows).
Revisa Actions y sus avisos de fallo, y vuelve a habilitar el workflow si se desactiva.

## Verificación esencial

```bash
npm run lint
npm run typecheck
npm test -- --run --exclude .worktrees/**
npm run build
```
