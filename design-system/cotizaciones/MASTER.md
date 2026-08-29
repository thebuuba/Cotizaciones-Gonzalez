# Cotizaciones — Design System

**Status:** Approved  
**Platform:** iOS-first progressive web app  
**Direction:** Modern native-feeling utility, minimal, calm, trustworthy

## Product pattern

- App dashboard, not a marketing landing page.
- White cards on a quiet grouped background, clear numeric hierarchy, restrained shadows.
- Four bottom destinations: Inicio, Cotizaciones, Clientes, Ajustes.
- One centered floating action for “Nueva cotización”; never repeat it in the header.
- Mobile-first from 320 px, optimized around 375–430 px, with readable tablet width.

## Brand palette

| Role | Light | Dark | Usage |
|---|---|---|---|
| Primary | `#1C59A3` | `#4D91E1` | Primary controls, totals, active navigation, FAB |
| Primary strong | `#144582` | `#78AFF0` | Pressed states, high-emphasis text |
| Accent | `#2E73C7` | `#66A6ED` | Links and secondary actions |
| Success | `#2E995C` | `#54C982` | Approved/synchronized; use dark text on pale fills |
| Warning | `#F2AB1A` | `#FFC34D` | Sent/pending; use dark text on pale fills |
| Danger | `#DB3838` | `#FF6961` | Rejected, destructive actions, errors |
| Background | `#F2F2F7` | `#000000` | Grouped app background |
| Surface | `#FFFFFF` | `#1C1C1E` | Cards and bars |
| Text | `#111114` | `#F5F5F7` | Primary text |
| Muted text | `#64646C` | `#B4B4BD` | Secondary text, minimum 4.5:1 |
| Border | `#DEDEE5` | `#3A3A3C` | Dividers and boundaries |

Do not use orange as a brand accent, purple/pink gradients, or raw hex values inside components. Map all colors through semantic tokens.

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
- Test light and dark surfaces independently, including borders, focus, pressed, disabled, and status states.

## Delivery checks

- No duplicate create action, emoji icons, horizontal scrolling, hover-only behavior, or content hidden by fixed bars.
- Verify 320 px, 375 px, 430 px, tablet portrait/landscape, zoomed text, keyboard, and VoiceOver-friendly names.
- Verify all touch targets are at least 44 px and normal text contrast is at least 4.5:1.
