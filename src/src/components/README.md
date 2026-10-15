# Landing · Atomic Design

- `atoms/`: enlaces de acción e iconos. Se reutilizan el logo y la palmera existentes de `getaways/`.
- `molecules/`: encabezados y tarjetas de categoría, alojamiento y artículo.
- `organisms/`: navegación, portada, secciones de contenido, propiedades y reseñas.
- `templates/landing-page.tsx`: composición de la landing.
- `app/page.tsx`: página que utiliza la plantilla.

Contenido: `content/landing.ts`, seleccionado de los documentos de `content/` y contrastado con la web original. Fotografías originales guardadas en `public/getaways/`; `next/image` genera las variantes optimizadas. No se añaden librerías de UI.

Los filtros y las reseñas funcionan localmente. Las fichas, reservas, contacto, acceso y registro de propiedades enlazan al sitio original; no se simula un backend.

## Comprobación

```sh
pnpm lint
pnpm exec tsc --noEmit
pnpm build
pnpm dev
```

Con la aplicación abierta, ejecutar `scripts/check-landing.js` como snippet en la consola del navegador, en escritorio y móvil. Comprueba filtros, reseñas, recorrido circular, menú y Escape, enlaces internos, imágenes y desbordamiento. Devuelve `passed: true` o lanza el primer error.
