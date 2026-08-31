# Cotizaciones — Design System

**Status:** Approved  
**Platform:** iOS-first progressive web app  
**Direction:** Modern native-feeling utility with Black and Gold Elegance

## Product pattern

- App dashboard, not a marketing landing page.
- White cards on a quiet grouped background, clear numeric hierarchy, restrained shadows.
- Four bottom destinations: Inicio, Cotizaciones, Clientes, Ajustes.
- One centered floating action for “Nueva cotización”; never repeat it in the header.
- Mobile-first from 320 px, optimized around 375–430 px, with readable tablet width.

## Brand palette

Use the 60â€“30â€“10 rule: about 60% white/gray surfaces, 30% navy structure and typography, and 10% gold emphasis.

| Token | Value | Usage |
|---|---|---|
| White | `#FFFFFF` | Cards, bars, document paper, breathing room |
| Gray | `#E5E5E5` | Grouped background, borders, disabled and secondary surfaces |
| Gold | `#FCA311` | Primary actions, active state, highlights, pending/warning |
| Navy | `#14213D` | Structural panels, navigation, totals, headings, focus |
| Black | `#000000` | Strong text and all content placed on gold |

- Never place white text on gold. Gold always uses black text; the contrast is about 10.4:1.
- Use white on navy and navy/black on white or gray. Do not use gray text on white for normal body copy.
- Green (`#248A52`) and red (`#D92D3A`) are reserved semantic exceptions for success and error/destructive states. They are not brand accents.
- Do not introduce unrelated accent colors or raw hex values inside components. Map colors through primitive and semantic tokens.

## Typography

- Use the native system stack: `-apple-system`, `BlinkMacSystemFont`, `SF Pro Text`, `Segoe UI`, sans-serif.
- Body text starts at 16 px with 1.5 line height. Supporting labels may use 12–13 px only when contrast remains strong.
- Use tabular numbers for quotation totals. Large totals are bold with compact tracking.

## Geometry and spacing

- 4/8 px spacing rhythm; standard page gutter 16 px, section gap 24 px.
- Cards: 16 px radius, 16 px padding, subtle nonessential shadow.
- Controls and navigation targets: minimum 44 × 44 px.
- Pills: full radius; modals/sheets: 20 px radius at the top edge.
- Respect `env(safe-area-inset-*)` in headers, navigation, fixed actions, and scroll padding.

## Interaction

- Use Lucide SVG icons with consistent 2 px stroke. Hide decorative icons from assistive technology.
- Every icon-only control has an accessible name.
- Press feedback uses color/opacity within 140 ms and never moves layout bounds.
- Focus rings remain visible. Color is never the only state indicator.
- Forms use persistent labels, nearby errors, retained values, and an error summary for multiple failures.
- Prefer native controls and browser capabilities. Avoid gesture-only operations; reorder/delete must have button alternatives.

## Motion and themes

- Motion is subtle and functional; avoid entrance choreography in normal workflows.
- Under `prefers-reduced-motion: reduce`, remove nonessential animation and smooth scrolling.
- This release is light-first. Test white, gray, navy, gold, disabled, focus, pressed, and semantic status states independently.

## Delivery checks

- No duplicate create action, emoji icons, horizontal scrolling, hover-only behavior, or content hidden by fixed bars.
- Verify 320 px, 375 px, 430 px, tablet portrait/landscape, zoomed text, keyboard, and VoiceOver-friendly names.
- Verify all touch targets are at least 44 px and normal text contrast is at least 4.5:1.
