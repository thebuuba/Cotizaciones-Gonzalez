# Single-Owner Supabase Hardening Design

## Objective

Harden the single-owner quotation PWA so authentication reliably gates the application, password recovery works end to end, offline synchronization cannot overwrite newer cloud data, and production security checks are repeatable through the Supabase CLI.

## Product Constraint

The application is intentionally operated by one person with one Supabase Auth account. It is not a multi-user product and must not expose public sign-up. The local IndexedDB database belongs to that one installation and should remain available across sign-out, offline use, and application updates.

## Current State

- Supabase project `yyfrfptxzaokmfcsfoxf` is linked through the CLI and reports `ACTIVE_HEALTHY`.
- Local and remote migration history both contain `20260830185820`.
- The remote project contains one Auth user and one data owner, with 14 clients, 11 quotations, and 70 material items.
- Row Level Security is enabled on all application tables. Ownership policies use `(select auth.uid()) = owner_id` for SELECT, INSERT, UPDATE, and DELETE.
- The `business-assets` bucket is private and has owner-scoped SELECT, INSERT, UPDATE, and DELETE policies.
- Supabase advisors report leaked-password protection disabled and an unindexed `quotations(owner_id, client_id)` foreign key.
- The application uses one IndexedDB database named `cotizaciones`, which is correct for the single-owner offline-first model.
- The existing outbox already uploads local writes on startup, connectivity recovery, visibility changes, and queue changes, but it does not periodically pull remote changes while the application remains open and visible.
- Password reset sends an email but has no password-update screen.
- Cloud upserts store a version but do not prevent an older operation from replacing a newer row.

## Scope

This work includes:

1. Reliable authentication initialization, sign-in, sign-out, and password recovery.
2. Enforcement of the single-owner account model by disabling public sign-up and anonymous authentication.
3. Immediate online synchronization with automatic offline queueing and recovery.
4. Server-side stale-write protection and the missing foreign-key index.
5. Expanded database, unit, integration, and end-to-end tests.
6. Removal and rotation of committed E2E credentials.
7. Cloudflare security headers, CI checks, and documentation updates.
8. Enabling leaked-password protection when supported by the Supabase subscription.

This work does not add multiple local databases, account switching, public registration, social login, multi-factor authentication, billing, new quotation features, or a cloud-only mode.

## Architecture

### Single local database

The existing `cotizaciones` IndexedDB database and repository instances remain unchanged. This preserves offline data and pending outbox operations without a migration.

`AuthGate` remains above the application and prevents unauthenticated visitors from rendering routes or repository-backed data. Signing out hides the application but does not delete the owner's local data. The same owner can sign in again and continue immediately, including after an offline period.

Supabase public email sign-up and anonymous sign-in are disabled. New accounts may only be created deliberately by the project administrator. RLS remains enabled as defense in depth even though only one account is expected.

### Authentication and recovery

`AuthGate` becomes an explicit state machine with `loading`, `signedOut`, `signedIn`, `recovery`, and `error` states. It subscribes to Supabase Auth events before resolving the initial session so a recovery event is not lost during startup.

All asynchronous Auth operations use `try/catch/finally`. A rejected session request produces a retryable Spanish error instead of leaving the loading screen indefinitely.

The reset request redirects to `${window.location.origin}/actualizar-contrasena`. When Supabase emits `PASSWORD_RECOVERY`, `AuthGate` renders a dedicated password-update screen. The screen validates password confirmation, calls `supabase.auth.updateUser({ password })`, removes the recovery pathname after success, and returns the owner to the application.

The recovery screen is unavailable without a valid recovery session. No registration path is introduced.

### Online and offline data flow

IndexedDB remains the immediate source used by the interface. Every create, edit, status change, or deletion commits the domain change and its outbox operation atomically before the interface reports that the local save completed. Network latency therefore never blocks the editor or risks a partially saved form.

When the browser is online, the outbox change triggers synchronization immediately. The engine pushes pending operations to Supabase, pulls the current cloud backup, resolves it into IndexedDB, and updates the visible data through Dexie live queries. Supabase is therefore the durable cross-device copy while IndexedDB remains the fast working copy.

When the browser is offline or Supabase is temporarily unreachable, the operation remains in the outbox with retry metadata. The application continues to read and write IndexedDB. Synchronization resumes automatically without user intervention when connectivity returns.

Synchronization runs on these events:

1. Authenticated application startup.
2. Every new outbox operation.
3. Browser `online` events.
4. Window focus and document visibility returning to `visible`.
5. Every 60 seconds while the application is online and visible.
6. Manual synchronization from settings.

Concurrent calls continue to share one in-flight synchronization promise so timers and browser events cannot run overlapping cycles. Periodic synchronization stops on sign-out and component unmount.

The interface exposes four accurate states: `Sincronizado`, `Pendiente`, `Sin conexión`, and `Error`. A local save is never labeled synchronized until its outbox operation has reached Supabase and the reconciliation pull has completed.

### Synchronization conflict rule

The server is the arbiter when the owner's devices send different versions of the same entity. A migration adds a normal `SECURITY INVOKER` trigger function to each backup table. On UPDATE:

- `NEW.version >= OLD.version`: accept the incoming row.
- `NEW.version < OLD.version`: preserve and return the existing row.

The client clears the completed stale outbox operation because the following restore phase downloads the preserved cloud row and replaces the obsolete local copy. Tombstones follow the same version rule.

The migration also creates a covering index on `quotations(owner_id, client_id)` for the existing composite foreign key.

The trigger function sets an explicit empty `search_path`, is not `SECURITY DEFINER`, and does not bypass RLS.

### Supabase security configuration

Remote Auth configuration is changed narrowly rather than pushing the local `config.toml`, whose localhost URLs are not production values. The production settings must preserve the deployed site URL and allowed recovery redirect while disabling public sign-up and anonymous sign-in.

Leaked-password protection is enabled only if the project's plan supports it. If the Management API rejects the setting because of subscription level, implementation records that limitation and leaves all other security work complete.

No `service_role`, secret API key, database password, E2E password, or personal access token is committed or exposed to Vite. Frontend builds continue to receive only the Supabase URL and publishable key.

## Error Handling

- Auth network failures show actionable Spanish messages and always restore button state.
- A local save succeeds independently of network availability and becomes `Pendiente` until cloud reconciliation completes.
- Sync conflicts are resolved by version and are not reported as destructive failures.
- Genuine Supabase, RLS, or Storage failures keep the outbox entry for retry and display the existing sync error state.
- Password-update success and failure are announced through accessible live regions.
- Sign-out waits for local synchronization work to settle before closing the Auth session, without deleting the offline database.

## Security Headers

Cloudflare static deployment receives a `public/_headers` file with, at minimum:

- `Content-Security-Policy` restricted to the application origin and the configured Supabase HTTPS/WSS origin.
- `X-Content-Type-Options: nosniff`.
- `Referrer-Policy: strict-origin-when-cross-origin`.
- `Permissions-Policy` disabling unused sensitive browser capabilities.
- `X-Frame-Options: DENY` or equivalent CSP `frame-ancestors 'none'`.

The policy must preserve PWA service-worker operation, local image/blob previews, Supabase REST/Auth/Storage calls, and Realtime WebSocket connections.

## Testing Strategy

### Unit and component tests

- Initial session success, missing session, and rejected `getSession()`.
- Sign-in and password-reset network rejection always clear loading state.
- `PASSWORD_RECOVERY` renders the update form.
- Password mismatch, weak-password response, successful `updateUser`, and invalid recovery session.
- Sign-out hides repository-backed routes without clearing IndexedDB.
- Sync lifecycle events start one run, never overlap, and stop after unmount.
- A local save made online triggers an immediate push and pull.
- A local save made offline remains pending and uploads after an `online` event.
- The 60-second visible timer pulls remote changes made by another device.

### Database and synchronization tests

- Cross-owner SELECT, INSERT, UPDATE, and DELETE remain blocked on every application table.
- Storage read, insert, update, and delete remain owner-scoped.
- A newer version replaces an older version.
- An older update or tombstone cannot replace a newer version.
- The composite quotation-client foreign key has a covering index.
- Supabase security and performance advisors are executed after deployment.

### End-to-end and CI

- E2E credentials are mandatory environment variables with no source fallback.
- Login, offline usage, restore, recovery UI, quotation flow, installability, and export remain covered.
- Browser tests verify that offline edits upload automatically after connectivity returns without a manual reload.
- CI runs lint, typecheck, unit tests, production build, and non-secret browser tests on every push.
- Remote restore and database tests run only when the required protected CI secrets are configured; otherwise CI reports them as unavailable rather than pretending they passed.

## Deployment Sequence

1. Coordinate a new password for the sole owner and rotate the password committed in E2E helpers.
2. Remove the credential fallbacks before using the account again.
3. Implement and verify Auth changes locally with failing-first tests.
4. Create the SQL migration using `supabase migration new`.
5. Test migrations and pgTAP policies against the local Supabase stack.
6. Run `supabase db advisors --local` and all application checks.
7. Run `supabase db push --linked --dry-run` and review the exact remote change.
8. Apply the migration with `supabase db push --linked`.
9. Change only the intended production Auth settings and preserve production URLs.
10. Query the remote catalog and run linked advisors to verify the deployed index, trigger, RLS, Storage, and Auth configuration.
11. Deploy the frontend and execute production smoke tests for login, recovery, sync, offline operation, and PWA installation.

## Acceptance Criteria

- An unauthenticated visitor cannot render application data.
- The single local database and pending outbox operations survive sign-out and upgrades.
- Online saves synchronize immediately without blocking the local save on network latency.
- Offline saves remain usable and upload automatically after connectivity returns.
- Remote changes become visible on startup, focus, visibility recovery, or within 60 seconds while the app remains open.
- Public sign-up and anonymous authentication are disabled.
- Password recovery completes inside the application.
- Auth failures never leave permanent loading or disabled states.
- An older device update cannot overwrite a newer cloud version.
- RLS and Storage ownership tests pass for all CRUD operations.
- No credentials remain hard-coded or tracked.
- Supabase advisors no longer report the missing quotation-client index.
- Leaked-password protection is enabled, or its subscription limitation is explicitly recorded.
- Lint, typecheck, unit tests, E2E tests, build, and PWA generation complete successfully.
