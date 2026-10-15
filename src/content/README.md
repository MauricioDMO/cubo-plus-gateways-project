# Contenido de Getaways El Salvador

## Objetivo

Conservar el contenido público de <https://getawayselsalvador.com/> como referencia verificable para revisar y preparar la migración del sitio: **presentar alojamientos, ayudar a planificar la estadía y conducir a una consulta o reserva**.

Esta carpeta es una **captura documental, no un CMS ni un sistema de reservas**. Actualmente la aplicación no consume estos archivos. Las funciones de formularios, disponibilidad, reservas y pagos no están implementadas aquí.

- [Índice de documentos](INDEX.md): contenido principal primero; listados y rutas técnicas después.
- [Documentación de la captura](_migration/README.md): método, informes, límites y verificación.

## Qué contiene y para qué sirve

Las 71 rutas HTML no representan 71 piezas de contenido independientes:

| Grupo | Ubicación | Uso |
| --- | --- | --- |
| **3 páginas principales** | [Inicio](paginas/inicio.md), [About Us](paginas/about.md), [Contact Us](paginas/contact-us.md) | Propuesta, empresa, testimonios y contacto |
| **10 alojamientos** | `alojamientos/apartamentos/`, `alojamientos/villas/` | Ficha de cada propiedad: descripción, fotos, atributos y reglas |
| **18 artículos** | `blog/articulos/` | Guías, recomendaciones y contenido editorial |
| 29 listados | `alojamientos/catalogos/` (5); `blog/index.md`, `blog/page/`, `blog/archivos/` (24) | Capturas de vistas que reúnen alojamientos o artículos existentes |
| 1 acceso público | `paginas/account/login.md` | Referencia de la pantalla de acceso del sitio anterior |
| 10 redirecciones | `redirecciones/` | Relación entre URL antigua y destino; no son páginas nuevas |
| 2 componentes compartidos | `compartido/` | Navegación, pie e integraciones; no cuentan como rutas HTML |
| Evidencia técnica | `_migration/` | Inventario, referencias a medios y revisiones; no es contenido publicable |

**Punto de partida: 31 documentos principales y 2 componentes compartidos.** Los listados sirven para estudiar la presentación anterior, no para crear otra copia de cada entidad.

## Qué se repite

| Repetición observada | Cómo tratarla al implementar |
| --- | --- |
| Tarjetas de propiedades en inicio, catálogos y `Related Listings` | Una ficha por alojamiento; las vistas la referencian. Los atributos de una tarjeta relacionada pertenecen a otra propiedad, no a la ficha que la contiene. |
| Tarjetas de artículos en blog, categorías, etiquetas, autor e inicio | Un artículo por URL de origen; generar los listados desde sus metadatos. |
| 16 etiquetas con solo **4 listados distintos**, descontando metadatos y encabezado principal | Conservar las rutas históricas. Revisar la taxonomía antes de decidir qué etiquetas consolidar. |
| Formularios de acceso/contacto descritos en páginas y en `compartido/` | Implementar cada formulario una sola vez; la documentación repetida describe sus distintas ubicaciones. |
| URLs, huellas y resultados en varios JSON | Son evidencias de distintas revisiones, no contenido editorial duplicado. Los informes finales prevalecen sobre los iniciales. |

Los cuatro grupos de etiquetas con el mismo listado son:

- `airport-transfer-el-salvador`, `el-salvador-safe-women`, `solo-female-travel-el-salvador`, `solo-travel-central-america`.
- `bitcoin`, `guide`, `tourism`, `zonte`.
- `brunch`, `coffee-in-el-salvador`, `coffee`, `foodies-el-salvador`, `foodies`.
- `el-salvador-travel-tips`, `el-zonte-guide`, `surf-city-el-salvador`.

Un artículo sobre un alojamiento **no es otra propiedad ni necesariamente un duplicado**: por ejemplo, la [ficha de Sunset Surf](alojamientos/apartamentos/sunset-surf-getaway.md) y su [artículo](blog/articulos/2026/09/08/sunset-surf-getaway.md) cumplen funciones distintas.

## Datos que necesitan confirmación

No se corrigieron las capturas por suposición:

- **Baños de Sun & Salt:** la [ficha](alojamientos/apartamentos/sun-salt-getaway.md) muestra `2BA` en el título, `Bathrooms: 1` en atributos y describe dos baños privados más uno social; el [artículo](blog/articulos/2026/09/14/sun-salt-gateway.md) afirma tres. Confirmar con el responsable antes de publicar o responder desde un asistente.
- **Nombre de Sun & Salt:** el artículo dice «Gateway» y la ficha «Getaway». Confirmar el nombre comercial; no cambiar el slug histórico sin definir su redirección.
- **Slug heredado:** [Getaways Guides: El Zonte](blog/articulos/2021/09/20/secret-interior-design-tips-and-tricks-you-should-know.md) conserva una URL sobre diseño de interiores que no corresponde a su tema actual. No es otro artículo pendiente de migrar.
- **Etiquetas poco específicas:** varios artículos de cafés, surf y alquileres comparten etiquetas de viaje femenino y traslados. Revisar pertinencia editorial; compartir un listado no significa que las etiquetas sean sinónimos.

## Regla de uso

1. Elegir el documento principal desde el índice; no copiar datos desde un listado. En las fichas, separar el contenido propio de `Related Listings`.
2. Para una futura web o base de conocimiento, reutilizar cada entidad una vez y excluir listados, redirecciones e informes como fuentes editoriales independientes. Es una recomendación de implementación, no una integración ya realizada.
3. Mantener las capturas verificadas como referencia histórica. Registrar aparte las correcciones aprobadas; no actualizar huellas para hacer pasar una edición como si fuera el original.
4. Antes de publicar, confirmar datos contradictorios, remapear enlaces, decidir el alojamiento de imágenes y conectar las funciones reales. La fidelidad de la captura no garantiza la vigencia ni la veracidad de lo publicado.

No se movieron ni eliminaron documentos de origen: sus rutas y huellas siguen siendo comprobables.
