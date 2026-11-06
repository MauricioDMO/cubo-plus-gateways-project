# Operación, lealtad y medición
**Piloto propuesto para revisión de Gateways.** Las reglas económicas requieren aprobación antes de ofrecerlas a huéspedes.

## Invitación y beneficio
Tras una estadía confirmada cuya fecha de salida haya llegado, el operador comprueba salida efectiva, pago conciliado y ausencia de devolución. Con una cuenta de huésped identificada, emite el enlace desde la CLI local. Repetir la emisión para la misma cuenta devuelve el mismo código. Una cuenta que usa su propio enlace puede reservar, pero queda excluida de atribución. Los códigos promocionales históricos como GETAWAYSDEMO siguen midiendo campañas sin identificar un promotor.

El prototipo conserva un código por pestaña. El huésped puede verlo, cambiarlo o eliminarlo en la ficha. La URL de regreso del login conserva la elección del código y las fechas enviadas. El selector actual inicializa las fechas por defecto; Ricardo debe verificar y corregir la restauración de las fechas seleccionadas. El servidor revalida el código y atribuye una sola vez por reserva. La tabla de referidos y reservas están en PostgreSQL. La atribución inicial sigue siendo un paso posterior de mejor esfuerzo; si falla después de aceptar la reserva, se puede perder la fuente. Mauricio debe diseñar reintento duradero y conciliación antes de producción.

| Decisión | Propuesta para piloto | Control de operación |
| --- | --- | --- |
| Adquisición | Crédito ilustrativo de USD 20 para la próxima estadía del promotor después de la primera estadía completada del invitado. | Probar margen con datos del negocio. Sin descuento automático para el invitado. |
| Retorno | Prioridad para solicitar salida tardía en una nueva estadía de un huésped recurrente. | Operador confirma disponibilidad. Prohibir acumulación con crédito de adquisición por la misma estadía. |
| Tope y vigencia | Considerar 90 días y tres créditos por promotor al mes. | Parámetros propuestos; validar presupuesto, vencimiento y comunicación antes del piloto. |
| Reembolso o disputa | Suspender elegibilidad y revisar emisión previa. | Conciliar por ID de reserva y versión de política. Registrar motivo y reversión en un registro privado. |
| Duplicado | Una decisión por programa y reserva. | El simulador recibe el estado previo; un sistema productivo exige restricción única, transacción y control de acceso. |

Costo ilustrativo: si una reserva aporta USD 60 después de costos variables, un crédito de USD 20 y USD 5 de soporte dejan USD 35. Estas cifras son un ejemplo de decisión. Obtener ingresos, costos, comisiones y soporte reales antes de recomendar un importe.

## Bitcoin y confirmación
Roger reportó enlaces Lightning mediante IBEX y liquidación en dólares. Confirmar configuración y contrato actuales. Para el piloto, ofrecer Bitcoin después de mostrar la cotización y junto a las alternativas aceptadas. Presentar importe, red, vencimiento y política de reembolso. El servidor debe verificar el proveedor y diferenciar pago recibido, reserva confirmada y estadía completada. Mauricio debe probar sandbox, pago tardío, expiración y evento duplicado. Separar comisiones de procesamiento, conversión, conciliación, soporte e integración. No existe todavía una línea base que permita estimar ahorro o incremento de demanda.

## Medición y responsabilidades
| Indicador | Numerador / denominador | Responsable y fuente |
| --- | --- | --- |
| Conversión a solicitud | Solicitudes únicas aceptadas / sesiones elegibles medidas | Luis y Mauricio; eventos consentidos y servidor. |
| Participación directa | Reservas directas confirmadas / todas las confirmadas del período | Operador y Roger; PMS agregado. |
| Cobertura de origen | Confirmadas con fuente conocida / confirmadas | Mauricio; fuente observada separada de autodeclarada. |
| Conversión de referidos | Confirmadas atribuidas / solicitudes atribuidas de la misma cohorte | Reporte PostgreSQL; contar canceladas por separado. |
| Retorno | Huéspedes que vuelven / huéspedes previos con la misma ventana de observación | Operador; historial verificado. |
| Uso de Bitcoin | Pagos Bitcoin conciliados / reservas elegibles confirmadas | Mauricio y operador; separar mock, sandbox y producción. |

Registrar período, denominador, rezago y exclusiones en cada resultado. Si el denominador es cero, informar «sin datos». No incluir datos de contacto, URL completa ni transcripciones en analítica. Distinguir clic a WhatsApp, solicitud, confirmación y salida efectiva. Propuesta inicial: 28 días previos y un período comparable posterior, con estacionalidad y campañas documentadas.

Roger + negocio aprueban FAQs, políticas y contenido por propiedad. Luis con Roger mantiene Google Docs, campañas y análisis semanal. Ricardo mantiene sitio, modelo IA, itinerario y SEO. Mauricio mantiene integraciones, pagos y atribución. Los cuatro revisan la demo. Antes de transferir, acordar por escrito quién posee hosting, credenciales, presupuesto, respaldos, atención y capacidad de revertir un cambio.
