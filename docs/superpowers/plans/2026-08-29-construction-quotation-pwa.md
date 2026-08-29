# Construction Quotation PWA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an installable, local-first iOS PWA for one construction contractor to create, store, synchronize, and export branded quotations as PDF.

**Architecture:** React renders the app shell and feature screens. Dexie/IndexedDB is the source of truth and a transactional outbox records cloud work. A small sync engine exchanges owner-scoped records and private images with Supabase. PDF generation consumes an immutable quotation snapshot locally, so quoting and export continue to work offline.

**Tech Stack:** React 19.2.8, TypeScript 6.0.3 (latest version compatible with typescript-eslint 8.68.0), Vite 8.2.2, React Router 7.18.3, Dexie 4.4.5, Supabase JS 2.112.4, React Hook Form 7.86.0, Zod 4.5.4, React PDF 4.9.0, vite-plugin-pwa 1.3.0, Vitest 4.1.11, Testing Library, Playwright 1.62.1, Supabase CLI 2.116.0.

**Spec:** `docs/superpowers/specs/2026-08-29-construction-quotation-pwa-design.md`

## Global constraints

- Treat IndexedDB as the primary store; every user mutation commits locally before any network call.
- Store money as integer minor units and discount percentages as basis points (`1000 = 10%`). Never use floating point for totals.
- The first release supports one active editing device. A replacement device can restore cloud data after sign-in.
- Every cloud row has `owner_id`; enable RLS and deny anonymous access. Images live in a private bucket.
- Keep secrets out of the repository. Only the public Supabase URL and anon/publishable key may be exposed to the browser.
- Use one centered create button, 44 px minimum targets, iOS safe areas, visible focus, reduced-motion support, light/dark themes, and the approved brand palette.
- Autosave quotation drafts. Never allow a service-worker refresh to discard dirty form state.
- Generate PDFs locally and retain a download fallback when Web Share is unavailable or rejected.

## Official implementation references

- Vite PWA React registration: https://github.com/vite-pwa/vite-plugin-pwa/blob/main/docs/frameworks/react.md
- Dexie React integration: https://dexie.org/docs/Tutorial/React
- Supabase React setup: https://supabase.com/docs/guides/getting-started/quickstarts/reactjs
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Storage access control: https://supabase.com/docs/guides/storage/security/access-control
- React PDF browser API: https://v4.react-pdf.org/
- Web Share files: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share
- Playwright service workers: https://playwright.dev/docs/service-workers

## File map

```text
.
├── .env.example
├── index.html
├── package.json
├── playwright.config.ts
├── tsconfig.json
├── vite.config.ts
├── public/
│   ├── icons/
│   └── fonts/Inter-Variable.woff2
├── src/
│   ├── app/{App.tsx,router.tsx,providers.tsx}
│   ├── components/{AppShell.tsx,BottomNav.tsx,Fab.tsx,StatusBadge.tsx,SyncBadge.tsx}
│   ├── db/{database.ts,repositories.ts,seed.ts}
│   ├── domain/{types.ts,money.ts,quotation.ts}
│   ├── features/auth/{AuthGate.tsx,AuthScreen.tsx}
│   ├── features/business/{BusinessProfileForm.tsx,businessProfileSchema.ts}
│   ├── features/clients/{ClientsPage.tsx,ClientForm.tsx,clientSchema.ts}
│   ├── features/home/HomePage.tsx
│   ├── features/images/{compressImage.ts,ImagePicker.tsx}
│   ├── features/pdf/{QuotationDocument.tsx,pdfService.ts,PdfPreviewPage.tsx}
│   ├── features/quotations/{QuotationsPage.tsx,QuotationEditor.tsx,QuotationDetailPage.tsx,quotationSchema.ts,useAutosave.ts}
│   ├── features/settings/SettingsPage.tsx
│   ├── pwa/{PwaUpdatePrompt.tsx,register.ts}
│   ├── sync/{cloudAdapter.ts,syncEngine.ts,syncStatus.ts}
│   ├── styles/{tokens.css,global.css}
│   ├── test/{setup.ts,factories.ts}
│   └── main.tsx
├── supabase/
│   ├── config.toml
│   ├── migrations/202608290001_initial.sql
│   ├── migrations/202608290002_storage.sql
│   └── tests/rls.test.sql
└── tests/e2e/{offline.spec.ts,quotation-flow.spec.ts,sync.spec.ts}
```

## Task 1: Project foundation, test harness, and installable shell

**Files:** Create `package.json`, `index.html`, `tsconfig.json`, `vite.config.ts`, `playwright.config.ts`, `.env.example`, `src/main.tsx`, `src/app/App.tsx`, `src/test/setup.ts`, `src/styles/tokens.css`, `src/styles/global.css`, `src/pwa/register.ts`, `src/pwa/PwaUpdatePrompt.tsx`, `public/icons/*`.

- [x] Write `src/app/App.test.tsx` asserting the app name, bottom navigation, one centered create action, and no duplicate top-right create action.
- [x] Run `npm test -- --run src/app/App.test.tsx`; confirm failure because the project is not scaffolded.
- [x] Scaffold Vite React TypeScript and pin compatible versions. Add scripts: `dev`, `build`, `lint`, `test`, `test:watch`, `test:e2e`, `typecheck`.
- [x] Add semantic tokens for the approved blues and state colors, surfaces, typography, spacing, radii, shadows, safe-area insets, dark mode, focus rings, and 44 px targets.
- [x] Configure the web manifest (`name`, `short_name`, `display: standalone`, portrait orientation, theme/background colors, 192/512/maskable icons) and `registerType: 'prompt'`.
- [x] Implement the minimal shell and update prompt; defer reload while a form reports dirty state.
- [x] Run `npm test -- --run src/app/App.test.tsx`, `npm run typecheck`, and `npm run build`; confirm all pass.
- [x] Commit: `feat: scaffold installable quotation PWA`.

## Task 2: Domain types, money arithmetic, and quotation rules

**Files:** Create `src/domain/types.ts`, `src/domain/money.ts`, `src/domain/quotation.ts`, `src/domain/money.test.ts`, `src/domain/quotation.test.ts`, `src/test/factories.ts`.

- [x] Define `Currency = 'DOP' | 'USD'`, quotation/status/sync unions, normalized entity types, and immutable `QuotationSnapshot`.
- [x] Define `Discount` as `{type:'none';value:0} | {type:'percentage';value:number} | {type:'fixed';value:number}` where fixed values are minor units and percentages are basis points.
- [x] Write failing table tests for `calculateTotals(pricesMinor, discount)`: empty items, two prices, percentage rounding, fixed discount, discount capped at subtotal, and both currencies.
- [x] Write failing tests for `formatMoney`, `validateQuotationForExport`, and `duplicateQuotation(source, now)`; duplication must assign new IDs, clear status to draft, retain client/project/items, and exclude sync metadata.
- [x] Run `npm test -- --run src/domain`; confirm failures.
- [x] Implement integer-only totals, `Intl.NumberFormat`, export validation, snapshot creation, and duplication. Keep functions pure.
- [x] Run `npm test -- --run src/domain` and `npm run typecheck`; confirm pass.
- [x] Commit: `feat: define quotation domain and money rules`.

## Task 3: Dexie database, local repositories, and transactional outbox

**Files:** Create `src/db/database.ts`, `src/db/repositories.ts`, `src/db/seed.ts`, `src/db/repositories.test.ts`; update `src/app/providers.tsx`.

- [x] Model Dexie tables for `businessProfiles`, `clients`, `projectLocations`, `quotations`, `workItems`, `quotationImages`, and `outbox`; index quotation, status, updated time, and outbox retry time. Owner indexes are added with cloud ownership in Task 8.
- [x] Define `QuotationRepository { get, list, save, duplicate, softDelete }` and `OutboxRepository { enqueue, nextBatch, markSucceeded, markFailed }`.
- [x] Write failing fake-indexeddb tests proving save + outbox enqueue are one transaction, child items are replaced atomically, soft deletion is queued, and an aborted write leaves neither domain rows nor outbox rows.
- [x] Run `npm test -- --run src/db/repositories.test.ts`; confirm failure.
- [x] Implement database version 1, repositories, stable IDs, timestamps, tombstones, and idempotent outbox keys.
- [x] Add a development-only seed behind `import.meta.env.DEV`; never seed production.
- [x] Run the repository tests and `npm run typecheck`; confirm pass.
- [x] Commit: `feat: add local database and transactional outbox`.

## Task 4: App shell, home dashboard, and business profile

**Files:** Create `src/app/router.tsx`, `src/app/providers.tsx`, `src/components/*`, `src/features/home/HomePage.tsx`, `src/features/settings/SettingsPage.tsx`, `src/features/business/BusinessProfileForm.tsx`, `src/features/business/businessProfileSchema.ts`; add corresponding tests.

- [x] Write failing UI tests for active tabs, monthly quoted total, draft/sent/approved counters, recent quotations, sync badge, dark mode behavior, and business-profile validation.
- [x] Run those tests; confirm failure.
- [x] Implement routes for Home, Quotations, Clients, Settings, and editor/detail/preview children. Build the screenshot-inspired dashboard with no top-right plus.
- [x] Implement profile fields: logo, business name, owner, phone, email, address, and signature. Persist locally and enqueue changes.
- [x] Use pale status backgrounds with dark text for green/amber states; preserve WCAG AA contrast for body text.
- [x] Run feature tests, `npm run typecheck`, and `npm run build`; confirm pass.
- [x] Commit: `feat: add dashboard shell and business profile`.

## Task 5: Client and project-location management

**Files:** Create `src/features/clients/ClientsPage.tsx`, `src/features/clients/ClientForm.tsx`, `src/features/clients/clientSchema.ts`, `src/features/clients/ClientsPage.test.tsx`; extend `src/db/repositories.ts`.

- [ ] Write failing tests for creating/editing/searching a client, validating name/phone/email, maintaining multiple project locations, and selecting a location when starting a quotation.
- [ ] Run `npm test -- --run src/features/clients`; confirm failure.
- [ ] Add client/location repository methods with local transaction + outbox semantics.
- [ ] Implement mobile-first list, empty state, search, forms, and project-location picker. Preserve client contact address separately from project location.
- [ ] Run client tests and `npm run typecheck`; confirm pass.
- [ ] Commit: `feat: manage clients and project locations`.

## Task 6: Resumable quotation editor and autosave

**Files:** Create `src/features/quotations/QuotationEditor.tsx`, `src/features/quotations/quotationSchema.ts`, `src/features/quotations/useAutosave.ts`, `src/features/quotations/QuotationEditor.test.tsx`; update router and repositories.

- [ ] Write failing tests for the four editor sections: client; project/date/validity/currency; fixed-price work items; discount/images/conditions/review.
- [ ] Cover DOP/USD choice, work-item add/edit/reorder/delete, percentage/fixed discount, live subtotal/final total, required-field errors, and restoring a partial draft after remount.
- [ ] Write fake-timer tests proving autosave debounces for 400 ms and flushes on step change, `visibilitychange`, and unmount.
- [ ] Run `npm test -- --run src/features/quotations/QuotationEditor.test.tsx`; confirm failure.
- [ ] Implement React Hook Form + Zod editor. Store only fixed-price descriptions and prices; do not add quantity/unit/ITBIS/advance fields.
- [ ] Persist draft and children atomically, enqueue sync, expose dirty state to the PWA update prompt, and show save feedback without blocking typing.
- [ ] Run editor/domain/repository tests and typecheck; confirm pass.
- [ ] Commit: `feat: add autosaving quotation editor`.

## Task 7: Quotation history, detail, status, duplication, and deletion

**Files:** Create `src/features/quotations/QuotationsPage.tsx`, `src/features/quotations/QuotationDetailPage.tsx`, tests; update `src/db/repositories.ts` and `src/features/home/HomePage.tsx`.

- [ ] Write failing tests for search/filter by client/status/date, status transitions among draft/sent/approved/rejected, duplicate, soft-delete confirmation, and dashboard totals refreshing from live local queries.
- [ ] Run the feature tests; confirm failure.
- [ ] Implement the list cards, filters, detail actions, explicit status controls, duplication with the next quotation number, and recoverable local tombstones.
- [ ] Prevent deletion without confirmation and prevent accidental status change while a save is in flight.
- [ ] Run quotation and dashboard tests, typecheck, and build; confirm pass.
- [ ] Commit: `feat: add quotation lifecycle and history`.

## Task 8: Supabase schema, authentication, grants, and RLS

**Files:** Create `supabase/config.toml`, `supabase/migrations/202608290001_initial.sql`, `supabase/migrations/202608290002_storage.sql`, `supabase/tests/rls.test.sql`, `src/features/auth/AuthGate.tsx`, `src/features/auth/AuthScreen.tsx`, `src/features/auth/AuthScreen.test.tsx`, `src/lib/supabase.ts`; update `.env.example` and providers.

- [ ] Initialize the local Supabase configuration with `npx supabase@2.116.0 init` if not already present.
- [ ] Write the SQL tests first: authenticated owner can CRUD own rows; another user cannot read/write them; anonymous access fails; private storage accepts only paths beginning with the caller UUID.
- [ ] Run `npx supabase@2.116.0 db reset` and `npx supabase@2.116.0 test db`; confirm tests fail before migrations.
- [ ] Create normalized cloud tables matching local records, each with `owner_id references auth.users`, `created_at`, `updated_at`, `deleted_at`, and monotonic `version`. Add foreign keys and sync-query indexes.
- [ ] Revoke exposed-table access from `anon`; grant only required operations to `authenticated`; enable RLS on every exposed table and add owner policies using `(select auth.uid()) = owner_id`.
- [ ] Create private bucket `quotation-images` and owner-path policies for select/insert/update/delete.
- [ ] Implement email/password sign-in, session restore, sign-out, offline session UI, and friendly auth errors. Do not allow an unauthenticated cloud operation.
- [ ] Run SQL tests, auth component tests, typecheck, and build; confirm pass.
- [ ] Commit: `feat: secure cloud schema and authentication`.

## Task 9: Cloud adapter and sync engine

**Files:** Create `src/sync/cloudAdapter.ts`, `src/sync/syncEngine.ts`, `src/sync/syncStatus.ts`, `src/sync/syncEngine.test.ts`; update providers and `SyncBadge.tsx`.

- [ ] Define `CloudAdapter { push(operation): Promise<CloudRecordVersion>; pull(cursor): Promise<PullPage> }` and `SyncEngine { syncOnce(); start(); stop(); subscribe() }`.
- [ ] Write failing tests for push-before-pull ordering, 25-operation batches, idempotent replay, cursor persistence, tombstones, no overlapping runs, last-write conflict handling under the one-device assumption, and status derivation (`synced`, `pending`, `offline`, `error`).
- [ ] Add fake-timer tests for retries at 5 s, 30 s, 2 min, 10 min, and 30 min, plus triggers on sign-in, online, foreground, manual retry, and every 60 s while visible.
- [ ] Run `npm test -- --run src/sync`; confirm failure.
- [ ] Implement the Supabase adapter and engine. A failed push stays queued with attempt/error/next-attempt metadata; a successful replay must not duplicate records.
- [ ] Pull only owner-scoped versions after the cursor, merge transactionally, and never overwrite a newer dirty local record.
- [ ] Connect sync state and last-success time to the dashboard badge with an actionable retry on error.
- [ ] Run sync/repository tests and typecheck; confirm pass.
- [ ] Commit: `feat: synchronize local quotations with cloud backup`.

## Task 10: Project images, compression, and resilient upload

**Files:** Create `src/features/images/compressImage.ts`, `src/features/images/ImagePicker.tsx`, tests; update editor, database, cloud adapter, and PDF snapshot types.

- [ ] Write failing tests for file-type/25 MB validation, EXIF-safe decode, maximum 1920 px dimension, WebP output near quality 0.82, local preview, reorder/delete, and upload retry.
- [ ] Run image tests; confirm failure.
- [ ] Implement compression with browser-native `createImageBitmap`/canvas and a guarded fallback. Revoke object URLs on cleanup.
- [ ] Save the compressed blob locally before rendering success; enqueue storage upload separately to `${ownerId}/${quotationId}/${imageId}.webp`.
- [ ] Keep quotation sync usable when one image upload fails; show the failed image and retry action without losing the draft.
- [ ] Run image/editor/sync tests, typecheck, and build; confirm pass.
- [ ] Commit: `feat: attach and synchronize project images`.

## Task 11: Branded A4 PDF, preview, download, and iOS share

**Files:** Create `src/features/pdf/QuotationDocument.tsx`, `src/features/pdf/pdfService.ts`, `src/features/pdf/PdfPreviewPage.tsx`, `src/features/pdf/pdfService.test.tsx`; update quotation detail.

- [ ] Define `renderQuotationPdf(snapshot): Promise<Blob>`, `quotationPdfFilename(snapshot): string`, and `shareQuotationPdf(blob, filename): Promise<'shared' | 'downloaded'>`.
- [ ] Write failing tests for filename sanitization (`COT-0001-Maria-Rodriguez.pdf`), A4 metadata, business/client/project fields, item rows, subtotal/discount/final total, conditions/duration/notes, images, signature, page numbers, and both currencies.
- [ ] Test `navigator.canShare({files})`, share success, user cancellation (`AbortError`), unsupported sharing, and download fallback. Invoke share only from the user's click handler.
- [ ] Run PDF tests; confirm failure.
- [ ] Implement the React PDF document with bundled font, branded header, repeating table header, fixed footer, preserved image aspect ratios, and `wrap={false}` for totals/signature blocks. Configure orphan/widow protection for long text.
- [ ] Generate from an immutable local snapshot so later edits cannot change the active preview. Add preview, share, and download actions.
- [ ] Render fixture PDFs and visually inspect one single-page and one multi-page quotation for clipping, image quality, totals placement, and signature integrity.
- [ ] Run PDF tests, typecheck, and build; confirm pass.
- [ ] Commit: `feat: export branded quotation PDFs`.

## Task 12: Offline/update UX, accessibility, and end-to-end coverage

**Files:** Create `tests/e2e/quotation-flow.spec.ts`, `tests/e2e/offline.spec.ts`, `tests/e2e/sync.spec.ts`; update components/styles/PWA configuration as test findings require.

- [ ] Write the happy-path E2E: create client/location, draft quotation, add items and discount, attach image, approve, preview PDF, duplicate, and verify dashboard totals.
- [ ] Write Chromium service-worker tests with `serviceWorkers: 'allow'`: install/load offline, edit offline, reload draft, reconnect, drain outbox, and prompt for an update without losing dirty state.
- [ ] Add E2E coverage for cloud/auth failure, image-upload failure, manual retry, soft deletion, and restore into an empty browser profile.
- [ ] Run `npm run test:e2e`; confirm failures, then implement only the missing integration behavior.
- [ ] Audit keyboard order, labels, error association, focus management, 44 px targets, safe areas, color contrast, text zoom, reduced motion, portrait layouts from 320 px upward, and dark mode.
- [ ] Run `npm run lint`, `npm run typecheck`, `npm test -- --run`, `npm run build`, and `npm run test:e2e`; confirm all pass.
- [ ] Commit: `test: complete offline and accessibility release coverage`.

## Final release gate

- [ ] Run a clean install and full automated suite: `npm ci`, `npm run lint`, `npm run typecheck`, `npm test -- --run`, `npm run build`, `npm run test:e2e`.
- [ ] Run local cloud verification: `npx supabase@2.116.0 db reset` and `npx supabase@2.116.0 test db`.
- [ ] Search the production bundle and Git history for service-role keys, passwords, and unexpected personal data.
- [ ] On a real iPhone or iOS Simulator, verify Add to Home Screen, launch in standalone mode, safe areas, camera/photo selection, offline relaunch, PDF preview, Files download, share sheet, dark mode, and interrupted/resumed sync.
- [ ] Verify replacement-device restore with a fresh browser profile; document that concurrent editing on two devices is outside v1 support.
- [ ] Confirm Git is clean and retain command output/screenshots as release evidence.
- [ ] Commit final documentation: `docs: add PWA release and recovery guide`.

## Plan self-review checklist

- [x] Every approved spec section maps to at least one task and test.
- [x] No unresolved placeholder language remains.
- [x] Shared types and interfaces have one owner file and consistent signatures.
- [x] Offline mutation, sync retry, authorization, PDF fallback, and iOS-only manual checks are explicit.
- [x] Each task can be implemented and reviewed independently and ends with verification plus a focused commit.
