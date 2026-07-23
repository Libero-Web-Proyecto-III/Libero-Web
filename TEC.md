# Libero Web — Documento Técnico

> **Guía técnica orientativa y estándares de desarrollo para el proyecto colaborativo**

---

## 📋 1. Reglas Generales

A continuación se especifican las convenciones de nomenclatura, idioma y la arquitectura base obligatorias para todo el proyecto.

### 🔤 Idioma y Convenciones de Nombres

1. **Inglés y Singular:** Todas las variables, funciones, clases, entidades y nombres de archivos/módulos deben ser definidos en **inglés y en singular**.
   > [!TIP]
   > **Ejemplos permitidos:** `user`, `role`, `publication`, `comment`.  
   > **No permitidos:** `usuarios`, `roles`, `publications`.

2. **Tipos de Casing por Elemento:**

| Elemento | Convención | Ejemplo |
| :--- | :--- | :--- |
| **Clases / Módulos / Interfaces / Enums** | `PascalCase` | `UserModule`, `AuthService`, `RoleEnum` |
| **Variables / Funciones / Métodos** | `PascalCase` | `TimeNow`, `UserSeeder()` |
| **Carpetas / Archivos DTO / Controller** | `camelCase` / `kebab-case` | `userLogin.dto.ts`, `auth.controller.ts` |
| **Atributos de Entidad / Tablas de BD** | `camelCase` | `@Entity('authLogin')`, `lastName` |

---

### 🏗️ Arquitectura Base del Backend

Seguimos una **arquitectura modular orientada a dominio (Feature Modules)**.

#### Estructura General del Proyecto (`src/`)

```text
src/
├── common/             # Elementos globales/compartidos
│   ├── decorators/     # Decoradores personalizados
│   ├── filters/        # Filtros de excepciones HTTP
│   ├── guards/         # Guardias de autorización/autenticación
│   └── interceptors/   # Interceptores de respuesta/transformación
├── config/             # Configuraciones de entorno
├── database/           # Conexión de base de datos, migraciones y seeders
├── modules/            # Lógica de negocio (Módulos independientes)
│   ├── auth/
│   │   ├── dto/
│   │   │   └── auth.dto.ts
│   │   ├── entity/
│   │   │   └── auth.entity.ts
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   └── auth.service.ts
│   ├── comment/
│   ├── event/
│   ├── publication/
│   ├── reaction/
│   ├── role/
│   ├── tag/
│   └── user/
├── app.module.ts       # Módulo raíz de la aplicación
└── main.ts             # Punto de entrada de la aplicación
```

#### Estructura Interna de cada Módulo (`modules/module-name/`)

```text
modules/module-name/
├── dto/
│   ├── create-module.dto.ts
│   └── update-module.dto.ts
├── entities/
│   └── module.entity.ts
├── module.controller.ts
├── module.service.ts
└── module.module.ts
```

---

## 🔀 2. Convención de Commits

Todos los mensajes de commit deben redactarse en **Español** y comenzar obligatoriamente con una de las siguientes etiquetas en minúscula:

| Etiqueta | Propósito / Uso | Ejemplo de Mensaje |
| :--- | :--- | :--- |
| **`new:`** | Archivos nuevos o código base inicial aún no integrado al flujo. | `new: estructura inicial del modulo de eventos` |
| **`feat:`** | Una nueva característica para el usuario. | `feat: agregar endpoint para registro de usuarios` |
| **`fix:`** | Arregla un bug que afecta al usuario. | `fix: corregir validacion en hash de contrasena` |
| **`perf:`** | Cambios que mejoran el rendimiento o seguridad del sitio. | `perf: agregar indices a la tabla de publicaciones` |
| **`docs:`** | Cambios en la documentación. | `docs: actualizar readme con reglas de commits` |
| **`refactor:`** | Refactorización del código (cambios de nombre de variables o funciones). | `refactor: cambiar nombre de dto en auth` |
| **`remove:`** | Elimina archivos o código obsoleto. | `remove: eliminar archivo de prueba no utilizado` |

---

## 📦 3. Reglas Específicas por Módulo

---

### 3.1. Módulo `Role`

**Descripción:** Define los roles y niveles de acceso dentro de la plataforma (ej. `ADMIN`, `USER`, `MODERATOR`).

- **Reglas de Diseño:**
  - Los roles principales deben manejarse mediante una columna `Enum` bien definida para evitar cadenas mágicas.
  - No permitir la eliminación física de roles asignados a usuarios activos (usar borrado lógico o restricciones de clave foránea).

- **Endpoints Clave:**
  - `GET /roles` — Listar roles (restringido a administradores).
  - `GET /roles/:id` — Detalle del rol.

---

### 3.2. Módulo `Tag`

**Descripción:** Gestión de etiquetas para categorizar autores en publicaciones.

- **Reglas de Diseño:**
  - Las etiquetas deben ser únicas mediante ID o similar.
  - Evitar crear una etiqueta con el mismo texto que otra ya existente.

- **Endpoints Clave:**
  - `GET /tags` — Listado de etiquetas con filtro opcional de búsqueda.
  - `POST /tags` — Creación de etiqueta.

---

### 3.3. Módulo `User`

**Descripción:** Administración de perfiles de usuario, datos personales y estado de la cuenta.

- **Reglas de Diseño:**
  - La contraseña **nunca** debe retornarse en las respuestas HTTP (usar `@Exclude()` o seleccionar campos explícitamente).
  - Validar unicidad de `email` y `name` (username) mediante DTOs y restricciones a nivel de base de datos.

- **Endpoints Clave:**
  - `GET /users/me` — Obtener perfil del usuario autenticado.
  - `PATCH /users/me` — Actualizar información de perfil.
  - `GET /users/:id` — Perfil público de un usuario.

- **Entidad (`User`):**
  - `name` — Nombre único dado por el usuario.
  - `email` — Correo asociado.
  - `password` — Contraseña del usuario.
  - `avatar` — Ruta de la imagen de perfil del usuario.
  - `role` — Rol asociado.
  - `tag` — Etiqueta asociada.

---

### 3.4. Módulo `Auth`

**Descripción:** Autenticación, emisión de JWT, refresco de tokens y control de sesiones.

- **Reglas de Diseño:**
  - Hashing obligatorio de contraseñas utilizando `bcrypt` con salt rounds apropiados.
  - Manejo de `AccessToken` con JWT o similar.
  - Uso de Guards globales o decoradores como `@UseGuards(JwtAuthGuard)` y `@Roles(...)`.

- **Endpoints Clave:**
  - `POST /auth/register` — Registro de nuevo usuario.
  - `POST /auth/login` — Autenticación y retorno de tokens.

---

### 3.5. Módulo `Publication`

**Descripción:** Manejo del contenido principal (posts/publicaciones creadas por los usuarios).

- **Reglas de Diseño:**
  - Soporte para paginación obligatoria (`page`, `limit`) en listados.
  - Cada publicación está asociada a un `User` (autor).
  - Incluir campos de auditoría: `createdAt`, `updatedAt`, `deletedAt` (Soft Delete).

- **Endpoints Clave:**
  - `GET /publications` — Listado paginado de publicaciones.
  - `POST /publications` — Crear una publicación.
  - `GET /publications/:id` — Ver detalle de publicación.
  - `PATCH /publications/:id` — Modificar publicación (solo moderador o admin).
  - `DELETE /publications/:id` — Eliminar publicación.

- **Entidad (`Publication`):**
  - `author` — Usuario que creó la publicación (restringido a moderador y admin).
  - `title` — Título de la publicación.
  - `media` — Posible media adjunta, como links, imágenes y videos.
  - `content` — Descripción o contenido de la publicación con texto.
  - `createdAt` — Fecha de la creación.
  - `updatedAt` — Fecha de la última edición.
  - `comments` — Relación a Comentarios.
  - `reactions` — Relación a Reacciones.

---

### 3.6. Módulo `Event`

**Descripción:** Creación y seguimiento de eventos comunitarios o laborales.

- **Reglas de Diseño:**
  - Validación de fechas: `startDate` debe ser anterior a `endDate` y posterior a la fecha actual en la creación.
  - Posibilidad de filtrar eventos por estado (próximos, en curso, finalizados).

- **Endpoints Clave:**
  - `GET /events` — Listar eventos con filtros por fecha/tag.
  - `POST /events` — Crear un nuevo evento.

---

### 3.7. Módulo `Reaction`

**Descripción:** Sistema de interacciones (me gusta / me disgusta) sobre publicaciones.

- **Reglas de Diseño:**
  - Un usuario solo puede tener una reacción activa por elemento objetivo (evitar duplicados usando restricción única `[userId, targetId, targetType]`).
  - Si un usuario envía la misma reacción, se remueve (toggle). Si envía una diferente, se actualiza el tipo.

- **Endpoints Clave:**
  - `POST /reactions` — Agregar o alternar reacción (toggle).
  - `DELETE /reactions/:id` — Eliminar reacción.

---

### 3.8. Módulo `Comment`

**Descripción:** Retroalimentación y debate en publicaciones o eventos.

- **Reglas de Diseño:**
  - Creado a partir de una publicación existente.

- **Endpoints Clave:**
  - `GET /publications/:id/comments` — Obtener árbol/lista de comentarios.
  - `POST /publications/:id/comments` — Comentar en una publicación.
  - `DELETE /comments/:id` — Eliminar o desactivar un comentario.
