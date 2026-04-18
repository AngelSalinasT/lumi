# Lumi -- Documentacion del Proyecto

Hackathon Troyano 2026 -- FIF UAQ
Agente de IA como companera para adultos mayores

---

## 1. Que es Lumi?

Lumi es un dispositivo fisico (M5GO basado en ESP32) que funciona como companera de inteligencia artificial para adultos mayores. El usuario no necesita celular ni computadora: presiona un boton en el dispositivo y habla. Lumi escucha, entiende y responde con voz natural en espanol mexicano.

El sistema tiene tres propositos principales:

- **Compania**: Lumi platica de forma natural, recuerda el nombre del usuario, sus gustos, su familia, y puede buscar informacion actual (noticias, deportes, clima).
- **Salud**: Registra medicamentos y sus horarios, envia recordatorios por voz cuando es hora de tomarlos, y lleva un log de cumplimiento.
- **Seguridad**: Detecta caidas con el acelerometro/giroscopio (IMU), tiene boton de emergencia, y alerta a familiares via Telegram y push notifications.

La familia del adulto mayor puede monitorear todo desde una app movil (Expo/React Native) que muestra actividad, conversaciones, medicamentos y alertas.

---

## 2. Arquitectura

El proyecto tiene tres componentes que se comunican via HTTP sobre la misma red WiFi local:

```
+------------------+         HTTP          +-------------------+
|   M5GO (ESP32)   | <------------------> |  Backend (FastAPI) |
|   Firmware C++   |   audio WAV / MP3    |  Python + LangGraph|
|   Push-to-talk   |   /chat, /emergency  |  Gemini, ElevenLabs|
|   IMU, LEDs, LCD |   /notifications     |  MongoDB, Redis    |
+------------------+                      +-------------------+
                                                  ^
                                                  | HTTP REST API
                                                  | /api/*
                                                  v
                                          +-------------------+
                                          |  App Familiar     |
                                          |  Expo / React     |
                                          |  Native (iOS)     |
                                          +-------------------+
```

**Flujo de datos:**

- El firmware envia audio WAV al backend y recibe audio MP3 como respuesta.
- El backend procesa voz (STT), ejecuta el agente LangGraph con Gemini, genera respuesta de voz (TTS con ElevenLabs), y persiste datos en MongoDB.
- La app familiar consume endpoints REST (`/api/*`) para consultar perfil, actividad, conversaciones, medicamentos y alertas.
- El firmware hace polling a `/notifications/{device_id}` cada 15 segundos para recibir recordatorios de medicamentos generados por el backend.

---

## 3. Habilidades del agente

El agente LangGraph tiene las siguientes herramientas (tools) definidas en `src/backend/graph/tools.py`:

| Herramienta | Descripcion |
|---|---|
| `get_time()` | Devuelve la hora y fecha actual. Se usa cuando el usuario pregunta que hora es. |
| `medication_reminder(name, dose, time)` | Registra un medicamento con dosis y horario. Se activa cuando el usuario menciona una medicina que toma. |
| `confirm_medication(name, taken)` | Registra si el usuario tomo o no un medicamento. Se usa cuando confirma o niega haber tomado su medicina. |
| `send_alert(reason)` | Envia alerta de emergencia al familiar. Se activa cuando el usuario dice que se cayo, se siente muy mal, o pide ayuda urgente. |
| `save_user_info(field, value)` | Guarda datos personales (nombre, edad, equipo favorito, musica, hobbies). Se activa cuando el usuario comparte informacion sobre si mismo. |
| `save_family_contact(name, relation, phone)` | Guarda informacion de un familiar. Se activa cuando el usuario menciona a alguien con datos de contacto. |
| `web_search(query)` | Busca informacion actual en internet via DuckDuckGo (region Mexico). Se usa para noticias, deportes, clima, datos curiosos. |

Regla importante: el agente usa maximo una herramienta por turno de conversacion.

---

## 4. Backend (FastAPI + LangGraph)

Archivo principal: `src/backend/main.py`
Configuracion: `src/backend/config.py`

### Stack tecnologico

- **LLM**: Gemini 2.5 Flash (via `gemini_api_key`)
- **TTS**: ElevenLabs API (voz natural en espanol)
- **STT**: Google Speech-to-Text (via Gemini Audio)
- **Base de datos**: MongoDB Atlas (perfiles, conversaciones, medicamentos, alertas)
- **Orquestador**: LangGraph (grafo de estados con tool calling)
- **Alertas**: Telegram Bot API
- **Framework**: FastAPI con lifespan para inicializar MongoDB y scheduler

### Endpoints organizados por categoria

**Dispositivo (ESP32):**

| Endpoint | Metodo | Descripcion |
|---|---|---|
| `/health` | GET | Health check del backend |
| `/chat` | POST | Flujo principal: recibe WAV, devuelve audio MP3 |
| `/chat/text` | POST | Prueba: recibe texto, devuelve audio |
| `/chat/debug` | POST | Prueba: texto a texto, sin TTS, muestra tools usadas |
| `/emergency` | POST | Recibe alerta de emergencia del M5GO |
| `/notifications/{device_id}` | GET | Polling: devuelve audio de recordatorios pendientes (204 si no hay) |

**App familiar (REST API):**

| Endpoint | Metodo | Descripcion |
|---|---|---|
| `/api/profile/{device_id}` | GET | Perfil completo del usuario |
| `/api/activity/{device_id}` | GET | Resumen de actividad (interacciones hoy, ultima interaccion) |
| `/api/conversations/{device_id}` | GET | Historial de conversaciones |
| `/api/medications/{device_id}` | GET/POST/DELETE | CRUD de medicamentos |
| `/api/medication-log/{device_id}` | GET | Log de medicamentos tomados/no tomados |
| `/api/family/{device_id}` | POST | Agregar contacto familiar |
| `/api/onboarding/{device_id}` | POST | Guardar datos completos del onboarding |

**Alertas y emergencias:**

| Endpoint | Metodo | Descripcion |
|---|---|---|
| `/api/alerts/{device_id}` | GET/DELETE | Obtener o eliminar todas las alertas |
| `/api/alerts/{device_id}/seen` | POST | Marcar alertas como vistas |
| `/api/alerts/{device_id}/{timestamp}` | DELETE | Eliminar una alerta especifica |

**Pairing y estado del dispositivo:**

| Endpoint | Metodo | Descripcion |
|---|---|---|
| `/api/device/{device_id}/status` | GET | Estado del dispositivo (waiting_setup, onboarding, ready) |
| `/api/device/{device_id}/pair` | POST | La app escanea QR e inicia pairing |
| `/api/device/{device_id}/activate` | POST | La app activa el dispositivo para que Lumi empiece a conversar |
| `/api/push-token` | POST | Registra Expo push token para notificaciones |

### Variables de entorno necesarias (.env)

```
GEMINI_API_KEY=...
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=...
MONGODB_URI=mongodb+srv://...
TELEGRAM_BOT_TOKEN=...
TELEGRAM_DEFAULT_CHAT_ID=...
```

---

## 5. Firmware (ESP32 / M5GO)

Archivos principales: `src/firmware/src/main.cpp`, `src/firmware/include/config.h`
Plataforma: PlatformIO con Arduino framework para M5Stack.

### Funcionalidades

- **Push-to-talk (Boton A)**: Mantener presionado para grabar audio (8kHz, 16-bit, max 15 segundos). Al soltar, envia el WAV al backend y reproduce la respuesta en MP3.
- **Repetir (Boton B)**: Reproduce el ultimo audio recibido del backend.
- **Emergencia (Boton C)**: Envia alerta de emergencia al backend con razon "boton".
- **Deteccion de caidas (IMU)**: Algoritmo de 3 fases usando acelerometro y giroscopio:
  1. Caida libre detectada (aceleracion < 0.4g)
  2. Impacto detectado (aceleracion > 2.5g)
  3. Confirmacion con giroscopio (> 200 dps) dentro de 1.5 segundos
  - Cooldown de 30 segundos entre detecciones.
- **LEDs de estado** (10 LEDs NeoPixel, pin 15):
  - Verde: grabando audio
  - Amarillo: procesando (esperando respuesta del backend) o notificacion entrante
  - Azul: reproduciendo respuesta
  - Rojo: error o emergencia
- **Ojos animados en LCD**: Biblioteca RoboEyes con parpadeo automatico, modo idle, y expresiones (DEFAULT, HAPPY, ANGRY para emergencias).
- **Polling de notificaciones**: Cada 15 segundos consulta `/notifications/{device_id}` para recibir recordatorios de medicamentos.

### Estados del dispositivo

```
STATE_IDLE → STATE_RECORDING → STATE_PROCESSING → STATE_PLAYING → STATE_IDLE
                                                                      ↑
STATE_IDLE → STATE_EMERGENCY ─────────────────────────────────────────┘
```

### Configuracion del firmware (config.h)

```cpp
#define WIFI_SSID     "nombre_red"
#define WIFI_PASSWORD "contrasena"
#define BACKEND_URL   "http://IP_DEL_BACKEND:8000"
#define DEVICE_ID     "m5go_001"
```

---

## 6. App familiar (Expo / React Native)

Nombre: "Lumi Family" (`com.angelsalinas.lumifamily`)
Archivo de config: `src/app/app.json`
Capa API: `src/app/lib/api.ts`

### Funcionalidades

- **Dashboard de actividad**: Muestra nombre del usuario, ultima interaccion, numero de interacciones del dia, medicamentos y contactos familiares.
- **Historial de conversaciones**: Lista cronologica de todos los turnos de conversacion entre Lumi y el adulto mayor.
- **Gestion de medicamentos**: Ver, agregar y eliminar medicamentos con nombre, dosis y horario. Incluye log de cumplimiento (tomado/no tomado).
- **Alertas de emergencia**: Lista de alertas con indicador de no vistas, marcar como vistas, eliminar individual o todas. Recibe push notifications en emergencias.
- **Wizard de onboarding**: Flujo guiado para configurar el dispositivo:
  1. Escaneo de codigo QR del M5GO (usa camara del telefono)
  2. Datos del adulto mayor (nombre, edad, condiciones de salud)
  3. Medicamentos con horarios
  4. Contactos familiares (nombre, relacion, telefono, Telegram)
  5. Activacion del dispositivo
- **Pairing con dispositivo**: Escanea QR que muestra el M5GO, llama a `/api/device/{id}/pair`, completa onboarding, y activa con `/api/device/{id}/activate`.

### Conexion con el backend

La app se conecta al backend via HTTP usando la IP configurada en `lib/api.ts`. El `DEVICE_ID` debe coincidir con el configurado en el firmware (`m5go_001` por defecto).

---

## 7. Configuracion rapida

### 1. Backend

```bash
cd src/backend
cp .env.example .env  # Editar con las API keys
pip install -r requirements.txt
python main.py
```

Variables requeridas en `.env`:
- `GEMINI_API_KEY` -- API key de Google Gemini
- `ELEVENLABS_API_KEY` -- API key de ElevenLabs
- `ELEVENLABS_VOICE_ID` -- ID de la voz en ElevenLabs
- `MONGODB_URI` -- URI de conexion a MongoDB Atlas
- `TELEGRAM_BOT_TOKEN` -- Token del bot de Telegram para alertas
- `TELEGRAM_DEFAULT_CHAT_ID` -- Chat ID por defecto para alertas

El backend corre en `0.0.0.0:8000` por defecto.

### 2. Firmware

Editar `src/firmware/include/config.h`:
- `WIFI_SSID` y `WIFI_PASSWORD` -- Red WiFi a la que se conectara el M5GO
- `BACKEND_URL` -- IP del equipo que corre el backend (ej: `http://172.20.10.5:8000`)
- `DEVICE_ID` -- Identificador del dispositivo (debe coincidir en app y backend)

Compilar y flashear con PlatformIO.

### 3. App familiar

```bash
cd src/app
npm install
npx expo run:ios  # o npx expo start
```

En `src/app/lib/api.ts`, verificar que `BASE_URL` apunte a la IP del backend y que `DEVICE_ID` coincida con el del firmware.

### Requisitos de red

Los tres componentes deben estar en la misma red WiFi local. La IP del backend debe ser accesible desde el M5GO y desde el telefono.

---

## 8. Flujo de una conversacion

Paso a paso de lo que ocurre cuando el usuario presiona el boton y habla:

```
1. Usuario presiona Boton A en el M5GO
   → LEDs se ponen verdes
   → Comienza grabacion de audio (8kHz, 16-bit)
   → Audio se escribe a tarjeta SD en formato WAV

2. Usuario suelta Boton A
   → Se detiene la grabacion
   → LEDs cambian a amarillo (procesando)
   → Ojos muestran expresion HAPPY

3. Firmware envia WAV al backend
   → POST /chat (multipart: audio file + device_id)
   → Se ejecuta en un FreeRTOS task separado (core 0)
   → El loop principal sigue actualizando los ojos animados

4. Backend recibe el audio
   → Speech-to-Text (Gemini Audio) convierte WAV a texto
   → Se recupera el perfil del usuario de MongoDB
   → Se recupera el historial de conversacion de Redis

5. LangGraph ejecuta el agente
   → El prompt de Lumi se inyecta con variables dinamicas
     (nombre, medicamentos, familiares, gustos, hora actual)
   → Gemini 2.5 Flash procesa el mensaje con contexto completo
   → Si es necesario, ejecuta una tool (ej: save_user_info, web_search)
   → Genera respuesta en texto (max 30 palabras, espanol mexicano)

6. Texto a voz
   → ElevenLabs convierte la respuesta a audio MP3
   → El backend devuelve el MP3 como Response con media_type "audio/basic"

7. Firmware recibe el audio
   → LEDs cambian a azul (reproduciendo)
   → M5GO reproduce el MP3 por el parlante
   → Los ojos se actualizan durante la reproduccion

8. Fin del turno
   → LEDs se apagan
   → Ojos vuelven a modo idle con parpadeo automatico
   → Estado regresa a STATE_IDLE
   → El turno se guarda en MongoDB (historial visible en la app)
```

Tiempo total estimado por turno: 3-6 segundos dependiendo de la longitud del audio y la latencia de las APIs.
