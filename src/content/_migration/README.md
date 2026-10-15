# Evidencia de la migración

[Guía de contenido](../README.md) · [Índice de documentos](../INDEX.md)

Esta carpeta documenta la extracción del sitio anterior; no define páginas nuevas ni datos operativos actuales. Los JSON son evidencias históricas, no archivos para editar el contenido de la futura web.

## Qué consultar

| Archivo | Propósito |
| --- | --- |
| [inventory.json](inventory.json) | URLs descubiertas, destinos, archivos Markdown, procedencia y huellas del HTML |
| [media.json](media.json) | Referencias a imágenes y recursos CSS; no contiene los binarios |
| [verification-summary.json](verification-summary.json) | Resumen del estado al terminar la captura, no recuento actualizado de los documentos de esta guía |
| [discovery-verification.json](discovery-verification.json) | Cobertura frente a fuentes públicas de WordPress y destinos de botones |
| [cross-verification-articles-pages.json](cross-verification-articles-pages.json) | Revisión final de artículos, páginas y redirecciones, más revisión de componentes compartidos |
| [cross-verification-catalogs-archives.json](cross-verification-catalogs-archives.json) | Revisión final de alojamientos, catálogos y archivos del blog |
| [verify.py](verify.py) | Comprobación local reproducible, sin dependencias externas |

Los informes iniciales se conservan como historial y están **sustituidos por las revisiones finales** indicadas en su campo `superseded_by`:

- [blog-verification.json](blog-verification.json)
- [properties-verification.json](properties-verification.json)
- [archives-verification.json](archives-verification.json)
- [general-verification.json](general-verification.json)

No interpretar observaciones iniciales ya corregidas como incidencias pendientes. Tampoco confundir la ausencia de diferencias con el HTML con la ausencia de contradicciones en el sitio original.

## Descubrimiento y fidelidad

- Fuente: <https://getawayselsalvador.com/>. El instante UTC de captura figura en `captured_at` del inventario y de los documentos.
- Se recorrieron los sitemaps públicos de Jetpack y Yoast y, después, los enlaces HTML internos hasta no descubrir más rutas. Se incluyó la paginación.
- El inventario contiene 112 URLs: 71 rutas HTML con Markdown individual (61 sin redirección y 10 redirigidas) y 41 rutas de adjuntos que redirigían directamente a imágenes. Estas últimas figuran en el índice y el inventario; no son páginas editoriales.
- La API pública de WordPress confirmó 18 artículos y 5 páginas publicadas, todos incluidos. Los 10 alojamientos se contrastaron con el sitemap de HivePress. Los recuentos de WordPress no equivalen al número de documentos por carpeta.
- Cuatro subagentes GPT-6 Luna convirtieron los grupos y los cotejaron con las capturas HTML. Sus informes iniciales se conservan arriba.
- La revisión posterior detectó diferencias que se corrigieron y cotejaron de nuevo contra las fuentes. Los dos informes `cross-verification-*` documentan también las correcciones finales del agente principal y prevalecen sobre la primera conversión.
- Se conserva el inglés original, sin traducciones, resúmenes ni correcciones editoriales. Los documentos de rutas identifican URL original, canonical y huella SHA-256 del HTML utilizado.
- La verificación comprueba fidelidad a lo publicado, **no la veracidad externa** de recomendaciones, precios, afirmaciones de seguridad o servicios.

## Límites de la captura

- Las imágenes conservan sus URLs públicas; **no se descargaron los binarios durante esta extracción**. `media.json` recopila referencias sin prometer todas las variantes responsive ni recursos cargados externamente. Esto no describe posibles descargas posteriores en otras carpetas del proyecto.
- Los enlaces siguen apuntando al sitio original o al servicio externo. Antes de publicar habrá que remapearlos y decidir el alojamiento de los medios.
- Los formularios, autenticación y widgets se documentan, pero Markdown no reproduce su funcionamiento. No se enviaron formularios, solicitudes de reserva ni correos.
- Disponibilidad, cotizaciones y datos de widgets cargados en tiempo real no se inventan ni se consideran migrados. Tampoco se incluyen áreas privadas, borradores o páginas de dominios externos.
- `/properties/page/2/` se conserva por separado aunque el sitio declare un canonical a `/properties/`; un canonical compartido no basta para descartar contenido paginado.
- Crawl4AI devolvió un bloqueo anti-bot. La extracción se hizo mediante solicitudes HTTP directas a páginas públicas, sin guardar la pantalla de bloqueo como contenido.
- `source_file` señala la caché HTML temporal utilizada durante la extracción; esa caché no se incluye en el repositorio. Las huellas y los informes sí se conservan.
- El código HTTP del inventario es el **estado final** después de seguir redirecciones; no prueba que cada salto original sea 301 o 302.

## Comprobación reproducible

Desde el directorio del proyecto (`src/`):

```sh
python3 content/_migration/verify.py
```

Usa únicamente la biblioteca estándar. Verifica cobertura de archivos inventariados, metadatos esenciales, enlaces Markdown locales, destinos de redirección e informes. Si la caché HTML temporal sigue disponible, comprueba también sus huellas. Detecta cambios en los 71 documentos de rutas mediante las huellas de salida guardadas en las revisiones finales; no valida la veracidad de sus datos ni vuelve a consultar el sitio.

El resumen histórico registra 1.950 elementos de texto, 3.579 nodos de texto, 463 destinos de enlaces y 372 referencias a imágenes contrastados contra las fuentes seleccionadas. Los cotejos de contenido y las comprobaciones en vivo de la extracción están en los informes individuales. Las guías e índices no forman parte de esas huellas de salida.
