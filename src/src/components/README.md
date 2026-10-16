# Getaways · Atomic Design

- `atoms/`: enlaces de acción, salto al contenido, contenedores e iconos. Se reutilizan el logo y la palmera existentes de `getaways/`.
- `molecules/`: encabezados, métodos de contacto y tarjetas de categoría, alojamiento y artículo.
- `organisms/`: navegación, portada, secciones de contenido, propiedades, reseñas, About Us y contacto.
- `templates/`: composición de inicio, About Us y contacto.
- `app/page.tsx`, `app/about/page.tsx` y `app/contact-us/page.tsx`: rutas que utilizan las plantillas; About Us y contacto incluyen metadatos propios.

Contenido: `content/landing.ts`, seleccionado de los documentos de `content/` y contrastado con la web original. Fotografías originales guardadas en `public/getaways/`; `next/image` genera las variantes optimizadas. No se añaden librerías de UI.

About Us: `content/about.ts` conserva los cuatro párrafos y la bienvenida de `content/paginas/about.md`. La fotografía original del equipo (`DSC09155.jpg`) se guarda en `public/getaways/about.jpg`. Reutiliza átomos, `SectionHeading`, navegación, cierre y pie de la landing, sin modificar la captura histórica.

Contacto: `content/contact.ts` conserva el texto y correo de `content/paginas/contact-us.md`, con el teléfono proporcionado por el propietario: **+503 6062 7813**. Teléfono y correo tienen enlaces directos; el teléfono también aparece en el pie compartido. El formulario valida nombre y correo con HTML y prepara un borrador `mailto:` para revisar y enviar desde la aplicación de correo del visitante. No envía ni almacena mensajes en el servidor y no simula confirmaciones de envío.

Las reseñas funcionan localmente. Inicio, About Us y contacto enlazan a rutas locales. Las fichas, reservas, acceso y registro de propiedades enlazan al sitio original; no se simula un backend.

## Comprobación

```sh
pnpm lint
pnpm exec tsc --noEmit
pnpm build
pnpm dev
```

Con la aplicación abierta, ejecutar `scripts/check-landing.js` como snippet en la consola del navegador, en escritorio y móvil. Comprueba filtros, reseñas, recorrido circular, menú y Escape, enlaces internos, imágenes y desbordamiento. Devuelve `passed: true` o lanza el primer error.

En `/about`, ejecutar `scripts/check-about.js` del mismo modo. Comprueba metadatos, contenido, navegación activa, enlaces, menú móvil, Escape, imágenes y desbordamiento.

En `/contact-us`, ejecutar `scripts/check-contact.js`. Comprueba teléfono, correo, navegación, validación nativa, codificación del borrador, edición, etiquetas accesibles, menú, imágenes y desbordamiento, sin enviar mensajes ni abrir aplicaciones externas.
