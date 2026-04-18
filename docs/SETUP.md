# Setup - Lumi Companion AI

## Requisitos previos

- **Python 3.11+** con `pip`
- **PlatformIO** (CLI o VS Code extension)
- **M5Stack Core** (ESP32) conectado por USB
- Cuentas con API keys: Gemini, ElevenLabs, MongoDB Atlas, Telegram Bot

---

## 1. Backend (Python + FastAPI)

### 1.1 Crear entorno virtual e instalar dependencias

```bash
cd src/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
```

### 1.2 Configurar variables de entorno

Crear archivo `src/backend/.env`:

```env
# LLM + STT
GEMINI_API_KEY=tu_api_key_de_gemini

# TTS
ELEVENLABS_API_KEY=tu_api_key_de_elevenlabs
ELEVENLABS_VOICE_ID=id_de_la_voz

# Base de datos
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/companion?retryWrites=true&w=majority

# Telegram (alertas)
TELEGRAM_BOT_TOKEN=token_del_bot
TELEGRAM_DEFAULT_CHAT_ID=id_del_chat

# Backend
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
DEBUG=true
```

### 1.3 Levantar el backend

```bash
source .venv/bin/activate
python main.py
```

El servidor inicia en `http://0.0.0.0:8000`.

Verificar que funciona:

```bash
curl http://localhost:8000/health
# {"status":"ok"}
```

### 1.4 Probar sin hardware

```bash
curl -X POST http://localhost:8000/chat/text \
  -d "text=Hola, ¿cómo estás?" \
  -d "device_id=test_device" \
  --output response.mp3
```

---

## 2. Firmware (M5Stack / ESP32)

### 2.1 Configurar WiFi y backend

Editar `src/firmware/include/config.h`:

```cpp
// --- WiFi ---
#define WIFI_SSID     "tu_red_wifi"        // Solo 2.4GHz (ESP32 no soporta 5GHz)
#define WIFI_PASSWORD "tu_password_wifi"

// --- Backend ---
#define BACKEND_URL   "http://TU_IP_LOCAL:8000"
#define DEVICE_ID     "m5go_001"
```

Para obtener tu IP local:

```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

> **Nota:** Si usas VPN, la IP puede cambiar. Verifica antes de compilar.

### 2.2 Compilar

```bash
cd src/firmware
pio run
```

### 2.3 Subir al M5Stack

Conectar el M5Stack por USB y verificar el puerto:

```bash
ls /dev/cu.usb*
```

Si el puerto es diferente al configurado, editar `platformio.ini`:

```ini
upload_port = /dev/cu.usbserial-XXXXXX
```

Compilar y subir:

```bash
pio run -t upload
```

### 2.4 Monitor serial (ver logs)

```bash
pio device monitor -b 115200
```

Al arrancar debe mostrar:

```
=== Lumi - Companion AI ===
Conectando a TuRedWiFi...
WiFi conectado! IP: 192.168.x.x
Backend health: OK
IMU MPU6886 inicializado
Audio init OK
Listo!
```

---

## 3. Uso

| Boton | Accion |
|-------|--------|
| **A** (izquierdo) | Mantener presionado para hablar (push-to-talk) |
| **B** (centro) | Repetir ultima respuesta |
| **C** (derecho) | Alerta de emergencia |

La deteccion de caidas es automatica via el acelerometro (IMU).

---

## 4. Troubleshooting

| Problema | Solucion |
|----------|----------|
| M5 dice "Sin backend" | Verificar que la IP en `config.h` coincida con tu IP local y que el backend este corriendo |
| WiFi no conecta | Verificar que la red sea 2.4GHz. El ESP32 no soporta 5GHz |
| HTTP 500 en logs | Revisar logs del backend: `tail -f` en la terminal donde corre `main.py` |
| MongoDB no conecta | Agregar tu IP en MongoDB Atlas > Network Access. Si usas VPN, agregar la IP de la VPN |
| ElevenLabs 401/402 | Verificar API key y que la voz sea una voz default (las voces de library requieren plan de pago) |
| Puerto USB no encontrado | Verificar conexion USB y actualizar `upload_port` en `platformio.ini` |
| Puerto USB ocupado | Cerrar el monitor serial (Ctrl+C) antes de flashear |
