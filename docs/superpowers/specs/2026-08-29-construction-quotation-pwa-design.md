# Construction quotation PWA design

Date: 2026-08-29
Status: Awaiting written specification review

## 1. Purpose

Build a mobile-first Progressive Web App for one contractor to prepare and manage professional quotations for construction, remodeling, kitchen design, ceramic installation, and similar fixed-price work. The primary device is an iPhone. The app must remain useful without internet access, synchronize automatically to a private cloud account, and export polished A4 PDF quotations.

The interface language is Spanish. A quotation uses either Dominican pesos (RD$) or United States dollars (US$), selected per quotation.

## 2. Product principles

1. **Local-first:** every edit is saved locally before any network operation.
2. **Simple pricing:** each work item has a description and fixed price; quantities and unit prices are outside the first release.
3. **Recoverable:** signing into the same account restores cloud-backed clients, quotations, business settings, and images.
4. **Professional output:** the PDF is a first-class product surface rather than a screenshot of the app.
5. **iPhone-native feel:** safe-area-aware navigation, large touch targets, clear hierarchy, and restrained motion.
6. **Single-user scope:** no organizations, roles, invitations, or multi-user editing.

## 3. Scope

### Included

- Email and password authentication, including password recovery.
- One configurable business profile.
- Client directory and separate project locations.
- Drafting, editing, duplicating, deleting, searching, and filtering quotations.
- Quotation states: draft, sent, approved, and rejected.
- Fixed-price work items.
- Optional percentage or fixed-amount discount.
- RD$ and US$ currency selection.
- Project images and design references.
- Notes, scope, conditions, estimated duration, and optional signature.
- Automatic local saving and background cloud synchronization.
- Offline use after the first successful authentication.
- A4 PDF preview, export, download, and iOS sharing.
- Installable PWA behavior and light/dark appearance.

### Explicitly excluded from the first release

- Inventory and material stock.
- Invoices, receipts, payment collection, and accounting.
- ITBIS calculation.
- Deposits, installment schedules, and balances due.
- Multi-user teams, permissions, and collaboration.
- Customer portals and electronic acceptance.
- Quantity-times-unit-price estimating.
- Simultaneous editing from multiple active devices. Cloud restore to a replacement device is supported, but the first release assumes one active editing device at a time.

## 4. Information architecture

The persistent bottom navigation contains four destinations:

1. **Inicio** — monthly summary, status counters, recent quotations, sync state, and the primary create action.
2. **Cotizaciones** — searchable and filterable quotation history.
3. **Clientes** — client records, project locations, and quotation history.
4. **Ajustes** — business identity, signature, numbering, and preferences.

A single centered floating `+` action creates a quotation. The header does not contain a duplicate create button.

## 5. Main user flows

### 5.1 First use

1. User signs in or creates the private account.
2. User completes the business profile.
3. The app creates the local database and downloads any existing cloud records.
4. The home screen displays the current synchronization state.

### 5.2 Create a quotation

The editor is a resumable five-step flow:

1. **Cliente:** select an existing client or create one, then select or enter the project location.
2. **Proyecto:** title, general description, quotation date, validity date, and currency.
3. **Trabajos:** add, edit, reorder, duplicate, and remove fixed-price work items.
4. **Detalles:** discount, scope, conditions, estimated duration, notes, images, and optional signature.
5. **Revisión:** inspect the complete quotation, save it, change its status, and export the PDF.

The draft is saved after every meaningful change. Leaving the editor never discards a valid draft.

### 5.3 Manage existing quotations

- Search by number, client, or project title.
- Filter by status.
- Open, edit, duplicate, export, change status, or delete.
- Duplicating creates a new draft with a new number and current creation date while preserving the client, project content, work items, conditions, and images.
- Deletion requires confirmation and synchronizes as a tombstone so an offline copy cannot resurrect the record.

## 6. Data model

All durable records contain `id`, `ownerId`, `createdAt`, `updatedAt`, `deletedAt`, `syncState`, and `version` unless stated otherwise. Identifiers are generated on the device so offline records can be created without coordination.

### BusinessProfile

- Business or contractor name
- Owner name
- Logo reference
- Phone
- Email
- Address
- Signature reference
- Default currency
- Quotation number prefix and next local sequence

### Client

- Name
- Phone
- Email
- Address
- Notes

### ProjectLocation

- Client reference
- Label
- Address
- Optional directions or notes

### Quotation

- Automatic human-readable number
- Client and project-location references
- Project title and description
- Issue and validity dates
- Currency: `DOP` or `USD`
- Status: `draft`, `sent`, `approved`, or `rejected`
- Discount type: none, percentage, or fixed amount
- Discount value
- Scope, conditions, estimated duration, and notes
- Optional signature reference
- Calculated subtotal, discount amount, and final total

### WorkItem

- Quotation reference
- Description
- Fixed price
- Display order

### QuotationImage

- Quotation reference
- Local file reference
- Cloud object reference when synchronized
- Caption
- Display order
- Upload state

Money is represented as integer minor units rather than floating-point values. A quotation's selected currency applies to every work item and total.

## 7. Calculation rules

- `subtotal = sum(work item fixed prices)`
- Percentage discount is calculated from the subtotal and cannot exceed 100%.
- Fixed discount cannot exceed the subtotal.
- `final total = subtotal - discount amount`
- Final total cannot be negative.
- Currency formatting uses the quotation currency and Spanish locale conventions while preserving the `RD$` or `US$` symbol visibly.
- Stored monetary values are not converted between currencies.

## 8. Local-first architecture

The app is divided into independently testable units:

### Presentation layer

Screens, navigation, forms, accessible components, validation messages, and view state. It depends on application services, not directly on local or cloud storage.

### Application services

Use cases for clients, quotations, calculations, duplication, status changes, attachments, synchronization, and PDF generation. Business rules live here.

### Local repository

An IndexedDB-compatible repository is the immediate source for reads and writes. It supports transactions, schema migrations, indexes for search/filtering, and an outbox of pending cloud operations.

### Synchronization engine

Processes the outbox when connectivity and authentication are available. It synchronizes record changes and image uploads independently, retries transient failures with backoff, and exposes a summarized state to the interface.

Because there is one user, record conflicts use last-write-wins based on server-confirmed modification time and monotonically increasing record version. Deletes use tombstones. Cloud responses never overwrite a newer unsynchronized local version.

### Cloud adapter

The cloud implementation must provide email/password authentication, password recovery, per-user row ownership, structured record storage, private object storage for images, and server timestamps. The product architecture depends on this interface rather than vendor-specific calls.

### PDF renderer

Receives an immutable quotation snapshot and produces an A4 document locally. It must not query repositories while rendering. The template and data mapping are versioned independently so a future visual redesign does not change stored quotation data.

## 9. Synchronization behavior

The visible states are:

- **Sincronizado:** local and cloud versions match.
- **Pendiente:** local changes await upload.
- **Sin conexión:** the app is usable; changes remain queued.
- **Error:** synchronization failed and can be retried without losing work.

Text and icon accompany every state color. Image uploads can remain pending after the quotation record itself has synchronized. Signing out clears authentication secrets but does not silently destroy local work; the user receives an explicit choice when local pending changes exist.

## 10. Visual system

The approved reference uses a modern iOS-inspired dashboard with pale neutral background, white cards, rounded corners, restrained shadows, large numeric totals, and a bottom tab bar.

### Brand colors

| Token | Value | Use |
| --- | --- | --- |
| `brand-primary` | `#1C59A3` | Primary buttons, totals, active icons, floating action |
| `brand-dark` | `#144582` | Pressed state and dark variation |
| `brand-accent` | `#2E73C7` | Links and secondary actions |

### Status colors

| Token | Value | Use |
| --- | --- | --- |
| `status-success` | `#2E995C` | Approved and synchronized |
| `status-warning` | `#F2AB1A` | Sent and pending |
| `status-danger` | `#DB3838` | Rejected, deletion, and errors |

Primary and dark blue use white foreground text. Success and warning badges use tinted light backgrounds with darker readable foregrounds; they do not use white text on the raw status color. Destructive controls may use `#DB3838` with white text when size and weight preserve AA contrast. Status is never conveyed by color alone.

### Interaction requirements

- Minimum 44 by 44 CSS-pixel touch area for primary mobile controls.
- At least 8 pixels between adjacent touch targets.
- iPhone safe-area insets respected at top and bottom.
- Visible focus states and complete keyboard access for non-touch users.
- Body text remains readable under text enlargement and reflow.
- Reduced-motion preference disables decorative transitions.
- Bottom navigation contains no more than the four approved destinations plus the centered create action.

## 11. PDF design

The PDF uses A4 pages and the same blue brand identity.

### First page

- Business logo and contact information
- `Cotización` title and automatic number
- Issue date, validity, currency, and status
- Client and project-location information
- Project title and description
- Fixed-price work-item table
- Subtotal, discount, and prominent final total

### Following content

- Scope and conditions
- Estimated duration and notes
- Ordered project/design image grid with captions
- Optional signature and business contact block
- Page number on multi-page documents

The renderer prevents rows, totals, headings, and signatures from being stranded or clipped at page boundaries. Images are compressed before embedding and preserve aspect ratio. Generated filenames follow `COT-0001-Client-Name.pdf`, with unsafe filename characters removed.

## 12. Validation and error handling

- A quotation requires a client, project title, and at least one priced work item before PDF export.
- Field errors appear beside the relevant input and focus moves to the first blocking error on submission.
- Network failure never blocks local editing.
- Failed image uploads remain queued and are individually retryable.
- Authentication renewal occurs without discarding local records.
- PDF failure leaves the quotation intact and offers a retry.
- Destructive actions require confirmation and provide clear success or failure feedback.
- Empty, loading, offline, pending, success, and error states are designed explicitly.

## 13. Security and privacy

- Cloud records and objects are private to the authenticated account.
- Authorization is enforced by the cloud data layer, not only by UI filtering.
- Credentials and tokens are never stored in quotation records or logs.
- Uploaded filenames are randomized; original names are metadata only when needed.
- Private images are retrieved through authenticated or short-lived access.
- Logs exclude client contact details, quotation descriptions, and image contents.

## 14. Testing and acceptance criteria

### Unit tests

- Money arithmetic and formatting for DOP and USD
- Percentage and fixed discounts, including limits
- Quotation duplication and numbering behavior
- Status transitions and validation rules
- Sync conflict comparison and tombstone behavior

### Integration tests

- Local repository transactions and schema migrations
- Outbox processing, retry, and recovery after interrupted synchronization
- Authentication restoration and password recovery boundary
- Private image upload/download and pending upload recovery
- PDF generation with zero, one, and many images and multiple pages

### End-to-end tests

- Create and export a quotation online.
- Create, close, reopen, and export a quotation offline.
- Restore data after signing into a fresh installation.
- Duplicate a quotation and verify the new identity and date.
- Search and filter by all four statuses.
- Install and run the PWA on an iPhone-sized viewport with safe areas.

### Accessibility and visual acceptance

- Normal text contrast meets at least 4.5:1.
- Controls have meaningful labels and visible focus.
- Essential text is not truncated at narrow widths or enlarged text settings.
- Light and dark modes preserve semantic color meaning.
- PDF totals and work descriptions remain legible when printed in grayscale.

## 15. Delivery sequence

Implementation should proceed through these vertical slices:

1. App shell, visual tokens, navigation, and installable PWA baseline.
2. Local business profile, clients, quotations, calculations, and autosave.
3. Authentication, cloud adapter, outbox, and synchronization states.
4. Image capture/storage and resilient upload.
5. PDF template, preview, export, and sharing.
6. Offline hardening, accessibility, dark mode, and end-to-end verification.

Concrete libraries and the cloud vendor may be selected in the implementation plan, but they must satisfy the interfaces and acceptance criteria above without changing the approved product behavior.
