# Companion AI — Arquitectura del Sistema

---

## Visión general

Un dispositivo físico embebido (M5GO / ESP32) actúa como terminal de hardware: captura voz, muestra una cara animada y reproduce audio. Todo el procesamiento de IA corre en un backend Python local o en la nube. El usuario solo toca un botón y habla.

```
┌─────────────────────────────────┐       ┌──────────────────────────────────────────┐
│           M5GO (ESP32)          │       │           Backend Python                 │
│                                 │       │                                          │
│  [Botón A] ──► Graba WAV        │──────►│  POST /chat  (multipart WAV)             │
│  Micrófono ──► buffer RAM       │       │       │                                  │
│                                 │       │       ▼                                  │
│  [Pantalla] ◄── Avatar animado  │       │  Gemini STT ──► transcripción            │
│  [Parlante] ◄── Reproduce MP3   │◄──────│       │                                  │
│  [LEDs]     ◄── Estado visual   │       │       ▼                                  │
│  [IMU]      ──► Detección caída │       │  LangGraph Agent                         │
│  [Botón C]  ──► POST /emergency │       │  (mono-prompt + historial + perfil)      │
│                                 │       │       │                                  │
└─────────────────────────────────┘       │       ▼                                  │
                                          │  ElevenLabs TTS ──► MP3 bytes            │
                                          │       │                                  │
                                          │       ▼                                  │
                                          │  Response(MP3) ──► M5GO                  │
                                          │                                          │
                                          │  MongoDB Atlas ──► perfil persistente    │
                                          └──────────────────────────────────────────┘
```

---

## Capas del sistema

### 1. Hardware — M5GO v2.7 (ESP32)

| Componente | Spec | Uso en el sistema |
|-----------|------|-------------------|
| CPU | ESP32 dual-core 240MHz | Lógica C++ Arduino |
| RAM | 520KB SRAM | Buffer WAV (max ~8s a 8kHz 16-bit ≈ 128KB) |
| Flash | 16MB | Firmware C++ |
| Pantalla | 2" IPS 320×240 | Avatar animado (m5stack-avatar) |
| Micrófono | BSE3729 analógico (pin G34) | Captura voz |
| Parlante | Pin G25 | Reproduce MP3 decodificado |
| Botón A | Pin G39 | Push-to-talk — iniciar grabación |
| Botón B | Pin G38 | Repetir último audio |
| Botón C | Pin G37 | Emergencia |
| IMU | MPU6886 6-axis | Detección de caída (umbral de aceleración) |
| LEDs | 10× SK6812 RGB | Estado visual: verde=escucha, rojo=procesa, azul=reproduce |
| WiFi | 802.11 b/g/n | Comunicación con backend vía HTTP |
| TF/SD | FAT32 (hasta 16GB) | Cache de audio (opcional), logs |

**Lenguaje:** Arduino C++ — requerido por `m5stack-avatar` (biblioteca de cara animada, no disponible en MicroPython).

**Dependencias Arduino:**
- `M5Stack` — HAL oficial M5GO
- `m5stack-avatar` — cara animada con ojos, boca, expresiones
- `ArduinoJson` — serializar/deserializar JSON para HTTP
- `ESP8266Audio` o `ESP32-audioI2S` — decodificar y reproducir MP3

---

### 2. Backend Python

**Runtime:** Python 3.11+
**Framework HTTP:** FastAPI (async)
**Orquestación IA:** LangGraph

#### Endpoints

| Método | Path | Input | Output | Descripción |
|--------|------|-------|--------|-------------|
| `POST` | `/chat` | `multipart/form-data` (WAV + device_id) | `audio/mpeg` (MP3) | Flujo principal de conversación |
| `POST` | `/emergency` | `application/json` `{device_id}` | `200 OK` | Dispara alerta a familiar |
| `GET` | `/health` | — | `{status: ok}` | Healthcheck para M5GO al arrancar |

#### Flujo del endpoint `/chat`

```
POST /chat (WAV bytes + device_id)
    │
    ▼
1. Leer perfil del usuario ← MongoDB Atlas
    │
    ▼
2. Gemini STT (audio → transcripción texto)
    │
    ▼
3. LangGraph graph.ainvoke({
       transcription,
       user_profile,
       conversation_history,
       messages: []
   })
    │
    ├── agent_node  → Gemini LLM + mono-prompt + historial
    │       │
    │       ▼ (si hay tool call)
    │   tools_node → ejecuta tool (recordatorio, alerta, etc.)
    │       │
    │       ▼
    └── tts_node   → ElevenLabs API → MP3 bytes
    │
    ▼
4. Guardar turno en historial ← MongoDB Atlas
    │
    ▼
5. Return Response(content=mp3_bytes, media_type="audio/mpeg")
```

---

### 3. LangGraph — Grafo del agente

#### Estado

```python
class CompanionState(TypedDict):
    device_id: str
    transcription: str                          # texto del usuario (post-STT)
    user_profile: dict                          # cargado de MongoDB
    conversation_history: list[dict]            # turnos anteriores [{role, content}]
    messages: Annotated[Sequence[BaseMessage], add_messages]
    response_text: str | None                   # texto generado por LLM
    audio_response: bytes | None                # MP3 final de ElevenLabs
    intent: str | None                          # "chat" | "reminder" | "emergency"
    trigger_alert: bool                         # si debe notificar al familiar
```

#### Grafo (fase inicial)

```
START
  │
  ▼
agent_node          ← Gemini LLM, mono-prompt, historial, perfil
  │
  ▼ (si tool_call)
tools_node          ← medication_reminder | send_alert | update_profile
  │
  ▼
tts_node            ← ElevenLabs → mp3 bytes
  │
  ▼
END
```

#### Tools planificadas (se agregan sin cambiar el grafo base)

| Tool | Descripción |
|------|-------------|
| `medication_reminder` | Registra/consulta recordatorios de medicamentos |
| `send_alert` | Notifica a familiar por email/SMS |
| `update_profile` | Actualiza nombre o datos del usuario en MongoDB |
| `get_time` | Responde "qué hora es" sin depender del LLM |

---

### 4. Audio — Especificaciones técnicas

#### Grabación (M5GO → Backend)
| Parámetro | Valor | Razón |
|-----------|-------|-------|
| Formato | WAV PCM | Sin overhead de codec en ESP32 |
| Sample rate | 8 kHz | Mínimo para voz inteligible, menor RAM |
| Bits/sample | 16 | Estándar de Whisper/Gemini |
| Duración max | 8 segundos | 8kHz × 2B × 8s = 128KB → cabe en SRAM |
| Transmisión | HTTP POST multipart | Síncrono, simple, sin WebSocket |

#### Respuesta (Backend → M5GO)
| Parámetro | Valor |
|-----------|-------|
| Formato | MP3 (ElevenLabs default) |
| Bitrate | 128kbps (configurable) |
| Reproducción | ESP32-audioI2S decodifica en streaming desde RAM |

---

### 5. Persistencia — MongoDB Atlas

#### Colecciones

**`users`**
```json
{
  "_id": "device_id",
  "name": "Don Ernesto",
  "age": 78,
  "medications": [
    { "name": "Metformina", "dose": "500mg", "time": "08:00" },
    { "name": "Losartán", "dose": "50mg", "time": "20:00" }
  ],
  "family_contacts": [
    { "name": "María", "relation": "hija", "email": "maria@gmail.com", "phone": "+52..." }
  ],
  "preferences": {
    "voice_speed": "slow",
    "topics": ["fútbol", "noticias", "familia"]
  }
}
```

**`conversations`**
```json
{
  "_id": "ObjectId",
  "device_id": "device_id",
  "session_id": "uuid",
  "timestamp": "ISO8601",
  "turns": [
    { "role": "user", "content": "¿Qué hora es?", "timestamp": "..." },
    { "role": "assistant", "content": "Son las tres de la tarde, Don Ernesto.", "timestamp": "..." }
  ]
}
```

---

### 6. Notificaciones de emergencia

**Triggers:**
1. Botón C físico en M5GO → `POST /emergency`
2. LLM detecta intención de emergencia en conversación → tool `send_alert`
3. IMU MPU6886 detecta caída (umbral G ≥ 2.5) → `POST /emergency`

**Canal:** Resend / SendGrid (email) o Twilio (SMS)
**Contenido:** nombre del usuario, hora, tipo de alerta, última frase dicha

---

## Estructura del proyecto

```
hackathon2026/
├── src/
│   ├── backend/                    # Python FastAPI + LangGraph
│   │   ├── main.py                 # FastAPI app, endpoints /chat /emergency /health
│   │   ├── graph/
│   │   │   ├── state.py            # CompanionState TypedDict
│   │   │   ├── builder.py          # Construye el grafo LangGraph
│   │   │   ├── nodes.py            # agent_node, tts_node, tools_node
│   │   │   └── tools.py            # medication_reminder, send_alert, update_profile
│   │   ├── services/
│   │   │   ├── stt.py              # Gemini STT (audio → texto)
│   │   │   ├── tts.py              # ElevenLabs (texto → MP3)
│   │   │   ├── mongo.py            # MongoDB Atlas client, operaciones CRUD
│   │   │   └── alerts.py           # Envío de email/SMS al familiar
│   │   ├── prompts/
│   │   │   └── companion.md        # Mono-prompt del agente
│   │   └── config.py               # Variables de entorno (API keys, URLs)
│   │
│   └── firmware/                   # Arduino C++ para M5GO
│       ├── companion/
│       │   ├── companion.ino       # Entry point Arduino
│       │   ├── audio.h / .cpp      # Grabación WAV + reproducción MP3
│       │   ├── network.h / .cpp    # WiFi, HTTP POST al backend
│       │   ├── avatar.h / .cpp     # m5stack-avatar, expresiones, animaciones
│       │   ├── buttons.h / .cpp    # Lógica botones A/B/C
│       │   ├── imu.h / .cpp        # Detección de caída con MPU6886
│       │   └── leds.h / .cpp       # SK6812 estados visuales
│       └── lib/                    # Librerías externas (como submodules o zip)
│
├── docs/
│   ├── arquitectura.md             # Este archivo
│   └── analisis-hackathon.md
├── assets/
└── README.md
```

---

## Variables de entorno

```env
# LLM
GEMINI_API_KEY=

# TTS
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=          # Voice ID del personaje elegido (español, cálido)

# Base de datos
MONGODB_URI=                  # mongodb+srv://...@cluster.mongodb.net/companion

# Alertas
RESEND_API_KEY=               # o SENDGRID_API_KEY / TWILIO_*

# Backend
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000

# M5GO config (para el firmware .ino)
WIFI_SSID=
WIFI_PASSWORD=
BACKEND_URL=http://192.168.x.x:8000
```

---

## Dependencias Python

```toml
[tool.poetry.dependencies]
python = "^3.11"
fastapi = "^0.115"
uvicorn = {extras = ["standard"], version = "^0.32"}
langgraph = "^0.2"
langchain-google-genai = "^4.0"        # Gemini LLM + STT
elevenlabs = "^1.9"                    # TTS SDK oficial
pymongo = {extras = ["srv"], version = "^4.9"}
motor = "^3.6"                         # async MongoDB
python-multipart = "^0.0.12"           # upload de archivos en FastAPI
pydantic-settings = "^2.5"
httpx = "^0.27"
```

---

## Dependencias Arduino / PlatformIO

```ini
[env:m5stack-core]
platform = espressif32
board = m5stack-core-esp32
framework = arduino
lib_deps =
    m5stack/M5Stack
    meganetaaan/m5stack-avatar
    bblanchon/ArduinoJson
    earlephilhower/ESP8266Audio       # o schreibfaul/ESP32-audioI2S
    knolleary/PubSubClient            # si se quiere MQTT como alternativa futura
monitor_speed = 115200
```

---

## Flujo completo — secuencia de un turno de conversación

```
M5GO                          Backend                       APIs externas
 │                               │                               │
 │  [Usuario presiona Botón A]   │                               │
 │  Graba WAV (hasta 8s)         │                               │
 │  LED verde encendido          │                               │
 │                               │                               │
 │──── POST /chat (WAV) ────────►│                               │
 │                               │──── Gemini STT ─────────────►│
 │  LED rojo (procesando)        │◄─── transcripción ───────────│
 │                               │                               │
 │                               │  Carga perfil ← MongoDB      │
 │                               │                               │
 │                               │──── LangGraph.ainvoke() ─────│
 │                               │     agent_node (Gemini LLM)  │
 │                               │     → response_text          │
 │                               │                               │
 │                               │──── ElevenLabs TTS ─────────►│
 │                               │◄─── MP3 bytes ───────────────│
 │                               │                               │
 │                               │  Guarda turno → MongoDB      │
 │                               │                               │
 │◄─── Response (MP3) ──────────│                               │
 │  LED azul (reproduciendo)     │                               │
 │  Boca avatar se mueve         │                               │
 │  Parlante reproduce audio     │                               │
 │  LED apagado (listo)          │                               │
```

---

## Estados del M5GO (máquina de estados)

```
IDLE ──[Botón A]──► RECORDING ──[soltar/timeout]──► PROCESSING ──[MP3 recibido]──► PLAYING
  ▲                                                        │                            │
  │                                                   [error]                           │
  └────────────────────────────────────────────────────────┴───────────────────────────┘

CUALQUIER ESTADO ──[Botón C]──► EMERGENCY ──[POST /emergency OK]──► IDLE
CUALQUIER ESTADO ──[IMU caída]──► EMERGENCY
IDLE ──[Botón B]──► PLAYING (repite último MP3 cacheado)
```

---

## Decisiones de diseño y sus razones

| Decisión | Alternativa descartada | Razón |
|----------|----------------------|-------|
| C++ Arduino (no MicroPython) | MicroPython | `m5stack-avatar` solo existe para C++; ojos animados son diferenciadores visuales clave |
| WAV completo → HTTP POST | Streaming WebSocket | Menor complejidad, más debuggable, ESP32 no maneja bien WebSocket bajo presión |
| LangGraph como orquestador | Llamada directa al LLM | Ya dominado en producción (agentcode-med), permite agregar tools sin cambiar el flujo |
| Gemini para STT | Whisper local | Gemini es patrocinador oficial, integración más directa con `langchain-google-genai` |
| ElevenLabs para TTS | Google TTS / Polly | Voz más natural en español, patrocinador oficial, SDK simple |
| MongoDB Atlas | PostgreSQL / SQLite | Patrocinador oficial, schema-less ideal para perfil variable por usuario, serverless tier gratis |
| FastAPI async | Flask / Django | Match natural con LangGraph async, `motor` para MongoDB async |
