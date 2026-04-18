# Companion AI — Hackathon Troyano 2026
> Agente de IA como compañero para adultos mayores
> FIF UAQ · 17-18 de Abril, 2026 · Centro de Negocios UAQ

---

## Idea central

Un dispositivo físico (M5GO) con un agente conversacional de IA que acompaña a adultos mayores mediante voz natural. El agente recuerda el nombre del usuario, sus medicamentos y su familia, detecta caídas y puede alertar a familiares en caso de emergencia.

**El adulto mayor no necesita celular ni computadora — solo presiona un botón y habla.**

---

## Stack tecnológico

| Capa | Tecnología | Rol |
|------|-----------|-----|
| Hardware | **M5GO (ESP32)** | Dispositivo físico — micrófono, parlante, pantalla, botones |
| LLM / Cerebro | **Gemini API** | Procesa mensajes, mantiene contexto, genera respuestas |
| Voz sintética | **ElevenLabs API** | Convierte respuestas de texto a voz natural en español |
| Speech-to-Text | Gemini Audio / Whisper | Convierte voz del usuario a texto |
| Memoria | **MongoDB Atlas** | Persiste perfil del usuario: nombre, medicamentos, familia |
| Alertas | EmailJS / Twilio | Notifica a familiar en emergencia o caída |

> Gemini, ElevenLabs y MongoDB Atlas son patrocinadores oficiales del hackathon — usar sus APIs suma puntos para premios adicionales.

---

## Arquitectura del flujo

```
Usuario habla
     │
     ▼
M5GO graba audio con micrófono
     │
     ▼
Audio → Speech-to-Text → texto
     │
     ▼
Gemini API (contexto + perfil en MongoDB)
     │
     ▼
Respuesta en texto
     │
     ▼
ElevenLabs API → audio MP3
     │
     ▼
M5GO reproduce respuesta por parlante
```

---

## Features del MVP (48 horas)

### Core
- [ ] Conversación natural por voz en español
- [ ] Memoria de la sesión (nombre, gustos, familia)
- [ ] Recordatorios de medicamentos
- [ ] Cara animada en la pantalla LCD del M5GO

### Seguridad
- [ ] Detección de caídas con acelerómetro del M5GO
- [ ] Botón físico de emergencia (botón C)
- [ ] Alerta automática a familiar por email/SMS

### UX
- [ ] Botón A → iniciar conversación
- [ ] Botón B → repetir último mensaje
- [ ] Botón C → emergencia
- [ ] LED verde = escuchando / rojo = procesando

---

## Estructura del proyecto

```
hackathon2026/
├── src/
│   ├── agent/          # Lógica del agente Gemini (contexto, memoria)
│   ├── voice/          # Integración ElevenLabs + Speech-to-Text
│   ├── ui/             # Pantalla LCD M5GO + animaciones
│   └── hardware/       # Código MicroPython para M5GO
├── docs/               # Documentación técnica y arquitectura
├── assets/             # Imágenes, iconos, recursos
└── README.md
```

---

## Plan de 48 horas

### Día 1 — 17 de Abril
| Hora | Tarea |
|------|-------|
| 10:00 - 12:00 | Setup: APIs, M5GO WiFi, repo GitHub |
| 12:00 - 15:00 | Conectar Gemini + contexto básico de conversación |
| 15:00 - 18:00 | Integrar ElevenLabs → reproducir audio en M5GO |
| 18:00 - 21:00 | Botones + pantalla LCD + cara animada |
| 21:00 - 23:00 | MongoDB Atlas: perfil de usuario persistente |

### Día 2 — 18 de Abril
| Hora | Tarea |
|------|-------|
| 09:00 - 11:00 | Detección de caídas + botón de emergencia |
| 11:00 - 13:00 | Alertas a familiar (email/SMS) |
| 13:00 - 14:00 | Pruebas, bugs, pulir demo |
| 14:00 - 14:45 | Grabar video de 4 minutos y subir a YouTube |

---

## Criterios de evaluación (jurado)

| Criterio | Como lo cubrimos |
|----------|-----------------|
| Importancia del problema | Soledad y aislamiento en adultos mayores — problema real y medible |
| Creatividad e innovación | Hardware físico + IA conversacional + detección de caídas |
| Avance de implementación | Demo funcional corriendo en M5GO real |
| Mérito técnico | Gemini + ElevenLabs + MongoDB + ESP32 integrados |

---

## Video demo (max 4 min) — guión sugerido

1. **0:00 - 0:30** — Problema: datos de soledad en adultos mayores en México
2. **0:30 - 1:30** — Demo en vivo: conversación con el M5GO
3. **1:30 - 2:30** — Demo: recordatorio de medicamento + cara animada
4. **2:30 - 3:30** — Demo: simulación de caída → alerta al familiar
5. **3:30 - 4:00** — Arquitectura técnica y stack usado

---

## Equipo

| Nombre | Rol |
|--------|-----|
| | |
| | |
| | |
| | |

---

## Recursos

- [Sitio oficial Hackathon Troyano 2026](https://hackathon.fif-uaq.mx)
- [Gemini API Docs](https://ai.google.dev/docs)
- [ElevenLabs API Docs](https://elevenlabs.io/docs)
- [MongoDB Atlas](https://www.mongodb.com/atlas)
- [M5GO Docs](https://docs.m5stack.com/en/core/m5go)
- [M5Stack MicroPython](https://github.com/m5stack/UIFlow-MicroPython)

---

*Hackathon Troyano 2026 — FIF UAQ · Tema: Open Innovation Challenge: IA para Impacto en el Mundo Real*
