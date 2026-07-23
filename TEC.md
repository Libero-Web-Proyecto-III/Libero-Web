# Libero Web - Documento Tecnico

Guia tecnica orientativa para el desarrollo del proyecto colaborativo

## 1. Reglas Generales

Condiciones para todas las divisiones

- Todas las variables, clases y modulos deben ser declaradas en **inglés y singular**

<aside>

user - role - login - publication

</aside>

- Las variables, funciones y clases deben estar en **PascalCase**

```jsx
const TimeNow = Date.now() - class UserModule { } - function UserSeeder () { } 
```

- Los nombres de carpetas, archivos, tablas de base de datos y atributos de objetos deben estar en **camelCase**

```jsx
src/user/userLogin.dto.ts - @Entity('authLogin') - const User = { lastName: 'Libero' }
```

- La **arquitectura** base del backend es:

<aside>

src/
├── common/   # Carpetas y archivos en común para todo el proyecto
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   └── interceptors/
├── config/  # Configuraciones
├── database/  # Conexión de base de datos
├── modules/  # Logica de negocio
│   ├── auth/
│   │    ├── dto/
│   │    │      └── auth.dto.ts
│   │    ├── entity/
│   │    │        └── auth.entity.ts
│   │    ├── auth.module.ts
│   │    ├── auth.controller.ts
│   │    └── auth.service.ts
│   ├── comment/
│   ├── event/
│   ├── publication/
│   ├── reaction/
│   ├── role/
│   ├── tag/
│   └── user/
├── app.module.ts            # Módulo raíz
└── main.ts                  # Punto de entrada de la aplicación

</aside>

<aside>

modules/module-name/
├── dto/                     # Data Transfer Objects (Request/Response)
│   ├── create-module.dto.ts
│   └── update-module.dto.ts
├── entities/                # Entidades del ORM / Modelos de BD
│   └── module.entity.ts
├── module.controller.ts             # Manejo de rutas y HTTP Requests
├── module.service.ts               # Lógica de negocio
└── module.module.ts         # Definición del módulo

</aside>

---

## 2. Commits

- Los mensajes de los commits estarán en **Español**
- Al inicio de cada mensaje escribir la acción realizada
    - **`new:`** Nuevos archivos o codigo base aun sin acoplarse o ser usado por el proyecto
    - **`feat**:` Una nueva característica para el usuario.
    - **`fix**:` Arregla un bug que afecta al usuario.
    - **`perf**:` Cambios que mejoran el rendimiento/segurida del sitio.
    - **`docs**:` Cambios en la documentación.
    - **`refactor**:` Refactorización del código como cambios de nombre de variables o funciones.
    - **`remove:`** Elimina archivos.

---

## 3. Reglas Específicas por Módulo

### 3.1. Módulo `Role`

**Descripción:** Define los roles y niveles de acceso dentro de la plataforma (ej. `ADMIN`, `USER`, `MODERATOR`).

- **Reglas de Diseño:**
    - Los roles principales deben manejarse mediante una columna `Enum` bien definida para evitar cadenas mágicas.
    - No permitir la eliminación física de roles asignados a usuarios activos (usar borrado lógico o restricciones de clave foránea).
    
- **Endpoints Clave:**
    - `GET /roles` — Listar roles (restringido a administradores).
    - `GET /roles/:id` — Detalle del rol.
    

### 3.2. Módulo `Tag`

**Descripción:** Gestión de etiquetas para categorizar autores en publicaciones.

- **Reglas de Diseño:**
    - Las etiquetas deben ser únicas mediante ID o similar.
    - Evitar que crear una etiqueta con el mismo texto que otra ya existente.
    
- **Endpoints Clave:**
    - `GET /tags` — Listado de etiquetas con filtro opcional de búsqueda.
    - `POST /tags` — Creación de etiqueta.

### 3.3. Módulo `User`

**Descripción:** Administración de perfiles de usuario, datos personales y estado de la cuenta.

- **Reglas de Diseño:**
    - La contraseña nunca debe retornarse en las respuestas HTTP (usar `@Exclude()` o seleccionar campos explícitamente).
    - Validar unicidad de `email` y `username` mediante DTOs y restricciones a nivel de base de datos.

- **Endpoints Clave:**
    - `GET /users/me` — Obtener perfil del usuario autenticado.
    - `PATCH /users/me` — Actualizar información de perfil.
    - `GET /users/:id` — Perfil público de un usuario.

- **Entidad:**
    
    `name` — Nombre único dado por el usuario
    `email` — Correo asociado
    `password` — Constraseña del usuario
    `avatar` — Ruta de la imagen perfil del usuario
    `role` — Rol asociado
    `tag` — Etiqueta asociada
    

### 3.4. Módulo `Auth`

**Descripción:** Autenticación, emisión de JWT, refresco de tokens y control de sesiones.

- **Reglas de Diseño:**
    - Hashing obligatorio de contraseñas utilizando `bcrypt` con salt rounds apropiados.
    - Manejo de `AccessToken` con JWT o similar.
    - Uso de Guards globales o decoradores como `@UseGuards(JwtAuthGuard)` y `@Roles(...)`.
    
- **Endpoints Clave:**
    - `POST /auth/register` — Registro de nuevo usuario.
    - `POST /auth/login` — Autenticación y retorno de tokens.
    

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

- **Entidad**
    
    `author` — Usuario que creó la publicacion (restringido a moderador y admin)
    `title` — Titulo de la publicacion
    `media` — Posible media adjunta, como links, imagenes y videos
    `content` — Descripcion o contenido de la publicacion con texto
    `createdAt` — Fecha de la creacion
    `updatedAt` — Fecha de la última edición
    `comments` — Relacion a Comentarios
    `reactions` — Relacion a Reacciones
    

### 3.6. Módulo `Event`

**Descripción:** Creación y seguimiento de eventos comunitarios o laborales.

- **Reglas de Diseño:**
    - Validación de fechas: `startDate` debe ser anterior a `endDate` y posterior a la fecha actual en la creación.
    - Posibilidad de filtrar eventos por estado (próximos, en curso, finalizados).

- **Endpoints Clave:**
    - `GET /events` — Listar eventos con filtros por fecha/tag.
    - `POST /events` — Crear un nuevo evento.

### 3.7. Módulo `Reaction`

**Descripción:** Sistema de interacciones (me gusta / me disgusta) sobre publicaciones.

- **Reglas de Diseño:**
    - Un usuario solo puede tener una reacción activa por elemento objetivo (evitar duplicados usando restricción única `[userId, targetId, targetType]`).
    - Si un usuario envía la misma reacción, se remueve (toggle). Si envía una diferente, se actualiza el tipo.
- **Endpoints Clave:**
    - `POST /reactions` — Agregar o alternar reacción (toggle).
    - `DELETE /reactions/:id` — Eliminar reacción.

### 3.8. Módulo `Comment`

**Descripción:** Retroalimentación y debate en publicaciones o eventos.

- **Reglas de Diseño:**
    - Creado a partir de una publicacion existente
    
- **Endpoints Clave:**
    - `GET /publications/:id/comments` — Obtener árbol/lista de comentarios.
    - `POST /publications/:id/comments` — Comentar en una publicación.
    - `DELETE /comments/:id` — Eliminar o desactivar un comentario.