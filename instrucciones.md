# SIGMEI — Plataforma de Soporte Técnico

SIGMEI es una plataforma que centraliza y agiliza las tareas de soporte técnico: gestión de equipos, incidencias, mantenimientos, chat en tiempo real entre usuario y técnico, y **soporte remoto** (control de escritorio) mediante integración con **MeshCentral**.

---

## 📐 Arquitectura general

El proyecto se compone de **tres servicios independientes**, cada uno corriendo en su propio proceso:

| Servicio | Tecnología | Puerto por defecto |
|---|---|---|
| **Backend** | Node.js + Express + MySQL + Socket.io | `3000` |
| **Frontend** | React + Vite | `5173` |
| **MeshCentral** | Servidor de soporte remoto (externo, no forma parte del repo) | `4430` (HTTPS) / `8080` (redirección HTTP) |

```
┌─────────────┐        ┌─────────────┐        ┌──────────────┐
│  Frontend   │ ──────▶│   Backend   │ ──────▶│  MeshCentral │
│  (React)    │  HTTP  │  (Express)  │  WS +  │  (servidor   │
│  Vite       │  WS    │  + MySQL    │  CLI   │  externo)    │
└─────────────┘        └─────────────┘        └──────────────┘
```

- El **frontend** nunca habla directamente con MeshCentral. Todo pasa por el backend.
- El **backend** actúa como intermediario: guarda en su base de datos qué `nodeid` de MeshCentral corresponde a cada equipo (identificado por su `serial`), y genera links de sesión remota bajo demanda usando la Control API / `meshctrl` de MeshCentral.
- **MeshCentral se instala y corre por separado**, fuera de este repositorio (ver sección correspondiente).

---

## 📁 Estructura del proyecto

```
SIGMEI/
├── migrate.js                     # Script de migraciones de base de datos
├── package.json                   # Dependencias del backend (raíz = backend)
├── .env                            # Variables de entorno del backend
├── src/
│   ├── backend/
│   │   ├── server.js               # Punto de entrada (HTTP + Socket.io)
│   │   ├── app.js                  # Configuración de Express y rutas
│   │   ├── config/                 # Configuración de BD, Swagger, etc.
│   │   ├── controllers/            # Lógica de cada recurso
│   │   ├── routes/                 # Definición de endpoints
│   │   ├── services/                # Lógica de negocio y servicios externos (MeshCentral, auditoría, etc.)
│   │   ├── middlewares/            # Auth, validación, manejo de errores
│   │   ├── models/                 # Acceso a datos
│   │   └── validators/             # Validación de payloads
│   └── frontend/
│       ├── package.json            # Dependencias del frontend
│       ├── .env                     # Variables de entorno del frontend (VITE_*)
│       ├── vite.config.js
│       └── src/
│           ├── pages/               # Vistas (Dashboard, Soporte Remoto, etc.)
│           ├── components/
│           ├── context/             # AuthContext, SocketContext
│           └── services/            # Cliente axios (api.js)
```

---

## 🗄️ Base de datos (MySQL)

Tablas principales:

- **usuarios** — cuentas de la plataforma. `rol_id`: `1` = Admin, `2` = Técnico, `3` = Usuario.
- **equipos** — un equipo por usuario, identificado por un `serial` único autogenerado (ej. `pcjuanito1294`). Incluye la columna **`mesh_nodeid`**, que guarda el identificador interno de MeshCentral una vez el equipo queda vinculado.
- **incidencias** — tickets de soporte.
- **mensajes_incidencias** — chat asociado a cada incidencia.
- Tablas adicionales: `mantenimientos`, `alertas`, `auditoria`, etc.

### Migraciones

Las migraciones viven en `migrate.js` (en la raíz) y son idempotentes (se pueden correr varias veces sin romper nada — verifican si la columna/tabla ya existe antes de crearla).

```bash
node migrate.js
```

Además de crear/actualizar columnas y tablas, este script **auto-asigna un equipo con serial único** a cualquier usuario que no tenga uno.

---

## 🔑 Autenticación y roles

- JWT (`jsonwebtoken`), guardado en `localStorage` en el frontend y enviado como `Authorization: Bearer <token>`.
- Middleware `verificarToken` decodifica el token y adjunta `req.usuario = { id, correo, rol_id }`.
- Middleware `verificarRol(...roles)` (factory con rest parameters) restringe endpoints por rol: ej. `verificarRol(1, 2)` permite Admin y Técnico.

---

## 🌐 Endpoints principales de la API

Todas las rutas cuelgan de `/api`:

| Ruta | Descripción |
|---|---|
| `/api/auth` | Registro y login |
| `/api/usuarios` | CRUD de usuarios (Admin) |
| `/api/equipos` | CRUD de equipos, sincronización de hardware local |
| `/api/incidencias` | Tickets de soporte |
| `/api/mensajes` | Chat de incidencias |
| `/api/mantenimientos` | Registro de mantenimientos |
| `/api/dashboard` | Métricas resumidas |
| `/api/auditoria` | Log de acciones |
| `/api/agentes` | Agente propio de monitoreo (heartbeat, inventario de hardware) — **no relacionado con MeshCentral** |
| `/api/hardware-local` | Lectura de sensores vía LibreHardwareMonitor |
| `/api/soporte` | **Integración con MeshCentral (soporte remoto)** — ver detalle abajo |

### `/api/soporte` — Soporte remoto (MeshCentral)

| Método | Ruta | Rol requerido | Descripción |
|---|---|---|---|
| `GET` | `/api/soporte/nodos-disponibles` | Admin, Técnico | Lista dispositivos de MeshCentral que aún no están vinculados a ningún equipo |
| `POST` | `/api/soporte/vincular` | Admin, Técnico | Vincula manualmente un `nodeid` a un `serial` (`{ serial, nodeid }`) |
| `POST` | `/api/soporte/auto-vincular` | Cualquier usuario autenticado | El propio usuario vincula automáticamente su PC. Si hay ambigüedad (varios dispositivos nuevos), devuelve `opciones` para elegir |
| `POST` | `/api/soporte/vincular-seleccion` | Cualquier usuario autenticado | Segundo paso si `auto-vincular` devolvió varias opciones (`{ nodeid }`) |
| `GET` | `/api/soporte/conectar/:serial` | Admin, Técnico | Genera un link de sesión de escritorio remoto temporal para el equipo con ese `serial`, y lo devuelve como `{ url }` |

---

## 🔌 Tiempo real (Socket.io)

El servidor Socket.io vive dentro de `server.js`, montado sobre el mismo servidor HTTP que Express.

Eventos principales:
- `join_room` — el cliente se une a la sala `tecnicos` (roles 1/2) o `user_<id>` (rol 3)
- `solicitar_soporte` / `nueva_incidencia` — notificaciones en tiempo real a los técnicos
- `enviar_mensaje` / `nuevo_mensaje` — chat en vivo, persistido en `mensajes_incidencias`
- `abrir_chat_tecnico` / `abrir_chat_usuario` — apertura sincronizada del modal de chat entre ambas partes

---

## 🖥️ MeshCentral — instalación (fuera del repo)

MeshCentral **no forma parte de este repositorio**: es un servidor externo que se instala aparte y corre como un proceso independiente.

### Instalación

```bash
mkdir meshcentral-server
cd meshcentral-server
npm install meshcentral
node node_modules\meshcentral
```

En Windows, la primera ejecución instala módulos nativos adicionales (`node-windows`, `loadavg-windows`) y puede pedir reiniciar el proceso una o dos veces — simplemente vuelve a correr el mismo comando hasta que quede arriba.

### Configuración (`meshcentral-data/config.json`)

```json
{
  "settings": {
    "cert": "localhost",
    "port": 4430,
    "redirPort": 8080,
    "allowFraming": true,
    "allowLoginToken": true
  },
  "domains": {
    "": {
      "title": "SIGMEI",
      "title2": "Soporte Remoto",
      "newAccounts": true
    }
  }
}
```

- **`allowFraming: true`** es obligatorio — sin esto, el navegador bloquea la carga de MeshCentral dentro del `<iframe>` de la plataforma (`X-Frame-Options`).
- Si el puerto `443`/`4430` ya está en uso por otro servicio local (ej. XAMPP), ajusta `port` a uno libre.

### Primer usuario = administrador

La primera cuenta que se registre en `https://localhost:4430` queda automáticamente como **site administrator** de MeshCentral. Se recomienda usar una identidad de proyecto (ej. `admin@sigmei.local`), no un correo personal — es una cuenta técnica de infraestructura.

### Token de acceso para el backend

Desde **Mi cuenta → Login Tokens** en el dashboard de MeshCentral, se genera un usuario/contraseña de token (ej. nombrado `sigmei-backend`) que el backend usa para autenticarse contra la Control API sin depender de la contraseña real del administrador.

### Cómo el backend habla con MeshCentral

`src/backend/services/meshCentralService.js` expone dos funciones:

- **`listNodes()`** — se conecta por WebSocket a `wss://<host-meshcentral>/control.ashx` (Control API) y pide la acción `nodes`, devolviendo la lista aplanada de dispositivos conectados.
- **`generateShareLink(nodeid, guestName, durationMin)`** — invoca `meshctrl.js` (incluido en el paquete `meshcentral`) como proceso hijo (`child_process.execFile`) con la acción `DeviceSharing --add`, y parsea la URL de sesión temporal desde su salida.

Ambas usan las credenciales del login token, configuradas como constantes en el propio archivo (recomendado moverlas a variables de entorno antes de subir a un repositorio público).

---

## ⚙️ Variables de entorno

### Backend (`.env` en la raíz)

```env
PORT=3000

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=sigmei

JWT_SECRET=<clave-secreta-larga>
JWT_EXPIRES_IN=24h

MESHCENTRAL_URL=wss://localhost:4430
MESHCENTRAL_USER=<usuario-del-login-token>
MESHCENTRAL_PASS=<password-del-login-token>
```

### Frontend (`src/frontend/.env`)

```env
VITE_API_URL=http://localhost:3000/api
```

> ⚠️ No uses caracteres `$` dentro de valores en archivos `.env` sin comillas — herramientas como `dotenv-expand` los interpretan como referencias a otras variables de entorno y pueden truncar el valor silenciosamente.

---

## 🚀 Cómo encender el proyecto (desarrollo local)

Se necesitan **tres terminales abiertas simultáneamente**, cada una en su propio proceso:

**Terminal 1 — MeshCentral**
```bash
cd <ruta-a-meshcentral>\meshcentral-server
node node_modules\meshcentral
```

**Terminal 2 — Backend**
```bash
cd SIGMEI
npm install          # solo la primera vez, o tras actualizar dependencias
node migrate.js       # aplica migraciones pendientes
npm run dev           # o: node src/backend/server.js
```

**Terminal 3 — Frontend**
```bash
cd SIGMEI\src\frontend
npm install           # solo la primera vez
npm run dev
```

El orden recomendado es: MeshCentral → Backend → Frontend, aunque en desarrollo el orden exacto no suele romper nada mientras las tres terminen arriba antes de usar la plataforma.

---

## 🌍 Pruebas con acceso externo (ngrok)

Para que una persona fuera de la red local pruebe la plataforma (por ejemplo, simulando ser un usuario que solicita soporte), se exponen los tres servicios con ngrok:

```yaml
# ngrok.yml
version: "2"
authtoken: <tu-token-de-ngrok>
tunnels:
  frontend:
    addr: 5173
    proto: http
  backend:
    addr: 3000
    proto: http
  meshcentral:
    addr: https://localhost:4430
    proto: http
```

```bash
ngrok start --all --config ngrok.yml
```

Ajustes necesarios para que funcione correctamente:

1. **`vite.config.js`** — permitir el host de ngrok:
   ```js
   server: {
     allowedHosts: ['.ngrok-free.app']
   }
   ```
2. **`src/frontend/.env`** — apuntar `VITE_API_URL` a la URL pública del backend (`https://<subdominio>.ngrok-free.app/api`)
3. **`meshCentralService.js`** — apuntar `MESH_URL` al dominio público de MeshCentral vía ngrok
4. **Header `ngrok-skip-browser-warning: true`** — necesario tanto en la instancia de axios (`api.js`) como en la configuración de `socket.io-client` (`extraHeaders`), porque el plan gratuito de ngrok inserta una página de advertencia intermedia que de otro modo rompe las peticiones con errores de CORS falsos-positivos.

> Nota: con el plan gratuito de ngrok, el dominio cambia cada vez que se reinicia el túnel — hay que actualizar las URLs correspondientes cada vez.

---

## 🔗 Flujo completo de una sesión de soporte remoto

1. El usuario instala el **agente de MeshCentral** en su equipo (instalador genérico, mismo para todos).
2. Desde su sesión en SIGMEI, el usuario pulsa **"Vincular este PC para soporte remoto"** → `POST /api/soporte/auto-vincular`.
   - El backend compara los dispositivos conectados en MeshCentral contra los ya vinculados en la tabla `equipos`.
   - Si detecta exactamente un dispositivo nuevo, lo vincula automáticamente al `serial` del usuario.
   - Si hay ambigüedad (varios dispositivos sin vincular a la vez), el usuario elige el suyo de una lista.
3. Un técnico/admin, desde su vista de **Soporte Remoto**, introduce el `serial` del equipo (o hace clic en "Conectar" desde una solicitud de soporte en tiempo real) → `GET /api/soporte/conectar/:serial`.
4. El backend busca el `mesh_nodeid` asociado a ese `serial`, genera un link de sesión temporal vía MeshCentral, y lo devuelve.
5. El frontend carga ese link dentro de un `<iframe>` — el técnico ve y controla la pantalla del usuario en tiempo real, sin salir de la plataforma.

---

## 📌 Notas y decisiones de diseño

- **MeshCentral vive fuera del repositorio** deliberadamente: es infraestructura de soporte remoto, no código de la aplicación. En producción correría en su propio servidor/VPS con dominio y certificado propios.
- **El `nodeid` de MeshCentral nunca se expone al frontend** directamente — el usuario y el técnico solo trabajan con el `serial` de SIGMEI; el backend hace la traducción internamente.
- Los links de sesión remota se generan **bajo demanda, con expiración**, en vez de guardarse fijos — cada sesión de soporte obtiene un link nuevo.