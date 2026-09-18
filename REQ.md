## Plan: Cerrar Requerimientos de Libero Web

### Diagnóstico resumido

El repositorio tiene una base funcional de Angular + NestJS + TypeORM/MySQL: registro, login, hashing bcrypt, JWT, guardas, roles, publicaciones, eventos, comentarios, reacciones, páginas públicas y un endpoint público de Facebook. Sin embargo, varias funciones son parciales o de demostración y no hay evidencia de operación productiva, pruebas suficientes ni infraestructura de disponibilidad.

### Matriz de cobertura

| Requisito                                               | Estado                       | Evidencia / brecha principal                                                                                                                                                                                                              | Encargado           |
| ------------------------------------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| RF-01 registro para recibir noticias                    | Parcial                      | Existe `POST /auth/register` y formulario con `IsEmail`, pero registra una cuenta; no existe suscripción/newsletter, consentimiento persistido ni baja.                                                                                   | Sebas               |
| RF-02 inicio de sesión                                  | Parcial                      | Login NestJS con bcrypt/JWT y formulario Angular; falta integración robusta de sesión en frontend, guards de rutas, almacenamiento/renovación segura del token y pruebas.                                                                 | Eduardo             |
| RF-03 recuperación de contraseña                        | Ausente                      | `AuthService.requestPasswordReset` y `resetPassword` son TODO: no generan/validan token, no actualizan usuario ni envían correo.                                                                                                          | Thomas              |
| RF-05 roles y permisos                                  | Parcial                      | Existen `JwtAuthGuard`, `RolesGuard`, roles y seed; muchos endpoints mutantes no tienen `@ROLES`/`@PRIVATE`, y no hay panel de administración ni gestión granular de permisos.                                                            | Thomas              |
| RF-09 CMS de noticias                                   | Parcial                      | Entidad/CRUD de publicaciones existe, pero crear/editar/eliminar no están protegidos explícitamente y el frontend `/noticias` usa datos hardcodeados. Falta workflow/editor CMS.                                                          | Stiven              |
| RF-10 misión, visión y valores editables                | Ausente                      | `/about` contiene texto estático; no existe entidad, API ni panel de contenido institucional.                                                                                                                                             | Thomas              |
| RF-11 consulta pública corporativa                      | Parcial                      | Home, about, eventos y noticias son rutas públicas, pero noticias no consume el backend y no se ha validado compatibilidad, SEO ni accesibilidad.                                                                                         | Stiven              |
| RF-12 correos masivos programados                       | Ausente                      | No existe suscripción, campañas, plantilla, cola, programación ni job; `nodemailer` está instalado pero no usado en un flujo funcional.                                                                                                   | Sebas               |
| RF-13 alertas de fallos críticos                        | Ausente                      | No existe health check, logging estructurado, monitoreo, alertas, métricas ni canal de notificación.                                                                                                                                      | Danny               |
| RF-14 formulario de PQRs                                | Ausente                      | No hay módulo, entidad, endpoint, almacenamiento ni envío de mensajes para las PQRs.                                                                                                                                                      | Stiven              |
| RF-16 planes/cronogramas administrables                 | Parcial/ausente              | Hay módulo de eventos, pero no un dominio de planes/cronogramas con estados aprobar/cambiar/descartar/actualizar ni panel admin.                                                                                                          | Stiven              |
| RF-17 encuestas dinámicas                               | Ausente                      | No hay entidades, constructor de preguntas/formularios, publicación ni administración de encuestas.                                                                                                                                       | Eduardo             |
| RF-18 respuestas de encuestas                           | Ausente                      | No hay endpoint/UI, control de acceso configurable, validación de respuestas ni resultados.                                                                                                                                               | Eduardo             |
| RF-20 auditoría histórica                               | Ausente                      | Hay timestamps y soft delete en algunas entidades, pero no trazas de actor, acción, recurso, valores anterior/nuevo ni consulta restringida.                                                                                              | Cada uno su entidad |
| RF-21 HTTPS obligatorio                                 | Ausente en código/despliegue | Nest escucha HTTP; no hay reverse proxy/TLS, redirección, HSTS ni evidencia de certificado/configuración de producción.                                                                                                                   | Danny               |
| RF-22 Facebook: seis recientes, histórico y BD con Meta | Parcial                      | Existe endpoint y caché RSS/fallback; no usa verificablemente Meta Graph API, no persiste publicaciones ni mueve las seis iniciales al home mientras conserva histórico. El controller documenta 3 por defecto aunque el frontend pide 6. | sebas               |
| RF-23 Cloudflare proxy                                  | Ausente en repositorio       | No hay configuración DNS/proxy, origin restriction, SSL mode, reglas WAF/rate limiting ni procedimiento de despliegue.                                                                                                                    | Danny               |

### No funcionales

- Usabilidad: hay formularios reactivos y mensajes básicos, pero el enlace de recuperación es inerte, no existe ayuda global, no hay evidencia de prueba de aprendizaje/error y la accesibilidad solo es parcial; debe auditarse con WCAG 2.1 AA, teclado, lector de pantalla, contraste, foco y textos alternativos.
- Rendimiento: no hay benchmark ni criterio medido; `synchronize` está habilitado por defecto, no hay índices/cache distribuida/colas/observabilidad ni plan para 100.000 sesiones concurrentes. El requisito de tiempo <2 s debe definirse como SLA y medirse bajo carga real.
- Seguridad: bcrypt/JWT/validación existen, pero faltan autorización consistente, secretos gestionados fuera del código, rate limiting, headers seguros, CORS restringido, tokens de recuperación de un solo uso, protección de datos, migraciones, backups off-site, escaneo de dependencias y pruebas de seguridad. Licencia raíz ISC contradice la exigencia de código privado/cerrado. No hay herramienta especializada de gestión de testing, manuales ISO 9000 ni artefactos SCRUM verificables.
- Disponibilidad: no hay infraestructura, health checks, despliegue redundante, monitoreo, alertas, backup/restore probado, RTO/RPO ni evidencia para 99%, reinicio <=2 min y fallas <=15 min.

## Fases de implementación

### Fase 0: decisiones y línea base
1. Confirmar alcance de “registro”: recomendar separar cuenta de usuario de suscripción a noticias; definir si las noticias requieren cuenta o correo solamente.
2. Definir roles (`ADMIN`, `EDITOR`, `MODERATOR`, `USER`), permisos por acción, política de datos, retención, consentimiento y proveedor SMTP.
3. Definir SLA/SLO: carga objetivo, p95/p99, 100.000 sesiones, disponibilidad, RTO/RPO, ventana de campañas y qué significa “tiempo <2 s”.
4. Crear matriz de trazabilidad requisitos-casos-pruebas y backlog Scrum con criterios de aceptación.

### Fase 1: base técnica y seguridad transversal
1. Reemplazar `synchronize` por migraciones versionadas y agregar índices/constraints para email, nombre, tokens, publicaciones, suscripciones y auditoría.
2. Centralizar configuración validada por entorno; eliminar dependencias de `localhost`, restringir CORS, configurar proxy/base URL Angular y separar secretos.
3. Aplicar autorización explícita a cada mutación de publicaciones, eventos, roles, usuarios, comentarios y reacciones; separar acceso público de endpoints privados y añadir guards de ruta frontend.
4. Añadir serialización que nunca exponga contraseñas/tokens, rate limiting, Helmet, límites de payload, sanitización de contenido, CSRF/cookies o estrategia de almacenamiento JWT definida.
5. Añadir logging estructurado, correlation/request id, manejo global de errores y health/readiness checks.

### Fase 2: identidad, suscripción y correo
1. Completar RF-01 con módulo `Subscription`: email único, consentimiento, fecha, estado, token de confirmación y cancelación.
2. Completar RF-03 con token aleatorio hashado, expiración, uso único, respuesta anti-enumeración, correo transaccional y cambio real de contraseña.
3. Definir sesiones: expiración, refresh/revocación, logout y persistencia segura en Angular.
4. Crear proveedor de correo con plantillas, reintentos, cola y trazabilidad; dejar preparado el envío masivo programado de RF-12 con preferencias y cancelación.

### Fase 3: CMS y contenido institucional
1. Convertir publicaciones en CMS real: estados borrador/publicada/descartada/programada, autor/editor, edición segura, media validada, paginación y recuperación.
2. Conectar `/noticias` al API y eliminar datos demo; implementar home con seis recientes e histórico paginado.
3. Crear módulo `InstitutionalContent` para misión, visión, valores, secciones, versionado/publicación y panel admin.
4. Crear formulario de contacto con validación, antispam, persistencia, estados y notificación a administradores.
5. Crear módulo de planes/cronogramas con estados, historial de cambios, aprobación y vistas públicas/admin.

### Fase 4: Facebook/Meta
1. Sustituir RSS/fallback por Meta Graph API con Page ID/token de página almacenado como secreto, permisos revisados, timeout y manejo de rate limit.
2. Crear entidad de publicación social con `externalId` único, contenido/media/fecha/permalink, cursor o fecha de última sincronización y estado.
3. Implementar job idempotente de sincronización, persistencia histórica y deduplicación; ordenar seis recientes en home y el resto en noticias.
4. Añadir pruebas con respuestas simuladas de Meta, expiración de token, posts sin imagen y fallos de API.

### Fase 5: encuestas y auditoría
1. Crear constructor de encuestas: encuesta, versión, preguntas, opciones, tipo, reglas, publicación, fechas y acceso público/autenticado.
2. Crear respuestas con validación server-side, una respuesta por usuario cuando aplique, anonimato configurado, cierre y resultados restringidos.
3. Implementar `AuditLog` con actor, acción, recurso, id, timestamp, IP/correlation id y snapshot diff; interceptar operaciones sensibles.
4. Crear consulta/exportación admin con filtros, paginación, retención y protección contra modificación/borrado.

### Fase 6: UX, accesibilidad y ayuda
1. Completar rutas y formularios de recuperación, contacto, suscripción, encuestas y panel administrativo.
2. Crear módulo de ayuda accesible desde navbar/footer y mensajes consistentes basados en errores HTTP sin filtrar información sensible.
3. Auditar WCAG 2.1 AA: HTML semántico, labels, foco visible, teclado, contraste, `aria` solo cuando corresponda, alt/textos equivalentes y responsive.
4. Validar aprendizaje menor a dos minutos con tareas observables y registrar resultados; corregir navegación y estados vacíos/carga/error.

### Fase 7: operación, rendimiento y disponibilidad
1. Preparar despliegue reproducible con Docker/CI, reverse proxy TLS, redirección HTTPS, HSTS, certificados renovables y Cloudflare proxy/WAF/origin lock.
2. Implementar backups automáticos cada 24 h, cifrados, off-site y con prueba periódica de restauración; documentar RPO/RTO.
3. Añadir métricas, uptime/health monitoring, alertas críticas y runbooks; probar reinicio <=2 min y recuperación de fallas <=15 min.
4. Ejecutar pruebas de carga graduadas con Postman/Newman o k6/Artillery y medir p95/p99, errores, CPU/RAM/DB; optimizar caché, índices, paginación, colas y límites.
5. Definir estrategia para 100.000 sesiones: escalado horizontal, balanceador, Redis/session/token strategy, pool de conexiones y base de datos preparada; no afirmar cumplimiento sin prueba.

### Fase 8: calidad, cumplimiento y entrega
1. Añadir unitarias de servicios/guardas, integración de API y e2e de flujos RF; añadir pruebas Angular para formularios, rutas y errores.
2. Integrar herramienta de gestión de testing y enlazar casos con requisitos; automatizar CI para lint, build, tests, cobertura, dependencias y seguridad.
3. Documentar manual técnico, usuario, despliegue, backup/restore, incidentes, privacidad y tratamiento de datos; registrar proceso Scrum y definición de terminado.
4. Revisar licencia: cambiar/eliminar `ISC` solo tras decisión legal para reflejar código privado; no publicar secretos ni artefactos sensibles.
5. Ejecutar aceptación final contra la matriz, evidencia de accesibilidad, carga, restauración, seguridad, disponibilidad y revisión de cada RF.

## Archivos y superficies relevantes

- `back/src/modules/auth/auth.service.ts` y `back/src/modules/auth/auth.controller.ts`: completar recuperación, sesión y correo.
- `back/src/modules/user/user.service.ts` y entidades TypeORM: unicidad, perfil, serialización y actualización segura.
- `back/src/common/guard/jwt-auth.guard.ts`, `back/src/common/guard/roles.guard.ts`, decoradores y controllers: autorización consistente.
- `back/src/modules/publication/*`, `event/*`, `rol/*`: CMS, cronogramas y protección de mutaciones.
- `back/src/modules/facebook/facebook.service.ts` y `facebook.controller.ts`: reemplazo de RSS/fallback por Meta + persistencia.
- `back/src/database/database.module.ts`, `.env.example`, `back/src/main.ts`: migraciones, configuración, headers, CORS, health y observabilidad.
- `front/src/app/app.routes.ts`, `front/src/app/auth/*`, `front/src/app/notice/*`, `front/src/app/home/*`, `front/src/app/about/*`: integración API, guards, contenido institucional, noticias y UX.
- `package.json`, `back/package.json`, `README.md`, `TEC.md` y nueva documentación operativa: scripts, CI, pruebas, licencia y manuales.

## Verificación

1. Crear una suite de trazabilidad que marque cada requisito con endpoint, pantalla, caso de prueba y evidencia de despliegue.
2. Ejecutar build/lint/unitarias/e2e de backend y frontend en CI; verificar especialmente registro, login, reset, permisos, CMS, suscripción, contacto, encuestas, auditoría y Facebook.
3. Probar seguridad: acceso anónimo/rol incorrecto, enumeración de usuarios, tokens expirados/reutilizados, inyección/XSS, rate limits, CORS, secretos y exposición de PII.
4. Probar accesibilidad con axe/Lighthouse y teclado/lector de pantalla; comprobar textos de error y ayuda desde todas las secciones.
5. Ejecutar carga escalonada y documentar p95/p99, throughput, errores, CPU/RAM, DB, caché y consumo de disco; repetir con sesiones distribuidas.
6. Restaurar un backup en entorno aislado y medir RPO/RTO; simular caída de API/DB/Meta/SMTP y comprobar alertas y recuperación.
7. Validar HTTPS/Cloudflare en producción con redirección, HSTS, certificado, origin protegido y restricciones de administración.

## Decisiones y límites

- Se considera “parcial” cualquier función cuyo backend exista pero carezca de integración de UI, autorización, persistencia completa o pruebas.
- Los requisitos de 100.000 sesiones, 99% de disponibilidad, Cloudflare, HTTPS, backups físicos y alertas no se pueden demostrar solo leyendo el código: requieren infraestructura y evidencia de ejecución.
- El plan no incluye rediseño visual ni migración de proveedor de base de datos salvo lo necesario para cumplir operación, seguridad y rendimiento.
- Recomendación: separar suscripción a noticias de la cuenta de usuario y usar Meta Graph API oficial en vez del RSS de terceros.
