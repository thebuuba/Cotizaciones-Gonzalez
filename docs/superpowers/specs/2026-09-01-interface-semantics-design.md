# Diseño de consistencia semántica de la interfaz

## Objetivo

Unificar la interfaz de Cotizaciones para que use HTML semántico, una escala tipográfica cerrada, tamaños coherentes y estados accesibles, conservando la identidad iOS actual en negro, blanco, gris, azul marino y dorado.

## Alcance

El cambio cubre exclusivamente la interfaz interactiva de la aplicación: navegación, inicio, cotizaciones, clientes, ajustes, autenticación, formularios, avisos PWA y componentes compartidos.

La plantilla de cotización exportada a PDF o imagen y `quotation-document.css` quedan fuera del rediseño. Sus pruebas desactualizadas sí se alinearán con el comportamiento existente para que la suite completa termine sin fallos, sin cambiar su apariencia.

## Criterios de éxito

- Cada pantalla tiene un solo `h1` y una jerarquía `h2`/`h3` coherente.
- Las colecciones y grupos de formulario usan elementos semánticos apropiados.
- Todos los controles tienen nombre accesible, foco visible y objetivos táctiles de al menos 44 px.
- La interfaz usa únicamente la escala tipográfica aprobada y no contiene tamaños menores de 12 px.
- El texto de controles y formularios parte de 16 px para evitar zoom automático y mejorar legibilidad.
- La interfaz funciona con texto ampliado, movimiento reducido y anchos de 320, 375 y 430 px.
- Lint, TypeScript, pruebas y compilación terminan con código de salida cero.

## Sistema de tokens

La arquitectura de tokens tendrá tres capas:

1. Primitivos: valores numéricos de tamaño, peso, altura de línea, espacio, radio y duración.
2. Semánticos: propósitos como cuerpo, etiqueta, título de sección, título de página y total destacado.
3. Componentes: ajustes específicos que referencian tokens semánticos, nunca valores arbitrarios.

La escala tipográfica aprobada es:

| Uso | Tamaño |
|---|---:|
| Auxiliar | 12 px |
| Etiqueta y navegación | 13 px |
| Texto secundario | 14 px |
| Cuerpo, controles y formularios | 16 px |
| Subtítulo | 18 px |
| Título de sección | 20 px |
| Título de página | 32 px adaptable |
| Total destacado | 36 px adaptable |

Cada nivel tendrá altura de línea y peso definidos. Los importes conservarán cifras tabulares. Los títulos podrán usar `clamp()` únicamente mediante un token semántico aprobado.

## Organización de estilos

`tokens.css` seguirá siendo la fuente de verdad. El contenido actual de `global.css` se consolidará por responsabilidades para eliminar las capas históricas de sobrescrituras:

- base y accesibilidad;
- estructura de aplicación y navegación;
- componentes compartidos;
- formularios;
- páginas y características;
- movimiento y preferencias de usuario.

La migración conservará nombres de clase cuando ayuden a limitar el riesgo. Se eliminarán reglas duplicadas y valores sustituidos, y se reemplazarán tamaños directos por tokens. No se introducirán dependencias visuales nuevas.

## Semántica de componentes

- `AppShell` conserva un único `main`; la navegación persistente mantiene su etiqueta accesible.
- `PageHeader` representará el encabezado principal de cada pantalla.
- Las colecciones de cotizaciones, clientes y materiales usarán listas cuando el contenido sea una colección ordenable o navegable.
- Las tarjetas navegables serán enlaces con contenido estructurado; las tarjetas informativas usarán `article` cuando tengan identidad propia.
- Los grupos de campos relacionados usarán `fieldset` y `legend`.
- Los estados de sincronización, guardado, error y actualización usarán `status`, `alert` o `aria-live` según urgencia, sin anuncios duplicados.
- Los iconos decorativos permanecerán fuera del árbol accesible y los controles de solo icono conservarán un nombre explícito.
- La jerarquía de encabezados no dependerá de estilos visuales.

## Movimiento

Se conserva el movimiento iOS sutil ya aprobado, pero se ajustará al sistema maestro: transición breve de ruta, respuesta táctil y movimiento limitado a transformaciones y opacidad. Se eliminará cualquier coreografía innecesaria. `prefers-reduced-motion` mostrará directamente el estado final.

## Fallos actuales y tratamiento

La investigación identificó deriva de pruebas tras cambios intencionales:

- `HomePage.test.tsx` renderiza enlaces sin un Router.
- `exportService.test.ts` espera `pixelRatio: 3`, aunque la exportación vigente usa 4.
- `QuotationDocument.test.tsx` espera textos y elementos anteriores al diseño de documento actual.
- `QuotationEditor.test.tsx` trata el selector de unidad como campo de texto y todavía espera unidades libres.

Las pruebas se actualizarán para verificar los contratos vigentes. La plantilla exportada no se rediseñará. Si una prueba revela un defecto real durante la migración, primero se añadirá o ajustará la reproducción mínima y luego se corregirá la causa.

## Estrategia de pruebas

El trabajo seguirá ciclos rojo-verde-refactor. Se cubrirán como mínimo:

- sustitución del contenedor de ruta al navegar;
- un único título principal por pantalla;
- listas y grupos de formulario semánticos;
- nombres y estados accesibles de controles;
- uso de los tokens tipográficos permitidos;
- comportamiento de la interfaz con movimiento reducido;
- contratos vigentes de inicio, editor y exportación.

La verificación final ejecutará lint, comprobación de tipos, suite completa, compilación y revisión del diff. La validación visual cubrirá 320, 375 y 430 px, orientación horizontal cuando sea aplicable y texto ampliado.

## Riesgos y controles

- Una consolidación masiva de CSS puede cambiar la cascada: se migrará por superficies y se verificará después de cada bloque.
- Cambiar elementos HTML puede afectar selectores: se conservarán clases estables y las pruebas verificarán comportamiento, no estructura incidental.
- Una escala demasiado rígida puede perjudicar el documento exportado: ese stylesheet permanece aislado y fuera del alcance.
- El trabajo no alterará lógica de dominio, persistencia, sincronización ni datos.
