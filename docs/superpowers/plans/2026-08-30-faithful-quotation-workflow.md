# Faithful Quotation Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the old fixed-price quotation model with the exact Acabados Modernos González material-and-labor workflow, then export the same black, white, and gold document as PDF and PNG with local-first cloud backup.

**Architecture:** Dexie remains the immediate source of truth. Pure domain functions parse decimal quantities into thousandths and calculate every monetary result in integer cents. One paginated HTML document component is the canonical preview; high-resolution PNG captures of those same pages are downloaded directly or embedded into an A4 PDF, so preview and exports cannot drift.

**Tech Stack:** React 19, TypeScript 6, React Router 7, Dexie 4, React Hook Form, Zod 4, `html-to-image`, `jspdf`, Supabase, Vitest, Testing Library, Playwright, Vite PWA.

**Spec:** `docs/superpowers/specs/2026-08-30-acabados-modernos-quotation-redesign.md`

## Global Constraints

- All visible monetary values use Dominican pesos (`RD$`) only.
- Store money as integer cents and quantity as integer thousandths; never calculate totals with binary floating-point values.
- `total general = total de materiales + mano de obra`; no discount, ITBIS, installment, or currency fields.
- The exported document contains only client name, address, date, materials, labor, totals, observations, and configurable business content from the approved sheet.
- IndexedDB is the primary store; every mutation succeeds locally before cloud work begins.
- The document uses black, white, and gold and must paginate without cutting rows or the totals block.
- PNG export emits one high-resolution image per rendered page; PDF uses the identical rendered pages.
- Preserve the existing dashboard, client work, iPhone safe areas, 44 px controls, focus visibility, offline behavior, and private single-user scope.

---

## File Structure

```text
src/
├── app/{App.tsx,providers.tsx}
├── db/{database.ts,repositories.ts,repositories.test.ts,defaults.ts}
├── domain/{types.ts,money.ts,money.test.ts,quotation.ts,quotation.test.ts}
├── features/business/{BusinessProfileForm.tsx,businessProfileSchema.ts}
├── features/clients/{ClientsPage.tsx,ClientForm.tsx,clientSchema.ts}
├── features/quotations/
│   ├── QuotationEditor.tsx
│   ├── QuotationEditor.test.tsx
│   ├── QuotationDetailPage.tsx
│   ├── QuotationsPage.tsx
│   ├── quotationSchema.ts
│   └── useAutosave.ts
├── features/export/
│   ├── QuotationDocument.tsx
│   ├── QuotationDocument.test.tsx
│   ├── documentPagination.ts
│   ├── documentPagination.test.ts
│   ├── exportService.ts
│   └── exportService.test.ts
├── features/settings/SettingsPage.tsx
├── sync/{cloudAdapter.ts,syncEngine.ts,syncEngine.test.ts}
└── styles/{global.css,quotation-document.css}
supabase/
├── config.toml
├── migrations/202608300001_quotation_backup.sql
└── tests/quotation_backup_rls.test.sql
tests/e2e/{quotation-flow.spec.ts,offline.spec.ts,restore.spec.ts}
```

## Task 1: Preserve and finish the client-management checkpoint

**Files:**
- Modify: `src/features/clients/ClientsPage.tsx`
- Create: `src/features/clients/ClientForm.tsx`
- Create: `src/features/clients/clientSchema.ts`
- Test: `src/features/clients/ClientsPage.test.tsx`
- Modify: `src/db/repositories.ts`
- Test: `src/db/repositories.test.ts`
- Modify: `src/app/App.tsx`
- Modify: `src/app/providers.tsx`
- Modify: `src/styles/global.css`

**Interfaces:**
- Produces: `ClientRecord`, `DexieClientRepository.list()`, `DexieClientRepository.save(record)`, and client/location selection for the quotation editor.

- [ ] **Step 1: Run the already-written client and repository tests**

  Run: `npm test -- --run src/features/clients/ClientsPage.test.tsx src/db/repositories.test.ts`

  Expected: all current client/repository tests pass; investigate any failure without deleting existing work.

- [ ] **Step 2: Run static verification**

  Run: `npm run typecheck && npm run lint`

  Expected: exit code 0.

- [ ] **Step 3: Commit only the completed client checkpoint**

  ```bash
  git add src/app/App.tsx src/app/providers.tsx src/db/repositories.ts src/db/repositories.test.ts src/features/clients src/styles/global.css
  git commit -m "feat: manage clients and project locations"
  ```

## Task 2: Replace fixed-price domain rules with materials and labor

**Files:**
- Modify: `src/domain/types.ts`
- Modify: `src/domain/money.ts`
- Test: `src/domain/money.test.ts`
- Modify: `src/domain/quotation.ts`
- Test: `src/domain/quotation.test.ts`
- Modify: `src/test/factories.ts`

**Interfaces:**
- Produces: `MaterialItem`, revised `Quotation`, revised `QuotationSnapshot`, `parseQuantityToMilli(value)`, `calculateMaterialTotal(item)`, `calculateQuotationTotals(items, laborMinor)`, and `validateQuotationForExport(snapshot)`.

- [ ] **Step 1: Replace old discount tests with failing quantity and total tests**

  ```ts
  expect(parseQuantityToMilli('1,5')).toBe(1500)
  expect(calculateMaterialTotal({ quantityMilli: 1500, unitPriceMinor: 100_00 })).toBe(150_00)
  expect(calculateQuotationTotals([
    material({ quantityMilli: 10_000, unitPriceMinor: 1_000_00 }),
    material({ quantityMilli: 5_000, unitPriceMinor: 500_00 }),
  ], 8_000_00)).toEqual({ materialsMinor: 12_500_00, laborMinor: 8_000_00, totalMinor: 20_500_00 })
  ```

- [ ] **Step 2: Run the domain tests and confirm the old API fails**

  Run: `npm test -- --run src/domain`

  Expected: FAIL because the new functions and types do not exist.

- [ ] **Step 3: Define the new canonical types**

  ```ts
  export interface MaterialItem {
    id: string
    quotationId: string
    description: string
    quantityMilli: number
    unit: string
    unitPriceMinor: number
    position: number
  }

  export interface Quotation {
    id: string
    number: string
    clientId: string
    clientName: string
    clientAddress: string
    issueDate: string
    status: QuotationStatus
    laborMinor: number
    observations: string
    templateVersion: 1
    createdAt: string
    updatedAt: string
    deletedAt?: string
  }

  export interface QuotationTotals {
    materialsMinor: number
    laborMinor: number
    totalMinor: number
  }

  export interface BankAccount {
    id: string
    bank: string
    type: string
    number: string
  }

  export interface BusinessProfile {
    id: string
    businessName: string
    tagline: string
    headerPhone: string
    terms: string[]
    bankAccounts: BankAccount[]
    managerName: string
    managerTitle: string
    directPhone: string
    whatsappPhone: string
    footerQuality: string
    footerCommitment: string
    footerFaith: string
    logoBlob?: Blob
    stampBlob?: Blob
    updatedAt: string
    deletedAt?: string
  }
  ```

- [ ] **Step 4: Implement decimal parsing and integer-only calculations**

  `parseQuantityToMilli` accepts a comma or period, rejects negatives and more than three decimal places, and returns an integer. `calculateMaterialTotal` uses `Math.round(quantityMilli * unitPriceMinor / 1000)` after checking safe integer bounds. `formatMoney` always formats `DOP` and visibly normalizes the prefix to `RD$`.

- [ ] **Step 5: Update export validation and duplication**

  Validate trimmed client name/address, ISO issue date, one complete material, positive quantity, non-empty unit/description, non-negative unit price, and non-negative labor. Duplication assigns new quotation/material IDs, keeps the client snapshot and content, clears deletion metadata, and resets status to `draft`.

- [ ] **Step 6: Run and commit**

  Run: `npm test -- --run src/domain && npm run typecheck`

  ```bash
  git add src/domain src/test/factories.ts
  git commit -m "refactor: model materials and labor quotations"
  ```

## Task 3: Migrate IndexedDB without losing local records

**Files:**
- Modify: `src/db/database.ts`
- Modify: `src/db/repositories.ts`
- Test: `src/db/repositories.test.ts`
- Create: `src/db/defaults.ts`

**Interfaces:**
- Consumes: domain types from Task 2.
- Produces: Dexie schema version 2, `materialItems` table, atomic quotation snapshots, and `DEFAULT_BUSINESS_PROFILE`.

- [ ] **Step 1: Write failing migration and transaction tests**

  Create a version-1 database row with one legacy work item priced at `125000`, reopen it with version 2, and assert the migrated material has quantity `1000`, unit `unidad`, unit price `125000`, and preserves the quotation. Add an abort test proving quotation, materials, and outbox are all rolled back together.

- [ ] **Step 2: Run repository tests to verify failure**

  Run: `npm test -- --run src/db/repositories.test.ts`

  Expected: FAIL because `materialItems` and schema version 2 do not exist.

- [ ] **Step 3: Add schema version 2 and migration**

  Keep the legacy `workItems` store only for safe migration, add `materialItems: 'id, quotationId, [quotationId+position]'`, and upgrade legacy items to quantity `1.000` and unit `unidad`. Remove obsolete quotation properties when mapping into the new shape and set `laborMinor: 0`, `observations` from legacy notes, and `templateVersion: 1`.

- [ ] **Step 4: Make snapshot save/load atomic**

  Update `DexieQuotationRepository` to read and replace `materialItems`, validate non-negative integer monetary fields, and enqueue the complete new snapshot in the same transaction.

- [ ] **Step 5: Add the exact editable defaults from the reference**

  ```ts
  export const DEFAULT_BUSINESS_PROFILE = {
    businessName: 'Acabados Modernos Gonzalez',
    tagline: 'Transformamos tus espacios con estilo y calidad',
    headerPhone: '849-379-7731',
    terms: [
      'Se requiere del 50% al inicial del proyecto deseado.',
      'Esta cotización tiene validez de 15 días.',
      'No incluye materiales no especificados ni cambios fuera de esta.',
    ],
    bankAccounts: [
      { bank: 'Banreservas', type: 'Ahorro', number: '9604220069' },
      { bank: 'Scotiabank', type: 'Corriente', number: '57000502207' },
      { bank: 'Banco Santa Cruz', type: 'Ahorro', number: '11102010025465' },
    ],
    managerName: 'Jefferson Gonzalez Del Rosario',
    managerTitle: 'GERENTE GENERAL',
    directPhone: '809-914-8622',
    whatsappPhone: '849-379-7731',
    footerQuality: 'CALIDAD QUE SE VE, DURABILIDAD QUE SE SIENTE.',
    footerCommitment: 'COMPROMETIDOS CON LA EXCELENCIA',
    footerFaith: 'Dios es bueno todo el tiempo',
  } as const
  ```

- [ ] **Step 6: Run and commit**

  Run: `npm test -- --run src/db/repositories.test.ts && npm run typecheck`

  ```bash
  git add src/db
  git commit -m "feat: migrate local quotations to material pricing"
  ```

## Task 4: Expand Ajustes for every fixed document field

**Files:**
- Modify: `src/features/business/businessProfileSchema.ts`
- Modify: `src/features/business/BusinessProfileForm.tsx`
- Test: `src/features/business/BusinessProfileForm.test.tsx`
- Modify: `src/features/settings/SettingsPage.tsx`
- Modify: `src/styles/global.css`

**Interfaces:**
- Consumes: `DEFAULT_BUSINESS_PROFILE` and `BusinessProfile`.
- Produces: validated editable brand content, `logoBlob`, and `stampBlob` for every export.

- [ ] **Step 1: Write failing form tests**

  Assert that the default terms and three bank accounts render, a bank account can be edited, logo and stamp accept images, invalid empty business/manager names block save, and the submitted object includes every document field.

- [ ] **Step 2: Run the focused test**

  Run: `npm test -- --run src/features/business/BusinessProfileForm.test.tsx`

  Expected: FAIL because the new fields are absent.

- [ ] **Step 3: Extend the Zod schema and focused form sections**

  Group the form into `Marca`, `Términos`, `Cuentas bancarias`, `Gerente y teléfonos`, and `Pie de página`. Use repeatable rows for terms/accounts, but preload the approved content. Replace the obsolete signature upload with a stamp upload.

- [ ] **Step 4: Preserve old profile values during upgrade**

  Merge a stored partial profile over `DEFAULT_BUSINESS_PROFILE` in `SettingsPage`; map old `phone` to `headerPhone`, old `ownerName` to `managerName`, and keep the existing logo.

- [ ] **Step 5: Run and commit**

  Run: `npm test -- --run src/features/business && npm run typecheck`

  ```bash
  git add src/features/business src/features/settings/SettingsPage.tsx src/styles/global.css
  git commit -m "feat: configure quotation document details"
  ```

## Task 5: Build the autosaving material quotation editor

**Files:**
- Create: `src/features/quotations/quotationSchema.ts`
- Create: `src/features/quotations/useAutosave.ts`
- Create: `src/features/quotations/QuotationEditor.tsx`
- Test: `src/features/quotations/QuotationEditor.test.tsx`
- Modify: `src/features/quotations/QuotationsPage.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/styles/global.css`

**Interfaces:**
- Consumes: client repository, quotation repository, Task 2 calculations.
- Produces: `/cotizaciones/nueva`, `/cotizaciones/:id/editar`, and a persisted `QuotationSnapshot`.

- [ ] **Step 1: Write failing editor tests**

  Cover selecting a client, copying its name/address into the quotation, adding and deleting material rows, entering `1,5`, choosing a unit, live row/material/general totals, one labor amount, observations, and the absence of discount/currency/ITBIS fields.

- [ ] **Step 2: Write failing autosave tests**

  With fake timers, assert a valid edit saves after 400 ms and flushes on `visibilitychange` and unmount. Assert an incomplete material stays visible locally in the form but does not corrupt the persisted complete snapshot.

- [ ] **Step 3: Run focused tests and confirm failure**

  Run: `npm test -- --run src/features/quotations/QuotationEditor.test.tsx`

- [ ] **Step 4: Implement the schema and dynamic rows**

  Use `useFieldArray` with fields `{id, description, quantity, unit, unitPrice}`. Parse quantity through `parseQuantityToMilli` and currency input through an integer-cent parser at the form boundary. Provide common units (`unidad`, `m²`, `m`, `pie`, `funda`, `caja`, `galón`) while allowing custom text.

- [ ] **Step 5: Implement totals and local autosave**

  Display each row total as read-only, then sticky summary rows for `Total de materiales`, `Mano de obra instalación`, and `Total general`. Save atomically through the repository and show `Guardado`/`Guardando` without blocking input.

- [ ] **Step 6: Wire routes and mobile interactions**

  The FAB opens the new editor. Client/location query parameters preselect a client. Buttons for adding/removing/reordering rows meet the 44 px target and expose accessible names.

- [ ] **Step 7: Run and commit**

  Run: `npm test -- --run src/features/quotations && npm run typecheck && npm run build`

  ```bash
  git add src/app/App.tsx src/features/quotations src/styles/global.css
  git commit -m "feat: create autosaving material quotations"
  ```

## Task 6: Complete quotation history and lifecycle

**Files:**
- Modify: `src/features/quotations/QuotationsPage.tsx`
- Create: `src/features/quotations/QuotationDetailPage.tsx`
- Test: `src/features/quotations/QuotationsPage.test.tsx`
- Modify: `src/features/home/HomePage.tsx`
- Modify: `src/db/repositories.ts`
- Modify: `src/app/App.tsx`

**Interfaces:**
- Produces: searchable quotation cards, detail/edit/duplicate/delete actions, and dashboard totals based on `totalMinor`.

- [ ] **Step 1: Write failing lifecycle tests**

  Assert search by client, status filtering, opening/editing, duplication with new IDs, delete confirmation, and dashboard totals using materials plus labor.

- [ ] **Step 2: Run tests and confirm failure**

  Run: `npm test -- --run src/features/quotations/QuotationsPage.test.tsx src/features/home/HomePage.test.tsx`

- [ ] **Step 3: Implement the list, detail, and repository queries**

  Preserve internal states `draft`, `sent`, `approved`, and `rejected` for organization. These states appear in the app but never in the exported sheet. Duplicate creates a new draft; delete remains a tombstone and outbox action.

- [ ] **Step 4: Run and commit**

  Run: `npm test -- --run src/features/quotations src/features/home && npm run typecheck`

  ```bash
  git add src/app/App.tsx src/db/repositories.ts src/features/quotations src/features/home/HomePage.tsx
  git commit -m "feat: manage quotation history and lifecycle"
  ```

## Task 7: Create the canonical black-and-gold paginated document

**Files:**
- Create: `src/features/export/documentPagination.ts`
- Test: `src/features/export/documentPagination.test.ts`
- Create: `src/features/export/QuotationDocument.tsx`
- Test: `src/features/export/QuotationDocument.test.tsx`
- Create: `src/styles/quotation-document.css`
- Modify: `src/features/quotations/QuotationDetailPage.tsx`

**Interfaces:**
- Produces: `paginateDocument(input, measurements): DocumentPage[]` and `<QuotationDocument snapshot pages />`; each page root has `data-export-page`.

- [ ] **Step 1: Write failing pagination tests**

  Assert 3 materials yield one page and exactly 3 rows; enough measured rows yield multiple pages; every material appears once and in order; column headers repeat; and the totals/terms/footer block is never split.

- [ ] **Step 2: Write failing document-content tests**

  Assert the title, business identity, client name/address/date, exact six table columns, all three totals, terms, observations, accounts, manager, phones, and footer messages. Assert discounts, USD, ITBIS, project title, status, and client contact fields are absent.

- [ ] **Step 3: Run focused tests and confirm failure**

  Run: `npm test -- --run src/features/export`

- [ ] **Step 4: Implement measurement-driven pagination**

  Render material rows in a hidden measurement table, record their wrapped heights, and pack them into A4 page budgets. Reserve the full closing-block height on the last page; if it does not fit, move the closing block intact to the next page. Use deterministic fallbacks in jsdom tests.

- [ ] **Step 5: Implement the faithful document component**

  Use 794 × 1123 CSS-pixel page surfaces, white background, `#0A0A0A` black, and `#D99000`/gold accents. Recreate the diagonal header, wordmark fallback, contact/client icons, black column headers, gold total bar, bordered terms/observations, bank text marks, manager block, stamp area, and black/gold footer. Uploaded logo/stamp assets replace their clean text/CSS fallbacks.

- [ ] **Step 6: Add preview and print-safe styles**

  Scale the full A4 page to mobile width without changing layout measurements. Use tabular numbers, semantic table markup, `overflow-wrap`, and no clipped content.

- [ ] **Step 7: Run and commit**

  Run: `npm test -- --run src/features/export && npm run typecheck && npm run build`

  ```bash
  git add src/features/export src/features/quotations/QuotationDetailPage.tsx src/styles/quotation-document.css
  git commit -m "feat: render faithful quotation document"
  ```

## Task 8: Export the same pages as PNG and PDF

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/features/export/exportService.ts`
- Test: `src/features/export/exportService.test.ts`
- Modify: `src/features/quotations/QuotationDetailPage.tsx`

**Interfaces:**
- Produces: `renderPagePng(element): Promise<Blob>`, `exportQuotationImages(elements, baseName): Promise<File[]>`, `exportQuotationPdf(elements, baseName): Promise<File>`, and `shareOrDownload(files): Promise<'shared' | 'downloaded'>`.

- [ ] **Step 1: Install the two focused export dependencies**

  Run: `npm install html-to-image jspdf`

- [ ] **Step 2: Write failing service tests**

  Mock `html-to-image` and assert one PNG per `data-export-page`, scale 3 capture settings, sanitized filenames, A4 portrait PDF pages in the same order, `navigator.canShare({ files })`, Web Share success, `AbortError` cancellation, and anchor-download fallback.

- [ ] **Step 3: Run the service test and confirm failure**

  Run: `npm test -- --run src/features/export/exportService.test.ts`

- [ ] **Step 4: Implement PNG capture and PDF assembly**

  Wait for `document.fonts.ready` and all logo/stamp images to decode. Convert each canonical page with `toBlob(element, { pixelRatio: 3, backgroundColor: '#ffffff', cacheBust: true })`. Add each PNG to a `jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })` page at `0, 0, 210, 297`.

- [ ] **Step 5: Add explicit export actions**

  Add `Exportar PDF` and `Exportar imagen`. Disable both during generation, announce progress, retain the quotation after failure, and offer direct downloads when multi-file sharing is unsupported.

- [ ] **Step 6: Run and visually verify fixtures**

  Run: `npm test -- --run src/features/export && npm run typecheck && npm run build`

  Manually inspect a 3-row single page and a multi-page quotation at 100% zoom for row order, sharp type, totals placement, and matching PNG/PDF output.

- [ ] **Step 7: Commit**

  ```bash
  git add package.json package-lock.json src/features/export src/features/quotations/QuotationDetailPage.tsx
  git commit -m "feat: export quotations as PDF and images"
  ```

## Task 9: Add private Supabase backup and restore

**Files:**
- Create: `.env.example`
- Create: `src/lib/supabase.ts`
- Create: `src/features/auth/AuthGate.tsx`
- Create: `src/features/auth/AuthScreen.tsx`
- Create: `src/sync/cloudAdapter.ts`
- Create: `src/sync/syncEngine.ts`
- Test: `src/sync/syncEngine.test.ts`
- Create: `supabase/config.toml`
- Create: `supabase/migrations/202608300001_quotation_backup.sql`
- Create: `supabase/tests/quotation_backup_rls.test.sql`
- Modify: `src/app/providers.tsx`
- Modify: `src/components/SyncBadge.tsx`

**Interfaces:**
- Consumes: the outbox and complete revised snapshots.
- Produces: private email/password session, owner-scoped backup, restore, and visible `synced | pending | offline | error` state.

- [ ] **Step 1: Write failing database-policy tests**

  Assert an authenticated owner can CRUD only their profile, clients, quotations, and material rows; a second user and anonymous role cannot read or mutate them. Every table includes `owner_id`, `updated_at`, `deleted_at`, and `version`.

- [ ] **Step 2: Write failing synchronization tests**

  Assert local writes precede network calls, batches are idempotent, a failed push remains queued, retries update `attempt`/`nextAttemptAt`, tombstones restore correctly, and a fresh local database pulls the complete profile/client/quotation/material graph.

- [ ] **Step 3: Create the schema and RLS policies**

  Use `auth.uid() = owner_id` policies for select/insert/update/delete and revoke anonymous access. Store logo/stamp files in a private `business-assets` bucket under `${ownerId}/...` paths.

- [ ] **Step 4: Implement authentication and the cloud adapter**

  Support email/password sign-in, password recovery, session restore, and sign-out. The adapter serializes quantity and monetary integers without conversion and never sends Blob values inside JSON records.

- [ ] **Step 5: Implement the sync engine**

  Push queued mutations before pulling server changes, prevent overlapping runs, retry on connection/foreground/manual triggers, and never replace a newer unsynchronized local record. Expose the four Spanish sync states in the dashboard.

- [ ] **Step 6: Run and commit**

  Run: `npm test -- --run src/sync && npm run typecheck && npm run build`

  When the Supabase CLI is available, also run: `npx supabase db reset && npx supabase test db`

  ```bash
  git add .env.example src/lib src/features/auth src/sync src/app/providers.tsx src/components/SyncBadge.tsx supabase
  git commit -m "feat: back up quotations to a private cloud account"
  ```

## Task 10: Verify the complete offline iPhone workflow

**Files:**
- Create: `tests/e2e/quotation-flow.spec.ts`
- Create: `tests/e2e/offline.spec.ts`
- Create: `tests/e2e/restore.spec.ts`
- Modify: UI/styles only where the tests expose a defect.

**Interfaces:**
- Consumes: the complete local, export, and synchronization workflow.
- Produces: automated release evidence and final accessibility/offline fixes.

- [ ] **Step 1: Write the complete quotation E2E**

  Create a client, create a quotation with three materials, verify each row total, enter labor, verify the grand total, save, reopen, preview, export PDF, and export exactly one PNG.

- [ ] **Step 2: Write dynamic pagination and offline E2E coverage**

  Create enough long material descriptions for multiple pages, verify every row appears once, export one PNG per page, go offline, edit and reload the draft, then reconnect and verify the outbox drains.

- [ ] **Step 3: Write restore coverage**

  Authenticate a fresh browser context with the same account, synchronize, and verify business settings, client, quotation, materials, observations, and totals all return.

- [ ] **Step 4: Run the accessibility and mobile checks**

  At 320 px and 390 px widths, verify keyboard order, labels, associated errors, visible focus, 44 px targets, safe areas, text zoom, reduced motion, and no horizontal overflow outside the intentionally scaled document preview.

- [ ] **Step 5: Run the release gate**

  Run: `npm run lint && npm run typecheck && npm test -- --run && npm run build && npm run test:e2e`

  Expected: every command exits 0.

- [ ] **Step 6: Commit final verification**

  ```bash
  git add tests src
  git commit -m "test: verify faithful offline quotation workflow"
  ```

## Plan Self-Review

- [x] Every field and calculation in the approved sheet maps to Tasks 2, 4, 5, and 7.
- [x] Dynamic row count and multi-page behavior map to Tasks 7, 8, and 10.
- [x] PDF and PNG share one canonical renderer and are tested together.
- [x] Local persistence, cloud recovery, privacy, and offline behavior map to Tasks 3, 5, 9, and 10.
- [x] Old discounts, currencies, fixed-price jobs, project images, and signatures are explicitly removed from the revised workflow.
- [x] Type names and signatures are consistent across domain, repository, editor, document, and export tasks.
- [x] No unresolved placeholder or deferred implementation language remains.
