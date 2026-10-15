# Estrategia — Gateways El Salvador

## Base y estado del documento

Análisis basado en el texto de cuatro páginas del caso de estudio y en la guía **CUBO+: The Build Sprint 2026** proporcionados por el equipo. No se ha realizado una auditoría del sitio, entrevistas ni pruebas de integraciones. Las propuestas de estos documentos son hipótesis hasta contar con evidencia.

El caso alterna los nombres «Gateways» y «Getaways»: se usa **Gateways El Salvador**, nombre indicado en la información general. Confirmar la marca con la mentora.

**Contacto del caso:** Maureen Montano, Content Design Creator; Discord: `maureenm`. La URL del sitio aparece como un enlace sin destino en el texto recibido: está pendiente de solicitar.

## Lectura del desafío

No se trata solamente de rediseñar una página. Gateways necesita conectar descubrimiento, planificación, consulta, reserva, pago y fidelización, y medir qué canales generan resultados. El primer entregable es una auditoría que permita decidir entre optimizar WordPress, reconstruir o usar un enfoque híbrido; no asumir una reconstrucción por preferencia tecnológica.

El público descrito son viajeros internacionales, principalmente extranjeros no latinos, interesados en alojamiento boutique en El Zonte, surf, naturaleza, gastronomía y experiencias locales, tanto en estadías cortas como largas. Esto orienta la propuesta inicial, pero no reemplaza la validación con huéspedes.

## Documentos de trabajo

| Documento | Contenido |
| --- | --- |
| [01 — Oportunidad e impacto](01-oportunidad-impacto.md) | Problema, usuarios, investigación, propuesta de valor y recorrido actual/futuro |
| [02 — Auditoría y decisión](02-auditoria-decision.md) | Auditoría comercial/técnica, competencia y criterios WordPress/rebuild/híbrido |
| [03 — Especificaciones y prototipo](03-especificaciones-prototipo.md) | Requisitos, arquitectura propuesta, asistentes, Bitcoin y pruebas de aceptación |
| [04 — Marketing y medición](04-marketing-medicion.md) | Contenido, SEO, descubrimiento por IA, conversión, referidos, lealtad y KPIs |
| [05 — Modelo operativo](05-modelo-operativo.md) | Responsabilidades, sostenibilidad, mantenimiento, dependencias y riesgos |
| [06 — Bitácora y evidencias](06-bitacora-evidencias.md) | Google Docs, decisiones, índice de evidencias y preparación del PDF |
| [Checklist de cumplimiento](checklist/README.md) | Calendario, entregables y registro diario |

## Alcance propuesto para el sprint

Un recorrido demostrable en staging: **fuente/UTM → alojamiento → concierge con IA → itinerario visual → solicitud de reserva → pago Bitcoin de prueba → atribución/referido**. La lealtad debe tener reglas y una demostración mínima de elegibilidad.

La reserva automática depende de la integración disponible. Si no hay acceso a disponibilidad real, mostrar datos de prueba y una solicitud pendiente de confirmación humana, nunca una reserva confirmada ficticia. Esa limitación deberá declararse y validarse con la mentora; no elimina el requisito de explorar la integración.

No se propone migrar producción, mover fondos reales ni construir un PMS propio. Primero se valida lo existente y se demuestra el flujo en un entorno controlado.

## Responsabilidad compartida

Asignación inicial **propuesta**, pendiente de acuerdo del equipo:

| Integrante | Foco principal | Colaboración |
| --- | --- | --- |
| Roger Rogel | Investigación, oportunidad y modelo operativo | Validación de concierge, Bitcoin y propuesta de valor |
| Luis Bonilla | UX, marketing, especificaciones y Google Docs | Prototipo estratégico, métricas, referidos y PDF |
| Ricardo Fuentes | Auditoría técnica, experiencia web y concierge | SEO técnico, itinerario y accesibilidad |
| Mauricio Martinez | Integraciones, Bitcoin y medición | Referidos, pruebas y ejecución desde terminal |

Los dos perfiles business deben construir y mostrar un prototipo funcional con IA/low-code o flujos ejecutables, además de documentar. Los devs deben demostrar progreso diario real en GitHub. Los cuatro deben poder explicar el problema, la solución y sus límites.

## Bloqueos por resolver

1. URL oficial, acceso de solo lectura cuando aplique y permiso para staging.
2. Inventario, tarifas, políticas, FAQs y sistema actual de reservas/pagos.
3. Acceso autorizado a analítica y datos agregados; no subir información privada de huéspedes.
4. Google Doc con historial y permisos verificables, y enlaces reales de entrega del programa.
5. Confirmación de fechas: la guía menciona entrega el **3 de noviembre de 2026** y también el **8 de noviembre**. Planificar terminar y entregar el 3, sin asumir prórroga.
