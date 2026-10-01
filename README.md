<p align="center">
  <a href="https://liberocobre.online">
    <img src="/public/images/logo.png">
  </a>
</p>

<p align="center">
  <a href="https://liberocobre.online">
    <img src="https://capsule-render.vercel.app/api?type=pulse&height=300&color=gradient&text=Libero%20Web&section=header&fontColor=E3A610">
  </a>
</p>

<p align="center">
    <a href="https://github.com/Libero-Web-Proyecto-III/Libero-Web">
        <img src="https://img.shields.io/badge/Github-Repository-F59827?style=for-the-badge&logo=github">
        <img src="https://img.shields.io/badge/Versi%C3%B3n-BETA_0.1-F5C827?style=for-the-badge&logo=github">
        <img src="https://img.shields.io/github/stars/Libero-Web-Proyecto-III/Libero-Web?color=yellow&style=for-the-badge" alt="stars"/>
        <img src="https://img.shields.io/github/forks/Libero-Web-Proyecto-III/Libero-Web?color=blue&style=for-the-badge" alt="forks"/>
    </a>
    <a href="https://github.com/Libero-Web-Proyecto-III/Libero-Web/commits/master">
        <img src="https://img.shields.io/github/commit-activity/w/Libero-Web-Proyecto-III/Libero-Web?color=purple&style=for-the-badge" alt="commits">
    </a>
</p>

## Tech Stack

- **Frontend:** Angular 21, TypeScript, SCSS
- **Backend / API:** NestJS, Node.js, JWT, Swagger
- **Base de Datos / Almacenamiento:** MySQL

## Guía de Instalación y Configuración Local

Sigue estos pasos para clonar y levantar el proyecto en tu entorno local:

```bash
# 1. Clonar el repositorio
git clone https://github.com/Libero-Web-Proyecto-III/Libero-Web.git

# 2. Entrar a la carpeta del proyecto
cd Libero-Web

# 3. Instalar dependencias del monorepo
npm install

# 4. Instalar dependencias de frontend y backend
cd front && npm install
cd ../back && npm install

# 5. Configurar variables de entorno
# Copia el archivo de ejemplo y completa los valores requeridos
# Ajusta los archivos .env según el entorno local

# 6. Ejecutar en modo desarrollo
cd ../front && npm start
# En otra terminal
cd ../back && npm run start:dev
```

### Variables de Entorno (`.env`)

- `PORT`: Puerto de ejecución del backend.
- `DB_HOST`: Host de la base de datos.
- `DB_PORT`: Puerto de la base de datos.
- `DB_USERNAME`: Usuario de la base de datos.
- `DB_PASSWORD`: Contraseña de la base de datos.
- `DB_NAME`: Nombre de la base de datos.
- `JWT_SECRET`: Clave secreta para autenticación.
- `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`: Configuración de correo para notificaciones.

## Estructura del Proyecto

```plaintext
📦 Libero-Web/
 ┣ 📂 back/                     # API con NestJS
 ┃ ┣ 📂 src/                   # Módulos, controladores y servicios
 ┃ ┣ 📂 scripts/               # Scripts auxiliares
 ┃ ┣ 📜 package.json            # Dependencias del backend
 ┃ ┗ 📜 tsconfig.json           # Configuración de TypeScript
 ┣ 📂 front/                    # Aplicación Angular
 ┃ ┣ 📂 src/                   # Componentes, rutas y estilos
 ┃ ┣ 📂 public/                # Recursos estáticos
 ┃ ┣ 📜 angular.json           # Configuración del proyecto Angular
 ┃ ┗ 📜 package.json            # Dependencias del frontend
 ┣ 📂 public/                  # Recursos compartidos del sitio
 ┣ 📜 README.md                # Documentación del proyecto
 ┣ 📜 REQ.md                   # Requerimientos del sistema
 ┣ 📜 TEC.md                  # Documentación técnica
 ┣ 📜 package.json             # Workspaces y configuración global
 ┗ 📜 .gitignore               # Archivos ignorados por Git
```

## Desarrollado por

<table align="center">
  <tr>
    <td align="center" width="150">
      <a href="https://github.com/yuta578">
        <img src="https://github.com/yuta578.png" width="75px"><br>
        <b>yuta578</b>
      </a>
    </td>
    <td align="center" width="150">
      <a href="https://github.com/StivenOrt">
        <img src="https://github.com/StivenOrt.png" width="75px"><br>
        <b>StivenOrt</b>
      </a>
    </td>
    <td align="center" width="150">
      <a href="https://github.com/Eduardo342-Git">
        <img src="https://github.com/Eduardo342-Git.png" width="75px"><br>
        <b>Eduardo342-Git</b>
      </a>
    </td>
    <td align="center" width="150">
      <a href="https://github.com/Moncka20">
        <img src="https://github.com/Moncka20.png" width="75px"><br>
        <b>Moncka20</b>
      </a>
    </td>
    <td align="center" width="150">
      <a href="https://github.com/D4N-1">
        <img src="https://github.com/D4N-1.png" width="75px"><br>
        <b>D4N-1</b>
      </a>
    </td>
  </tr>
</table>
