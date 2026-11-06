# Oportunidad, evidencia y recorrido
**Revisión del 6 de noviembre de 2026 · Nestor Rogel · CUBO+**

**Decisión propuesta.** Conservar el WordPress público y probar la reserva directa, los referidos y las integraciones en un entorno controlado. La decisión de migrar requiere comparar inventario, continuidad de reservas, redirecciones, costos y capacidad de mantenimiento. El prototipo ya permite investigar estas preguntas sin trasladar producción.

## Qué sabemos y cómo lo sabemos
| Evidencia | Observación | Implicación |
| --- | --- | --- |
| Caso CUBO+, Assignment Gateways | El negocio desea más reservas directas y mejor atribución. | Separar descubrimiento, solicitud aceptada, pago, reserva confirmada y estadía completada. Falta línea base. |
| Notas de Roger de la conversación con el operador | Roger reportó Hostfully como PMS, Airbnb y Booking.com como canales, enlaces de pago y uso de IBEX Lightning con liquidación en USD. El negocio priorizó aumentar reservas y mejorar la eficiencia de creación de contenido para público angloparlante. | Usar estas notas como antecedentes. Reconfirmar vigencia, acceso, condiciones de reembolso y costos antes de integrar. La sesión del 6 de noviembre no incluyó una nueva entrevista. |
| [Inicio público](https://getawayselsalvador.com/) | La portada se identifica como Getaways, presenta un concierge por llamada, nueve apartamentos y una categoría de villas vacía. También ofrece guías sobre experiencias locales. | Conservar fichas y guías. Dar prioridad a alojamientos disponibles y ofrecer una ruta de consulta con fechas para quienes prefieren evitar una llamada. |
| [Ficha anunciada desde portada](https://getawayselsalvador.com/) | La tarjeta Sun & Salt anuncia dos baños en el título y uno en los atributos. | Roger debe comprobar el dato con el operador, reconciliar ficha y PMS y registrar fecha/fuente antes de reutilizarlo en IA. |
| [Código base auditado](https://github.com/MauricioDMO/cubo-plus-gateways-project/tree/43e84fb94d1ca5579d254581089c121db94269ab/src) | La reserva requiere cuenta de huésped y PostgreSQL. El formulario concierge prepara un correo. El proveedor Bitcoin utiliza una dirección simulada. | Probar el paso por login y la atribución. Demostrar IA, itinerario y proveedor Lightning por separado. |

Las observaciones públicas corresponden a una lectura del sitio el 6 de noviembre. No se inspeccionaron plugins, datos privados de tráfico o configuración del WordPress. Las entrevistas exploratorias con viajeros y las conversiones comerciales quedan pendientes.

## Tres alternativas para el viajero
Consulta de páginas oficiales el 6 de noviembre de 2026. Son alternativas de alojamiento en El Zonte, con diferencias de producto frente a los apartamentos de Getaways.

| Operador | Observación pública | Qué probar en Getaways |
| --- | --- | --- |
| [Puro Surf](https://www.purosurf.com/hotel) | Relaciona habitaciones, surf, tours y paquetes. Explica que el desayuno está incluido. | Conectar cada guía con una propiedad y distinguir servicios incluidos de actividades opcionales. |
| [Palo Verde](https://paloverdehotel.com/hotel-rooms/) | Las habitaciones muestran una acción de reserva y explican desayuno, estacionamiento y acceso a playa. | Mostrar inclusiones y condiciones junto a la acción de reservar. |
| [Esencia Nativa](https://esencianativa.com/) | Presenta su historia familiar, su ubicación frente al surf y acceso a habitaciones y reserva. | Vincular la identidad local de Getaways con una acción concreta para el viajero. |

**Precio comparable pendiente.** Las páginas revisadas no proporcionaron una cotización homogénea. Obtener el total para dos adultos, mismas fechas y número de noches, misma moneda y cancelación comparable. Registrar impuestos y disponibilidad. Una tarifa desde una noche suelta no representa el total de una estadía.

## Recorrido de adquisición a regreso
| Etapa | Recorrido actual respaldado o reportado | Cambio y señal de éxito |
| --- | --- | --- |
| Descubrimiento | Guías, redes, recomendaciones y OTAs. La contribución por canal se desconoce. | Enlace identificable a guía/ficha. Guardar fuente conocida y permitir desconocida. |
| Evaluación | Portada y fichas muestran servicios. Al menos una tarjeta contiene información contradictoria. | Fuente por propiedad; el viajero explica condiciones y total antes de pagar. |
| Planificación | CTA para llamada y formulario de correo en el prototipo. | Resolver FAQ aprobada, escalar desconocidos y generar itinerario editable con fuentes. |
| Reserva | El prototipo exige login y crea solicitud pendiente. Hostfully es el sistema reportado por Roger. | Conservar fechas y código al volver del login. Confirmar disponibilidad con fuente autorizada. |
| Pago | El caso solicita explorar Bitcoin. El prototipo presenta una simulación. | Factura sandbox, vencimiento, verificación en servidor y conciliación. |
| Posestadía | El operador verifica salida para emitir una invitación en el prototipo. | Un invitado usa el enlace. El operador distingue solicitud referida, reserva confirmada y beneficio revisable. |
