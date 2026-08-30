# Cotizaciones González

PWA local-first para crear cotizaciones de Acabados Modernos González, trabajar sin conexión y exportar la hoja aprobada como PDF o imagen.

## Desarrollo local

```bash
npm install
npm run dev
```

## Respaldo privado con Supabase

La app funciona sin Supabase. Para activar el respaldo:

1. Crea un proyecto y un usuario privado en Supabase.
2. Copia `.env.example` a `.env.local` y completa la URL y la clave publicable. Nunca uses una clave `service_role` en la PWA.
3. Vincula el proyecto y aplica la migración:

```bash
npx supabase login
npx supabase link --project-ref TU_PROJECT_REF
npx supabase db push
```

La migración habilita RLS por propietario y crea el bucket privado `business-assets`. Las pruebas SQL locales requieren Docker Desktop o Podman:

```bash
npx supabase start
npx supabase db reset
npx supabase test db
```

## Verificación

```bash
npm run lint
npm run typecheck
npm test -- --run
npm run build
npm run test:e2e
```
