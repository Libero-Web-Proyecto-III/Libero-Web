# Pruebas unitarias del frontend

Las nuevas pruebas están organizadas en `front/test/unitarias`, siguiendo la separación mostrada para las pruebas unitarias. Todas usan Angular Testing Utilities y Vitest, y no necesitan un backend real porque las dependencias externas se simulan o se interceptan con `HttpTestingController`.

## 1. Guard de autenticación

**Archivo:** `front/test/unitarias/th.auth-guard.spec.ts`

**Qué hace:** Comprueba los dos caminos del `authGuard`: permite la navegación cuando `AuthService.isLoggedIn()` devuelve `true` y crea una redirección a `/auth/login` cuando devuelve `false`.

**Para qué funciona:** Protege las rutas privadas del frontend y conserva el flujo de acceso para usuarios no autenticados.

**Errores que previene:**

- Mostrar vistas privadas a visitantes sin sesión.
- Dejar una navegación bloqueada sin una URL de destino.
- Cambiar accidentalmente la ruta de inicio de sesión sin actualizar el guard.

**Ejecutar individualmente:**

```bash
cd front
npx ng test --no-watch --no-progress --include ../test/unitarias/th.auth-guard.spec.ts
```

**Captura del resultado:**

<!-- Espacio para captura -->

## 2. Mapeo de comentarios para la vista

**Archivo:** `front/test/unitarias/th.comment-service.spec.ts`

**Qué hace:** Comprueba que `CommentService` transforme la respuesta del backend en el modelo usado por la interfaz, normalizando el rol, las etiquetas, la fecha y los contadores iniciales.

**Para qué funciona:** Aísla el formato de datos de la API del formato que necesitan los componentes visuales de noticias.

**Errores que previene:**

- Mostrar roles o etiquetas con espacios y mayúsculas inconsistentes.
- Renderizar fechas como texto sin convertirlas a `Date`.
- Intentar leer contadores o reacciones inexistentes al cargar un comentario.
- Consultar comentarios sin enviar el UUID de la publicación y el límite esperado.

**Ejecutar individualmente:**

```bash
cd front
npx ng test --no-watch --no-progress --include ../test/unitarias/th.comment-service.spec.ts
```

**Captura del resultado:**

<!-- Espacio para captura -->

