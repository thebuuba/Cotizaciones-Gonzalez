# Rediseño de cotizaciones de Acabados Modernos González

Fecha: 2026-08-30  
Estado: Aprobado  
Sustituye las reglas de cotización y exportación de `2026-08-29-construction-quotation-pwa-design.md`.

## 1. Objetivo

La PWA permitirá que una sola persona complete digitalmente la misma información que aparece en la hoja física de cotización de **Acabados Modernos González**. La aplicación guardará los datos, hará los cálculos y exportará un documento profesional en PDF o imagen.

La interfaz de la aplicación conservará su estilo moderno inspirado en iOS. El documento exportado tendrá una identidad distinta y fiel a la hoja de referencia: negro, blanco y dorado.

## 2. Principio de fidelidad

El formulario y el documento final no añadirán conceptos comerciales que no aparecen en la hoja de referencia. En particular:

- No habrá descuentos.
- No habrá selección de moneda; todas las cantidades serán en pesos dominicanos (`RD$`).
- No habrá partidas de trabajo con precio fijo.
- No habrá ITBIS, anticipos calculados, cuotas ni balances pendientes.
- No se mostrarán teléfono o correo del cliente en el documento.

Los datos administrativos que la app necesite para organizar y recuperar información pueden existir internamente, pero no deben alterar la apariencia ni los campos del documento exportado.

## 3. Datos editables de cada cotización

Cada cotización contiene únicamente los siguientes datos visibles:

### Cliente

- Nombre
- Dirección
- Fecha de la cotización

### Materiales

Una lista dinámica de filas. Cada fila contiene:

- Número de orden generado automáticamente
- Descripción
- Cantidad
- Unidad
- Precio unitario
- Total calculado

La persona puede añadir, eliminar y ordenar filas. La tabla no conserva filas vacías en el documento: si existen tres materiales, se imprimen tres filas; si existen más, la tabla crece y continúa en páginas adicionales cuando sea necesario.

### Cierre

- Total de materiales, calculado automáticamente
- Mano de obra de instalación, introducida como un solo monto independiente
- Total general, calculado automáticamente
- Observaciones

## 4. Cálculos

Los importes se almacenan en centavos enteros para evitar errores de punto flotante.

- `total de fila = cantidad × precio unitario`
- `total de materiales = suma de los totales de las filas`
- `total general = total de materiales + mano de obra`

La cantidad puede admitir decimales para medidas como metros cuadrados. Los resultados monetarios se redondean a centavos y se muestran con el prefijo `RD$`.

## 5. Datos fijos configurables

Los siguientes datos se completan una sola vez en **Ajustes**, se guardan y se colocan automáticamente en cada exportación:

- Nombre y logotipo del negocio
- Lema principal
- Teléfono superior
- Términos y condiciones
- Cuentas bancarias, con banco, tipo y número de cuenta
- Nombre del gerente
- Cargo
- Teléfono para llamadas
- Teléfono de WhatsApp
- Sello o distintivo del negocio
- Mensajes del pie de página

La configuración inicial se precarga con el contenido de la hoja de referencia, incluyendo sus tres términos, sus tres cuentas bancarias, el gerente y los teléfonos mostrados. Todo queda editable en Ajustes para corregirlo sin modificar código.

## 6. Documento exportado

### Identidad visual

El documento se recreará programáticamente, en lugar de utilizar la fotografía como fondo. Esto mantiene texto y líneas nítidos, permite que la tabla cambie de tamaño y evita desalineaciones.

- Formato vertical con proporciones de hoja A4.
- Paleta negro, blanco y dorado.
- Encabezado de marca a la izquierda y bloque de teléfono a la derecha.
- Título grande `COTIZACIÓN`.
- Secciones, bordes, iconos y jerarquía visual fieles a la referencia.
- Tipografía legible y composición preparada para impresión.

### Contenido y paginación

La primera página incluye encabezado, cliente, fecha y el comienzo de la tabla. La tabla usa solamente el espacio requerido por las filas existentes, siempre que el cierre completo pueda mantenerse ordenado.

Cuando los materiales exceden el espacio disponible:

- Las filas continúan en una página adicional.
- El encabezado de columnas se repite.
- Ninguna fila ni bloque de totales se corta entre páginas.
- Los totales y el contenido de cierre aparecen después de la última fila.
- Se conserva la identidad del negocio en todas las páginas.

Después de la tabla aparecen total de materiales, mano de obra, total general, términos, observaciones, cuentas bancarias, gerente, teléfonos y pie de marca.

### Formatos

- **Exportar PDF:** produce un PDF A4, con una o más páginas según el contenido.
- **Exportar imagen:** produce una imagen PNG de alta resolución por cada página del documento; si solo existe una página, produce una sola imagen.

La previsualización utiliza el mismo renderizador y los mismos datos que las exportaciones, para evitar diferencias entre lo visto y lo descargado.

## 7. Validación

Antes de exportar se requiere:

- Nombre del cliente
- Dirección
- Fecha
- Al menos un material completo
- Cantidad mayor que cero
- Unidad
- Precio unitario igual o mayor que cero
- Mano de obra igual o mayor que cero

La descripción y los importes no pueden quedar cortados ni desbordar la tabla. Los errores se muestran junto al campo correspondiente y el formulario enfoca el primer error.

## 8. Guardado y nube

- Todos los cambios válidos se guardan automáticamente en el dispositivo.
- La PWA funciona sin conexión después de su preparación inicial.
- Clientes, cotizaciones y Ajustes se sincronizan con una cuenta privada en la nube cuando hay conexión.
- Al iniciar sesión en otro dispositivo, la persona puede recuperar sus datos.
- Los cambios pendientes permanecen en una cola local hasta que la sincronización tenga éxito.
- Los borradores pueden abrirse, editarse, duplicarse o eliminarse.

El alcance sigue siendo de una sola persona. No se añaden equipos, roles, invitaciones ni edición simultánea.

## 9. Modelo de datos revisado

### BusinessProfile

Contiene todos los datos fijos definidos en la sección 5, además de sus referencias de logotipo y sello.

### Client

Puede conservar información de contacto para uso interno de la app, pero el documento solo consume nombre y dirección.

### Quotation

- Referencia del cliente
- Copia del nombre y dirección usados al emitir el documento
- Fecha
- Estado interno para organizar borradores y cotizaciones
- Mano de obra en centavos
- Observaciones
- Total de materiales calculado
- Total general calculado
- Versión de la plantilla usada al exportar

### MaterialItem

- Referencia de la cotización
- Descripción
- Cantidad decimal
- Unidad
- Precio unitario en centavos
- Total de fila calculado
- Orden visual

Los campos anteriores de moneda seleccionable, tipo de descuento, valor de descuento, precio fijo por trabajo, alcance, duración e imágenes de proyecto dejan de formar parte del formulario y de la plantilla aprobados.

## 10. Flujo principal

1. Crear o abrir una cotización.
2. Elegir un cliente existente o introducir nombre y dirección.
3. Seleccionar la fecha.
4. Añadir materiales y completar descripción, cantidad, unidad y precio unitario.
5. Introducir el monto único de mano de obra.
6. Añadir observaciones cuando correspondan.
7. Revisar los cálculos y la vista previa.
8. Guardar, exportar como PDF o exportar como imagen.

El formulario se presenta como un flujo sencillo y móvil; no obliga a rellenar datos que no aparecen en la hoja.

## 11. Criterios de aceptación

- Tres materiales generan exactamente tres filas visibles.
- Una cantidad grande de materiales pagina sin cortar filas ni ocultar el cierre.
- Cada total de fila coincide con cantidad por precio unitario.
- El total de materiales coincide con la suma de las filas.
- El total general coincide con materiales más mano de obra.
- Todos los valores se presentan exclusivamente en `RD$`.
- No aparecen descuentos, dólares ni conceptos ajenos a la referencia.
- La vista previa, el PDF y las imágenes contienen los mismos valores.
- El PDF conserva nitidez al imprimir en A4.
- Cada página exportada como imagen tiene resolución suficiente para compartirla por WhatsApp.
- Los datos del negocio configurados en Ajustes aparecen automáticamente.
- Un borrador sobrevive al cierre de la app y puede recuperarse sin conexión.
- La sincronización restaura los datos en una instalación nueva autenticada con la misma cuenta.

## 12. Impacto sobre el trabajo existente

La navegación, el dashboard, el perfil del negocio, el almacenamiento local y la base de clientes existentes se conservan cuando sean compatibles. Antes de implementar el editor y la exportación se debe reemplazar el modelo anterior de partidas fijas y descuentos por materiales con cantidad, unidad y precio unitario.

El plan de implementación anterior no debe seguir ejecutándose en las secciones que contradigan este documento. Se preparará un plan revisado después de la aprobación final de esta especificación.
