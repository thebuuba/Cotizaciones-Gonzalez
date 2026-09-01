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

## Verificación esencial

```bash
npm run lint
npm run typecheck
npm test -- --run --exclude .worktrees/**
npm run build
```
