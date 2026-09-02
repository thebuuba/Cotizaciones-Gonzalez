# Semantic Interface System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the interactive application semantically correct, typographically consistent, accessible, and fully green while preserving its approved iOS black-and-gold appearance.

**Architecture:** Keep the React feature structure and introduce a closed typography token scale in `tokens.css`. Replace the accumulated global cascade with focused stylesheet modules imported by `global.css`, then migrate shared and feature components to semantic HTML while preserving stable class names. Treat the export document as an isolated subsystem: update stale tests only and do not alter its visual CSS or markup.

**Tech Stack:** React 19.2, React Router 7, TypeScript 6, Vite 8, Vitest 4, Testing Library, CSS custom properties.

**Spec:** `docs/superpowers/specs/2026-09-01-interface-semantics-design.md`

## Global Constraints

- Preserve the approved black, white, gray, navy, and gold iOS-first appearance.
- Do not modify `src/styles/quotation-document.css` or redesign `QuotationDocument`.
- Interactive body and control text is 16 px; no interactive-interface text is smaller than 12 px.
- Typography uses only semantic tokens: auxiliary 12 px, label/navigation 13 px, secondary 14 px, body 16 px, subtitle 18 px, section title 20 px, adaptive page title 32 px, adaptive featured total 36 px.
- Every screen has one `h1`; sections use `h2`; nested groups use `h3` only when structurally necessary.
- Touch targets remain at least 44×44 px and focus indicators remain visible.
- Preserve `prefers-reduced-motion`, safe-area insets, keyboard access, and existing Spanish copy unless the copy is incorrect.
- Do not add UI dependencies or change domain, persistence, synchronization, or export behavior.

---

### Task 1: Restore a trustworthy green baseline

**Files:**
- Modify: `src/features/home/HomePage.test.tsx`
- Modify: `src/features/export/exportService.test.ts`
- Modify: `src/features/export/QuotationDocument.test.tsx`
- Modify: `src/features/quotations/QuotationEditor.test.tsx`

**Interfaces:**
- Consumes: current `HomePage`, `renderPagePng`, `QuotationDocument`, and `QuotationEditor` behavior.
- Produces: a green baseline whose tests describe the current product contracts without changing production behavior.

- [ ] **Step 1: Reproduce each independent failure**

Run:

```powershell
npx vitest run src/features/home/HomePage.test.tsx src/features/export/exportService.test.ts src/features/export/QuotationDocument.test.tsx src/features/quotations/QuotationEditor.test.tsx --exclude .worktrees/** --reporter=verbose
```

Expected: six failures: Router context missing, pixel ratio mismatch, two obsolete document assertions, and two attempts to edit a `select` as text.

- [ ] **Step 2: Supply the real Router boundary to the HomePage test**

Change the test render to exercise the real `Link` behavior:

```tsx
import { MemoryRouter } from 'react-router-dom'

render(
  <MemoryRouter>
    <HomePage businessName="Acabados Modernos Gonzalez" quotations={[approved, sent]} />
  </MemoryRouter>,
)
```

- [ ] **Step 3: Align export assertions with the committed high-resolution contract**

Assert the current option:

```ts
expect(mocks.toBlob).toHaveBeenCalledWith(page, expect.objectContaining({
  pixelRatio: 4,
  backgroundColor: '#ffffff',
  cacheBust: true,
}))
```

In the document test, assert `CUENTAS PARA DEPÓSITO / TRANSFERENCIA`; remove the obsolete stamp assertion; for repeated identity use `getAllByText(/Acabados Modernos Gonzalez/i).length` so a page may contain both header and closing identity.

- [ ] **Step 4: Test the selector contract instead of obsolete free text**

Replace `clear`/`type` operations with:

```tsx
await user.selectOptions(screen.getByLabelText('Unidad 1'), 'm²')
expect(screen.getByLabelText('Unidad 1')).toHaveValue('m²')
```

Rename the custom-unit test to `offers the approved construction units`, select `global`, and assert that value.

- [ ] **Step 5: Verify the baseline**

Run the command from Step 1. Expected: all four files pass.

- [ ] **Step 6: Commit the baseline repair**

```powershell
git add src/features/home/HomePage.test.tsx src/features/export/exportService.test.ts src/features/export/QuotationDocument.test.tsx src/features/quotations/QuotationEditor.test.tsx
git commit -m "test: align interface contracts with current behavior"
```

### Task 2: Establish and enforce the semantic typography scale

**Files:**
- Modify: `src/styles/tokens.css`
- Create: `scripts/interface-style-audit.mjs`
- Create: `scripts/interface-style-audit.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces: CSS custom properties `--font-size-auxiliary`, `--font-size-label`, `--font-size-secondary`, `--font-size-body`, `--font-size-subtitle`, `--font-size-section-title`, `--font-size-page-title`, and `--font-size-featured-total`.
- Produces: `auditInterfaceCss(css: string): string[]` and npm script `check:ui`.

- [ ] **Step 1: Write the failing audit tests**

Create `scripts/interface-style-audit.test.mjs`:

```js
import assert from 'node:assert/strict'
import test from 'node:test'
import { auditInterfaceCss } from './interface-style-audit.mjs'

test('accepts semantic typography tokens', () => {
  assert.deepEqual(auditInterfaceCss('.copy { font-size: var(--font-size-body); }'), [])
})

test('rejects arbitrary interface font sizes', () => {
  assert.deepEqual(
    auditInterfaceCss('.copy { font-size: .82rem; }'),
    ['font-size must use a semantic token: .82rem'],
  )
})

test('ignores keyframes and the isolated export stylesheet', () => {
  assert.deepEqual(auditInterfaceCss('@keyframes x { from { opacity: 0 } }'), [])
})
```

- [ ] **Step 2: Run the tests and verify RED**

Run: `node --test scripts/interface-style-audit.test.mjs`

Expected: FAIL because `interface-style-audit.mjs` does not exist.

- [ ] **Step 3: Implement the CSS audit**

Create `scripts/interface-style-audit.mjs` with an exported function that matches `font-size:` declarations and accepts only `var(--font-size-...)` and `inherit`. When executed directly, scan `src/styles/global.css`, print every violation with file and line, and exit 1 when violations exist. Export the file list as `interfaceStyles` so Task 3 can replace it after the split.

Use only `node:fs`, `node:path`, and `node:url`; do not add a dependency.

- [ ] **Step 4: Add the token scale**

Add to `tokens.css`:

```css
--font-size-auxiliary: .75rem;
--font-size-label: .8125rem;
--font-size-secondary: .875rem;
--font-size-body: 1rem;
--font-size-subtitle: 1.125rem;
--font-size-section-title: 1.25rem;
--font-size-page-title: clamp(1.75rem, 7vw, 2rem);
--font-size-featured-total: clamp(2rem, 9vw, 2.25rem);

--line-height-compact: 1.2;
--line-height-heading: 1.15;
--line-height-body: 1.5;
```

- [ ] **Step 5: Add verification commands**

Add scripts:

```json
"test:style-audit": "node --test scripts/interface-style-audit.test.mjs",
"check:ui": "node scripts/interface-style-audit.mjs"
```

- [ ] **Step 6: Verify GREEN and commit**

Run:

```powershell
npm run test:style-audit
```

Expected: three passing Node tests.

```powershell
git add package.json scripts/interface-style-audit.mjs scripts/interface-style-audit.test.mjs src/styles/tokens.css
git commit -m "feat: define semantic typography tokens"
```

### Task 3: Replace the accumulated global cascade with focused stylesheets

**Files:**
- Create: `src/styles/base.css`
- Create: `src/styles/components.css`
- Create: `src/styles/forms.css`
- Create: `src/styles/pages.css`
- Create: `src/styles/motion.css`
- Modify: `src/styles/global.css`
- Modify: `src/styles/tokens.css`

**Interfaces:**
- Consumes: the typography tokens from Task 2 and all existing class names.
- Produces: a stable import order and no arbitrary `font-size` declarations in interactive-interface CSS.

- [ ] **Step 1: Run the audit against the legacy stylesheet and record RED**

Run `npm run check:ui` against the legacy `global.css` list created in Task 2.

Expected: FAIL with the existing arbitrary font sizes.

- [ ] **Step 2: Move base rules without changing selectors**

Move reset, body, anchors, focus, screen-reader utilities, app frame/content, responsive gutters, and accessibility media queries into `base.css`. Use `var(--font-size-body)` for body and controls.

- [ ] **Step 3: Move shared component rules**

Move navigation, buttons, icon buttons, FAB, headers, badges, cards, empty/loading states, update prompt, and menus into `components.css`. Map all sizes to the semantic typography tokens.

- [ ] **Step 4: Move form rules**

Move labels, inputs, selects, textareas, field errors, fieldsets, material cards, totals, save panels, client forms, and business-profile forms into `forms.css`. Controls use body size, labels use label size, help/errors use secondary size.

- [ ] **Step 5: Move page-specific rules**

Move dashboard, quotation list/detail, clients, settings, auth, and breakpoint-specific page layout into `pages.css`. Page titles use `--font-size-page-title`; section headings use `--font-size-section-title`; totals use `--font-size-featured-total`.

- [ ] **Step 6: Move motion and preferences**

Move route entry, press response, keyframes, and reduced-motion rules into `motion.css`. Remove per-item entrance choreography so ordinary workflows follow the approved restrained-motion master system.

- [ ] **Step 7: Make global.css an ordered entry point**

Replace it with:

```css
@import './base.css';
@import './components.css';
@import './forms.css';
@import './pages.css';
@import './motion.css';
```

Update `interfaceStyles` in `scripts/interface-style-audit.mjs` to scan `base.css`, `components.css`, `forms.css`, `pages.css`, and `motion.css`; `global.css` then contains imports only.

- [ ] **Step 8: Verify style policy and application tests**

Run:

```powershell
npm run check:ui
npx vitest run src/app/App.test.tsx src/features/home/HomePage.test.tsx src/features/quotations/QuotationsPage.test.tsx src/features/clients/ClientsPage.test.tsx --exclude .worktrees/**
npm run build
```

Expected: all commands exit 0.

- [ ] **Step 9: Commit the stylesheet consolidation**

```powershell
git add src/styles
git commit -m "refactor: consolidate interface styles"
```

### Task 4: Make shared interface components semantically explicit

**Files:**
- Modify: `src/components/PageHeader.tsx`
- Modify: `src/components/StatusBadge.tsx`
- Modify: `src/components/SyncBadge.tsx`
- Modify: `src/components/BottomNav.tsx`
- Create: `src/components/SharedSemantics.test.tsx`

**Interfaces:**
- Produces: `PageHeader` rendered as `header`; status components with explicit readable text; bottom navigation with an internal list while preserving link labels.

- [ ] **Step 1: Write failing semantic component tests**

Test real components inside `MemoryRouter`:

```tsx
expect(screen.getByRole('heading', { level: 1 }).closest('header')).not.toBeNull()
expect(screen.getByRole('navigation', { name: 'Navegación principal' })).toBeInTheDocument()
expect(within(navigation).getByRole('list')).toBeInTheDocument()
expect(screen.getByRole('status')).toHaveTextContent('Sincronizado')
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npx vitest run src/components/SharedSemantics.test.tsx --exclude .worktrees/**`

Expected: missing semantic header/list/status structure.

- [ ] **Step 3: Implement minimal semantic markup**

- Render `PageHeader` as `<header className="page-header">`.
- Wrap bottom destinations in `<ul>` and each `NavLink` in `<li>`; keep the `nav` label and existing link classes.
- Give `SyncBadge` `role="status"` and `aria-live="polite"`; do not make static quotation status badges live regions.

- [ ] **Step 4: Adapt component CSS without changing appearance**

Reset navigation list styles and use `display: contents` or the same four-column grid through the list so layout remains unchanged.

- [ ] **Step 5: Verify and commit**

Run the new test plus `src/app/App.test.tsx`. Expected: PASS.

```powershell
git add src/components src/styles/components.css
git commit -m "refactor: strengthen shared interface semantics"
```

### Task 5: Apply semantic structure to pages and forms

**Files:**
- Modify: `src/features/home/HomePage.tsx`
- Modify: `src/features/quotations/QuotationsPage.tsx`
- Modify: `src/features/quotations/QuotationEditor.tsx`
- Modify: `src/features/quotations/QuotationDetailPage.tsx`
- Modify: `src/features/clients/ClientsPage.tsx`
- Modify: `src/features/clients/ClientForm.tsx`
- Modify: `src/features/business/BusinessProfileForm.tsx`
- Modify: `src/features/settings/SettingsPage.tsx`
- Modify: `src/features/auth/AuthScreen.tsx`
- Modify: `src/features/auth/UpdatePasswordScreen.tsx`
- Modify: relevant existing `*.test.tsx` files beside those components

**Interfaces:**
- Consumes: stable shared classes and typography tokens.
- Produces: one `h1` per screen, semantic lists for collections, `fieldset`/`legend` for related form groups, and correct status/error regions.

- [ ] **Step 1: Add failing page-level semantic assertions**

For each page test, assert one main heading:

```tsx
expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
```

For collections, assert `list` and `listitem`. For editor and business-profile groups, assert named `group` roles created by `fieldset`/`legend`.

- [ ] **Step 2: Run focused tests and verify RED**

Run all feature `*.test.tsx` files named above. Expected: failures only for absent semantic roles.

- [ ] **Step 3: Migrate collection markup**

- Home recent quotations: `<section aria-labelledby>` containing `<ul>` and linked `<li>` entries.
- Quotations: `<ul className="quotation-list">` with `<li className="quotation-list-card">`.
- Clients: `<ul className="client-list">` with `<li className="client-card">`.
- Materials: `<ol className="material-list">` with `<li className="material-card">` because order is user-controlled and visible.

Preserve class names on the new semantic elements so visual selectors remain stable.

- [ ] **Step 4: Migrate form groups**

Replace form sections that group related inputs with:

```tsx
<fieldset className="editor-section">
  <legend>Datos del cliente</legend>
  {/* labelled controls */}
</fieldset>
```

Use the existing visible heading copy as the legend. Do not wrap action-only or summary sections in fieldsets.

- [ ] **Step 5: Normalize headings and regions**

Ensure every page/screen owns one `h1`, section labels are `h2`, nested card titles are `h3` or strong text according to whether they start a subsection, and error messages use `role="alert"` only when immediate interruption is appropriate.

- [ ] **Step 6: Verify focused behavior and commit**

Run:

```powershell
npx vitest run src/features --exclude .worktrees/**
npm run check:ui
```

Expected: all feature tests and the style audit pass.

```powershell
git add src/features src/styles
git commit -m "refactor: make application pages semantic"
```

### Task 6: Complete responsive and accessibility verification

**Files:**
- Verify: `src/styles/base.css`
- Verify: `src/styles/components.css`
- Verify: `src/styles/forms.css`
- Verify: `src/styles/pages.css`
- Verify: `src/styles/motion.css`
- Modify only after a failing responsive or accessibility check identifies the responsible stylesheet.

**Interfaces:**
- Consumes: the complete semantic interface system.
- Produces: final evidence that the application meets the specification.

- [ ] **Step 1: Run the complete automated gate**

Run each command independently:

```powershell
npm run lint
npm run typecheck
npm run test:style-audit
npm run check:ui
npm test -- --run --exclude .worktrees/**
npm run build
```

Expected: every command exits 0 with no warnings treated as errors.

- [ ] **Step 2: Inspect the built interface at required sizes**

Use the local Vite server and inspect `/`, `/cotizaciones`, `/clientes`, `/ajustes`, and `/cotizaciones/nueva` at 320×568, 375×812, 430×932, and 844×390. Confirm no horizontal overflow, no clipped labels, visible focus, and no content behind the bottom navigation.

- [ ] **Step 3: Inspect accessibility preferences**

Enable reduced motion and confirm route/press animation resolves immediately. Set browser text size/zoom to 200% and confirm controls, labels, errors, totals, and navigation remain readable and operable.

- [ ] **Step 4: Review the final diff against the spec**

Run:

```powershell
git diff --check
git status --short
git diff --stat
```

Confirm `quotation-document.css`, domain logic, persistence, and sync code are unchanged.

- [ ] **Step 5: Commit any evidence-driven polish**

```powershell
git add src/styles src/components src/features package.json scripts
git commit -m "fix: complete interface accessibility verification"
```
