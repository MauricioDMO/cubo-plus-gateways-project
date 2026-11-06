# Verificación, demo y decisiones de entrega
**Revisión del 6 de noviembre de 2026.** Se inspeccionó la rama principal en 43e84fb y se preparó el cambio en una rama separada para revisión de los cuatro integrantes.

## Comprobaciones
| Comprobación | Resultado y alcance |
| --- | --- |
| Tipos TypeScript | pnpm exec tsc --noEmit -p . pasó sobre la versión actual. |
| Suite ordinaria | 478 pruebas pasaron y 24 quedaron omitidas por sus condiciones de entorno. |
| Referidos con base de datos | 13 de 13 pasaron con las diez migraciones del repo aplicadas a PGlite desechable. Incluye solicitudes simultáneas, registro idempotente y sincronización desde el estado de reserva. PGlite multiplexa conexiones. El ensayo de bloqueo entre procesos en PostgreSQL nativo queda pendiente. |
| Lint | Cero errores y dos advertencias previas, en plan1-bcrypt.mts y referral-lifecycle.ts. |
| Compilación | Next.js compiló correctamente con las diez migraciones aplicadas a una base local desechable. La generación de páginas consulta PostgreSQL y necesita DATABASE_URL. |
| Política | Diez ejemplos ejecutables con datos sintéticos: primer referido, huésped recurrente, cancelación, devolución, política pendiente, propietario desconocido, autorreferido, duplicado, estadía pendiente y primera visita orgánica. Ningún caso emite saldo. |

## Recorrido ejecutado en Chromium

Se probó Next.js en desarrollo con datos sintéticos y PGlite. Una cuenta de prueba abrió la ficha con código prellenado, comprobó que estaba activo y lo quitó y volvió a ingresar a 390 px de ancho. La ficha no desbordó horizontalmente. Desde el formulario se creó una reserva y se observó exactamente una atribución pendiente. Con la misma sesión se consultó la cotización y se completó el pago simulado por las rutas locales. Esa fila pasó a confirmada.

Para la posestadía se cargó una reserva histórica sintética. Dos emisiones verificadas devolvieron el mismo enlace. Al reservar desde la cuenta del promotor se observaron cero atribuciones con ese código. Al reservar desde otra cuenta se observó una. Esta prueba verifica el formulario, autenticación, persistencia y sincronización del prototipo. Costos, pago IBEX real, salida efectiva del huésped y entrega de incentivos requieren validación aparte.

## Demo de tres minutos
1. Mauricio prepara PostgreSQL local, catálogo y login según el README técnico. Roger muestra la invitación de campaña /?ref=GETAWAYSDEMO y sigue hasta una ficha con una cuenta de prueba.
2. Revisar el código, comprobar uno inactivo y volver al válido. El total debe permanecer igual. Quitar el código y mostrar que el huésped puede continuar.
3. Enviar una solicitud referida y consultar el reporte. Mostrar una fila pending. Completar el pago de prueba en desarrollo. Confirmar que la misma fila cambia a confirmed.
4. Usar una estadía sintética pasada con salida verificada. Ejecutar invite dos veces para la misma cuenta. Comprobar URL estable, rechazo del mismo huésped y atribución a otra cuenta. Ocultar identificadores y datos de contacto en la evidencia.
5. Ejecutar node scripts/referrals-demo.mts. Explicar cuál de los casos se puede enviar a revisión por el operador y por qué una reserva confirmada todavía no prueba estadía completada.

## Bitácora para el Google Doc de Luis y Roger
Entrada propuesta con la fecha real de esta revisión: «6 de noviembre. Revisamos el código con cuentas de huésped y reservas PostgreSQL, la portada pública y tres alternativas en El Zonte. En el prototipo se agregó revisión de códigos, invitación vinculada a la cuenta y exclusión de autorreferidos. Registramos las pruebas y separamos las políticas propuestas de las aprobadas. Próximo paso: revisar discrepancia de baños en Sun & Salt, probar tareas con viajeros y obtener aprobación de reglas y costos».

Luis debe crear o identificar el Google Doc de trabajo y compartirlo con los permisos del programa. Roger debe registrar allí su trabajo real y las siguientes revisiones en sus fechas. Confirmar con el revisor que pueda auditar el historial. No se verificó ese acceso.

## Límites que debe explicar el equipo
El concierge público del prototipo prepara un correo. Falta demostrar modelo IA e itinerario dinámico. El proveedor Bitcoin usa datos simulados y sigue pendiente el sandbox real con gestión de expiración y reembolso. No se verificó un flujo completo UTM → reserva confirmada ni un staging público. Los resultados comerciales requieren datos agregados autorizados, período comparable y entrevistas. En producción, la atribución inicial necesita recuperación duradera y los beneficios necesitan un registro único de emisión/reversión.
