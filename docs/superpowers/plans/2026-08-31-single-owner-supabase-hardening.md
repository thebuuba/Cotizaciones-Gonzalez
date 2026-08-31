# Single-Owner Supabase Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the single-owner PWA save locally without delay, synchronize immediately with Supabase when online, recover automatically after offline use, and complete the audited Auth and production-security fixes.

**Architecture:** IndexedDB remains the single fast working copy and transactional outbox. Supabase remains the durable cross-device copy; one non-overlapping sync engine pushes queued writes and reconciles remote state on saves, startup, connectivity, focus, visibility, a 60-second visible timer, and manual requests. Auth stays above private routes and gains explicit recovery and error states, while Postgres rejects stale versions without weakening RLS.

**Tech Stack:** React 19, TypeScript 6, Dexie 4, Supabase JS 2, Supabase CLI/Postgres/pgTAP, Vitest, Playwright, Vite PWA, Cloudflare static assets.

**Spec:** `docs/superpowers/specs/2026-08-31-supabase-security-data-hardening-design.md`

## Global Constraints

- The product has exactly one intended owner and one persistent IndexedDB database named `cotizaciones`.
- Never delete local records or pending outbox operations on sign-out.
- The UI must save locally without waiting for network I/O.
- Supabase synchronization must start immediately when online and resume automatically after offline use.
- Concurrent sync triggers must share one in-flight run.
- No service-role key, database password, access token, owner password, or E2E password may enter Git or a `VITE_` variable.
- Create schema migrations with `supabase migration new`; do not invent migration filenames.
- Preserve all existing RLS and private Storage ownership rules.
- Run remote mutations only after local tests, advisors, and `supabase db push --linked --dry-run` succeed.

---

### Task 1: Reliable Auth and Password Recovery

**Files:**
- Create: `src/features/auth/UpdatePasswordScreen.tsx`
- Create: `src/features/auth/UpdatePasswordScreen.test.tsx`
- Modify: `src/features/auth/AuthScreen.tsx`
- Modify: `src/features/auth/AuthGate.tsx`
- Modify: `src/features/auth/AuthGate.test.tsx`
- Modify: `src/styles/global.css`

**Interfaces:**
- Consumes: configured `SupabaseClient`, Auth events, and the existing `AuthGate` child boundary.
- Produces: `UpdatePasswordScreen({ client, onComplete })`, recovery redirect `/actualizar-contrasena`, and retryable Auth initialization.

- [ ] **Step 1: Write failing tests for rejected Auth requests**

Add tests that reject `getSession`, `signInWithPassword`, and `resetPasswordForEmail`. Assert that the loading copy disappears, buttons become enabled again, and the screen exposes a Spanish `role="alert"` or `role="status"` message.

```tsx
function authClient(overrides: Record<string, unknown> = {}): AuthClient {
  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
      updateUser: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      ...overrides,
    },
  } as unknown as AuthClient
}

it('offers a retry when the initial session request fails', async () => {
  const client = authClient({ getSession: vi.fn().mockRejectedValue(new Error('sin red')) })
  render(<AuthGate client={client}><p>Privado</p></AuthGate>)
  expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos conectar')
  expect(screen.getByRole('button', { name: 'Reintentar' })).toBeEnabled()
  expect(screen.queryByText('Privado')).not.toBeInTheDocument()
})
```

- [ ] **Step 2: Run the focused Auth tests and confirm failure**

Run: `npm test -- --run src/features/auth/AuthGate.test.tsx`

Expected: FAIL because rejected session initialization has no catch/retry state and rejected form requests leave loading active.

- [ ] **Step 3: Implement explicit Auth initialization and safe form cleanup**

Subscribe to Auth events before calling `getSession()`. Track whether `PASSWORD_RECOVERY` has occurred so a late `getSession()` result cannot replace recovery state. Wrap form operations in `try/catch/finally`.

```ts
try {
  const { error } = await client.auth.signInWithPassword({ email, password })
  if (error) setMessage('No se pudo iniciar sesión. Revisa el correo y la contraseña.')
} catch {
  setMessage('No pudimos conectar. Revisa tu internet e inténtalo otra vez.')
} finally {
  setLoading(false)
}
```

Add stable input names without changing visual design:

```tsx
<input name="email" type="email" inputMode="email" autoComplete="username" spellCheck="false" value={email} onChange={(event) => setEmail(event.target.value)} required />
<input name="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
```

- [ ] **Step 4: Write failing recovery-screen tests**

Test mismatched passwords, `updateUser` errors, thrown network errors, successful updates, and the `PASSWORD_RECOVERY` Auth event.

```tsx
it('updates the password only when both values match', async () => {
  const updateUser = vi.fn().mockResolvedValue({ error: null })
  render(<UpdatePasswordScreen client={authClient({ updateUser })} onComplete={vi.fn()} />)
  await user.type(screen.getByLabelText('Nueva contraseña'), 'Nueva-Clave-123!')
  await user.type(screen.getByLabelText('Confirmar contraseña'), 'Nueva-Clave-123!')
  await user.click(screen.getByRole('button', { name: 'Guardar contraseña' }))
  expect(updateUser).toHaveBeenCalledWith({ password: 'Nueva-Clave-123!' })
})
```

- [ ] **Step 5: Run recovery tests and confirm failure**

Run: `npm test -- --run src/features/auth/AuthGate.test.tsx src/features/auth/UpdatePasswordScreen.test.tsx`

Expected: FAIL because `UpdatePasswordScreen` and the recovery Auth state do not exist.

- [ ] **Step 6: Implement the recovery screen and redirect**

Create the new screen with `new-password` autocomplete, a minimum length of 8, matching confirmation, accessible messages, and `updateUser({ password })`. Change reset email generation to:

```ts
const redirectTo = new URL('/actualizar-contrasena', window.location.origin).toString()
await client.auth.resetPasswordForEmail(email, { redirectTo })
```

When the update succeeds, call:

```ts
window.history.replaceState({}, '', '/')
onComplete()
```

Render recovery only for a valid recovery Auth event/session; a bare visit to the pathname must not expose the form.

- [ ] **Step 7: Run Auth tests and the full component suite**

Run: `npm test -- --run src/features/auth/AuthGate.test.tsx src/features/auth/UpdatePasswordScreen.test.tsx`

Expected: PASS.

Run: `npm test -- --run`

Expected: all tests PASS.

- [ ] **Step 8: Commit the Auth change**

```bash
git add src/features/auth src/styles/global.css
git commit -m "feat: complete secure password recovery"
```

---

### Task 2: Immediate Online Sync and Automatic Offline Recovery

**Files:**
- Modify: `src/app/providers.tsx`
- Create: `src/app/providers.test.tsx`
- Modify: `src/sync/syncEngine.test.ts`
- Modify: `tests/e2e/offline.spec.ts`

**Interfaces:**
- Consumes: `SyncEngine.run()`, Dexie outbox `liveQuery`, browser online/focus/visibility events.
- Produces: one sync cycle on startup, outbox changes, online, focus, visible, every 60 seconds while online and visible, and manual `syncNow()`.

- [ ] **Step 1: Write failing lifecycle tests with fake timers**

Mock `SyncEngine.run`, render `SyncProvider` with an authenticated client/session, and assert trigger behavior and cleanup.

```tsx
vi.useFakeTimers()
render(<SyncProvider><p>Privado</p></SyncProvider>)
window.dispatchEvent(new Event('focus'))
await vi.advanceTimersByTimeAsync(60_000)
expect(run).toHaveBeenCalledTimes(expectedRuns)
unmount()
await vi.advanceTimersByTimeAsync(60_000)
expect(run).toHaveBeenCalledTimes(expectedRuns)
```

Cover:

- startup run;
- online event;
- focus event;
- visibility returning to `visible`;
- timer runs only when visible and online;
- cleanup removes listeners and interval;
- two simultaneous triggers still produce one cloud batch through `SyncEngine.run()`.
- sign-out awaits the current or final sync attempt before calling `client.auth.signOut()` and never clears IndexedDB.

- [ ] **Step 2: Run lifecycle tests and confirm failure**

Run: `npm test -- --run src/app/providers.test.tsx src/sync/syncEngine.test.ts`

Expected: FAIL because focus and periodic pull are not registered.

- [ ] **Step 3: Implement the lifecycle without changing repository semantics**

Keep local repository transactions and the outbox unchanged. Add focus and a 60-second timer around the existing engine:

```ts
const retry = () => { void engine.run() }
const foreground = () => { if (document.visibilityState === 'visible') retry() }
const periodic = window.setInterval(() => {
  if (navigator.onLine && document.visibilityState === 'visible') retry()
}, 60_000)

window.addEventListener('online', retry)
window.addEventListener('focus', retry)
document.addEventListener('visibilitychange', foreground)
void engine.run()
```

Cleanup must unsubscribe Dexie and state listeners, remove all three browser listeners, and call `clearInterval(periodic)`.

Update the context action so a pending online run settles before Auth closes, while offline `run()` returns immediately:

```ts
signOut: client ? async () => {
  await engine?.run()
  const { error } = await client.auth.signOut()
  if (error) throw error
} : undefined
```

- [ ] **Step 4: Strengthen the offline browser test**

After editing offline, restore connectivity without reloading. Wait for `Sincronizado`, open a fresh browser context, sign in, and assert the remote-restored quotation contains `Cambio guardado sin conexión`.

```ts
await context.setOffline(false)
await expect(page.getByText('Sincronizado')).toBeVisible()
const secondContext = await browser.newContext()
// sign in and verify the cloud-restored observation
```

- [ ] **Step 5: Run unit and browser sync tests**

Run: `npm test -- --run src/app/providers.test.tsx src/sync/syncEngine.test.ts`

Expected: PASS.

Run with configured E2E credentials: `npx playwright test tests/e2e/offline.spec.ts --project="Offline Chromium" --workers=1`

Expected: PASS and no manual reload is required to upload the offline edit.

- [ ] **Step 6: Commit synchronization lifecycle changes**

```bash
git add src/app/providers.tsx src/app/providers.test.tsx src/sync/syncEngine.test.ts tests/e2e/offline.spec.ts
git commit -m "feat: synchronize automatically online and after offline use"
```

---

### Task 3: Reject Stale Cloud Writes and Add the Missing Index

**Files:**
- Create with CLI: the exact migration path emitted by `supabase migration new prevent_stale_sync`
- Create: `supabase/tests/sync_versioning.test.sql`
- Modify: `supabase/tests/quotation_backup_rls.test.sql`

**Interfaces:**
- Consumes: `version bigint` already sent by `SupabaseCloudAdapter`.
- Produces: `public.preserve_newer_backup_version()` trigger function and `quotations_owner_client_idx`.

- [ ] **Step 1: Start the local Supabase stack and establish the failing database tests**

Run: `supabase start`

Run: `supabase test db --local supabase/tests`

Expected before new assertions: existing pgTAP test passes.

Add a new pgTAP transaction that inserts version 2, attempts version 1, and expects version 2 to remain. Assert the covering index with:

```sql
select has_index(
  'public', 'quotations', 'quotations_owner_client_idx',
  array['owner_id', 'client_id'],
  'quotations has a covering owner-client index'
);
```

```sql
select is(
  (select version from public.quotations where owner_id = test_owner and id = 'versioned-quote'),
  2::bigint,
  'an older upsert cannot replace the current quotation'
);
```

- [ ] **Step 2: Run the new database test and confirm failure**

Run: `supabase test db --local supabase/tests/sync_versioning.test.sql`

Expected: FAIL because the older update is accepted and the index does not exist.

- [ ] **Step 3: Create the migration through the CLI**

Run: `supabase migration new prevent_stale_sync`

Use the exact path printed by the CLI for every following edit and Git command. Populate it with:

```sql
create or replace function public.preserve_newer_backup_version()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.version < old.version then
    return old;
  end if;
  return new;
end;
$$;

create trigger preserve_newer_business_profile
before update on public.business_profiles
for each row execute function public.preserve_newer_backup_version();
create trigger preserve_newer_client
before update on public.clients
for each row execute function public.preserve_newer_backup_version();
create trigger preserve_newer_quotation
before update on public.quotations
for each row execute function public.preserve_newer_backup_version();
create trigger preserve_newer_material_item
before update on public.material_items
for each row execute function public.preserve_newer_backup_version();

create index quotations_owner_client_idx
on public.quotations (owner_id, client_id);
```

- [ ] **Step 4: Reset locally and run all pgTAP tests**

Run: `supabase db reset --local`

Run: `supabase test db --local supabase/tests`

Expected: all pgTAP assertions PASS, including newer update, stale update, stale tombstone, and index coverage.

- [ ] **Step 5: Expand ownership behavior tests**

Extend `quotation_backup_rls.test.sql` so the second authenticated user cannot update or delete the owner's rows. Insert one Storage object as the setup role, then verify the owner can read/update/delete it and the second user cannot. Update the pgTAP plan count exactly.

```sql
select lives_ok(
  $$update storage.objects set metadata = '{"verified":true}' where bucket_id = 'business-assets' and name = '11111111-1111-1111-1111-111111111111/logo.png'$$,
  'owner can update an owned storage object'
);
select results_eq(
  $$delete from public.clients where owner_id = '11111111-1111-1111-1111-111111111111' returning id$$,
  array[]::text[],
  'another user cannot delete owner clients'
);
```

- [ ] **Step 6: Run local advisors and all database tests**

Run: `supabase db advisors --local --type all --level info --fail-on none`

Run: `supabase test db --local supabase/tests`

Expected: no missing quotation-client index warning and all tests PASS.

- [ ] **Step 7: Commit the migration and database tests**

```bash
git add supabase/migrations supabase/tests
git commit -m "fix: preserve newest synchronized records"
```

---

### Task 4: Remove E2E Credentials and Make Test Configuration Explicit

**Files:**
- Create: `tests/helpers/e2eCredentials.ts`
- Create: `tests/helpers/e2eCredentials.test.ts`
- Modify: `tests/e2e/helpers.ts`
- Modify: `tests/e2e/restore.spec.ts`
- Modify: `playwright.config.ts`
- Modify: `.gitignore`
- Modify: `.env.example`
- Create: `.env.e2e.example`
- Modify: `README.md`

**Interfaces:**
- Consumes: `E2E_OWNER_EMAIL` and `E2E_OWNER_PASSWORD` from an ignored `.env.e2e.local` or protected CI secrets.
- Produces: `requireE2eCredentials()` with no source-code fallback.

- [ ] **Step 1: Write a failing helper test or configuration assertion**

Extract credential validation into `tests/helpers/e2eCredentials.ts` and assert in `tests/helpers/e2eCredentials.test.ts` that missing values throw a clear setup error while provided values are returned unchanged. `tests/e2e/helpers.ts` imports the validated function.

```ts
export function requireE2eCredentials(env = process.env) {
  const email = env.E2E_OWNER_EMAIL
  const password = env.E2E_OWNER_PASSWORD
  if (!email || !password) throw new Error('Configura E2E_OWNER_EMAIL y E2E_OWNER_PASSWORD en .env.e2e.local')
  return { email, password }
}
```

- [ ] **Step 2: Remove the committed email and password**

`tests/e2e/helpers.ts` must contain no literal owner email or password. `signIn()` calls `requireE2eCredentials()` at runtime.

Load ignored test-only variables in `playwright.config.ts` without passing the password to Vite:

```ts
import { loadEnv } from 'vite'
const e2eEnv = loadEnv('e2e', process.cwd(), '')
process.env.E2E_OWNER_EMAIL ||= e2eEnv.E2E_OWNER_EMAIL
process.env.E2E_OWNER_PASSWORD ||= e2eEnv.E2E_OWNER_PASSWORD
```

- [ ] **Step 3: Correct restore-test gating**

Remove checks for Vite variables from `restore.spec.ts`; the Vite build already loads production public configuration. Skip remote tests only when the two E2E credentials are absent, and make skipped status explicit in CI output.

- [ ] **Step 4: Document ignored configuration**

Allow `.env.e2e.example` through `.gitignore`, list only placeholders in it, and document copying it to `.env.e2e.local`. Add the two public Vite variables and test-only variables to the examples without real values.

- [ ] **Step 5: Scan tracked content for credentials**

Run: `git grep -n -I -E "nata@nata\.com|Nata121212|service_role|sb_secret_"`

Expected: no real credential matches.

Run: `git ls-files '.env*'`

Expected: only `.env.example` and `.env.e2e.example`.

- [ ] **Step 6: Commit secret hygiene changes**

```bash
git add tests/helpers tests/e2e playwright.config.ts .gitignore .env.example .env.e2e.example README.md
git commit -m "test: require private end-to-end credentials"
```

---

### Task 5: Add Cloudflare Headers and Continuous Verification

**Files:**
- Create: `public/_headers`
- Create: `public/_redirects`
- Create: `.github/workflows/ci.yml`
- Create: `src/test/securityHeaders.test.ts`
- Modify: `README.md`

**Interfaces:**
- Consumes: the production Supabase origin `https://yyfrfptxzaokmfcsfoxf.supabase.co` and Vite build scripts.
- Produces: static security headers, SPA fallback for recovery deep links, and a Node 22 CI verification job.

- [ ] **Step 1: Add a failing build-artifact assertion**

Add a small Vitest test that reads `public/_headers` and asserts the required directives and exact Supabase HTTPS/WSS origins. It must reject wildcard `connect-src` and `unsafe-eval`.

```ts
expect(headers).toContain("connect-src 'self' https://yyfrfptxzaokmfcsfoxf.supabase.co wss://yyfrfptxzaokmfcsfoxf.supabase.co")
expect(headers).toContain("frame-ancestors 'none'")
expect(headers).not.toContain("unsafe-eval")
```

- [ ] **Step 2: Run the header test and confirm failure**

Run: `npm test -- --run src/test/securityHeaders.test.ts`

Expected: FAIL because `public/_headers` does not exist.

- [ ] **Step 3: Add Cloudflare headers**

Create:

```text
/*
  Content-Security-Policy: default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https://yyfrfptxzaokmfcsfoxf.supabase.co wss://yyfrfptxzaokmfcsfoxf.supabase.co; worker-src 'self' blob:; manifest-src 'self'
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
  X-Frame-Options: DENY
```

Build and confirm `dist/_headers` exists unchanged.

Add a Cloudflare SPA fallback so emailed recovery links can open the React application directly:

```text
/* /index.html 200
```

Confirm `dist/_redirects` exists after the build.

- [ ] **Step 4: Add GitHub Actions checks**

Create a Node 22 workflow for pushes and pull requests:

```yaml
name: CI
on: [push, pull_request]
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test -- --run
      - run: npm run build
        env:
          VITE_SUPABASE_URL: https://yyfrfptxzaokmfcsfoxf.supabase.co
          VITE_SUPABASE_PUBLISHABLE_KEY: ${{ secrets.VITE_SUPABASE_PUBLISHABLE_KEY }}
```

Add an authenticated E2E job guarded by repository secrets `E2E_OWNER_EMAIL`, `E2E_OWNER_PASSWORD`, and `VITE_SUPABASE_PUBLISHABLE_KEY`; never print their values.

- [ ] **Step 5: Verify headers, workflow syntax, and production build**

Run: `npm test -- --run src/test/securityHeaders.test.ts`

Run: `npm run build`

Run: `git diff --check`

Expected: tests and build PASS; `dist/_headers` exists; no whitespace errors.

- [ ] **Step 6: Commit deployment hardening**

```bash
git add public/_headers public/_redirects src/test/securityHeaders.test.ts .github/workflows/ci.yml README.md
git commit -m "build: add production security verification"
```

---

### Task 6: Deploy Database and Configure the Single-Owner Auth Project

**Files:**
- Modify only if verified necessary: `supabase/config.toml`
- No secrets committed.

**Interfaces:**
- Consumes: linked Supabase project `yyfrfptxzaokmfcsfoxf`, saved database credential, and authenticated Supabase Dashboard session.
- Produces: deployed version guard/index, disabled public sign-up, correct recovery redirect, and leaked-password protection when the subscription allows it.

- [ ] **Step 1: Verify the exact migration delta**

Run: `supabase migration list --linked`

Run: `supabase db push --linked --dry-run`

Expected: exactly one pending stale-sync/index migration; no destructive table or policy changes.

- [ ] **Step 2: Apply and verify the migration**

Run: `supabase db push --linked`

Run a read-only catalog query through `supabase db query --linked` confirming four triggers and `quotations_owner_client_idx`. Then run:

`supabase db advisors --linked --type all --level info --fail-on none`

Expected: the unindexed foreign-key warning is gone.

- [ ] **Step 3: Configure Auth narrowly in the Dashboard**

In the linked production project:

- disable general and email public sign-up;
- keep anonymous sign-ins disabled;
- preserve the current production Site URL;
- add the exact production `/actualizar-contrasena` redirect and localhost recovery URL for development;
- set minimum password length to at least 8;
- enable leaked-password protection if the subscription exposes it.

Do not run `supabase config push`, because the committed config currently contains localhost URLs and would overwrite production settings beyond this task.

- [ ] **Step 4: Rotate the sole owner's exposed password**

Trigger the implemented recovery flow for the owner. The owner enters a new password that is never pasted into chat or committed. Store it only in ignored `.env.e2e.local` and protected CI secrets if the production account must continue serving E2E tests.

- [ ] **Step 5: Verify Auth and advisors remotely**

Confirm:

- old password no longer signs in;
- new password signs in;
- a recovery link opens the update screen;
- public sign-up is rejected;
- `supabase db advisors --linked --type security --level info --fail-on none` no longer reports leaked-password protection, or record that the plan does not support it.

- [ ] **Step 6: Record configuration outcome**

Update `README.md` with the actual Auth configuration and any subscription limitation. Commit documentation only; never commit dashboard values that are secret.

```bash
git add README.md
git commit -m "docs: record production Supabase security settings"
```

---

### Task 7: Full Verification, Production Smoke Test, and Main-Branch Handoff

**Files:**
- Modify only for defects revealed by verification.

**Interfaces:**
- Consumes: all prior commits and configured local/CI E2E secrets.
- Produces: verified build, database, PWA, production Auth, sync, and clean Git history ready for push.

- [ ] **Step 1: Run all local static and unit checks**

Run:

```bash
npm run lint
npm run typecheck
npm test -- --run
npm audit --omit=dev
npm run build
```

Expected: zero lint errors, TypeScript errors, unit failures, production dependency vulnerabilities, or build failures.

- [ ] **Step 2: Run database verification**

Run:

```bash
supabase test db --local supabase/tests
supabase migration list --linked
supabase db advisors --linked --type all --level info --fail-on none
```

Expected: all pgTAP assertions PASS, local/remote migration histories match, missing index warning absent.

- [ ] **Step 3: Run the full browser suite**

Run: `npx playwright test --workers=1`

Expected: login, recovery UI, offline upload/reconnect, fresh-context restore, quotation flow/export, responsive UI, palette, and PWA installation PASS. Any environment-dependent skip must be explained and must not be reported as passing.

- [ ] **Step 4: Test deployed production behavior**

On the production Cloudflare URL:

- anonymous visit shows login and no cached business data;
- owner login restores Supabase data;
- online edit reaches `Sincronizado`;
- offline edit remains available and shows `Sin conexión` or `Pendiente`;
- reconnect uploads automatically without reload;
- a fresh browser context restores that edit from Supabase;
- password recovery completes;
- PWA remains installable on iPhone.

- [ ] **Step 5: Inspect final Git state and request code review**

Run: `git status --short --branch`

Run: `git log --oneline origin/main..HEAD`

Run: `git diff --check origin/main...HEAD`

Expected: no unrelated or uncommitted changes and a reviewable sequence of focused commits.

- [ ] **Step 6: Push only after verification**

Run: `git push origin main`

Expected: push succeeds and Cloudflare deploy starts from the verified main commit.
