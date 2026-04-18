<p align="center">
  <img src="lumi-preview-final.png" alt="Lumi" width="600"/>
</p>

<h1 align="center">Lumi</h1>
<p align="center">
  <strong>AI Companion for Elderly — Because no one should age alone.</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#project-structure">Structure</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#team">Team</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Hackathon-Troyano%202026-orange" alt="Hackathon Troyano 2026"/>
  <img src="https://img.shields.io/badge/MLH-Member%20Event-blue" alt="MLH"/>
  <img src="https://img.shields.io/badge/Gemini-2.5%20Pro-4285F4" alt="Gemini"/>
  <img src="https://img.shields.io/badge/ElevenLabs-TTS-black" alt="ElevenLabs"/>
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248" alt="MongoDB Atlas"/>
</p>

---

## The Problem

In Mexico, **over 40% of elderly adults experience loneliness daily**. Their families — busy with work, school, and responsibilities — can't be there 24/7. Social circles shrink, physical limitations grow, and the conversations that once filled their days disappear.

**Lumi changes that.** A physical AI companion that sits in their home, talks naturally, remembers their stories, and watches over them — alerting the family when something goes wrong.

> The elderly person doesn't need a phone or computer. They just press a button and talk.

---

## Features

### Conversational AI
- Natural voice conversations in Spanish
- Remembers the user's name, interests, favorite music, stories
- Proactively initiates topics based on their preferences
- Powered by Gemini 2.5 Pro with long-term memory

### Health & Safety
- **Fall detection** — 3-phase algorithm (freefall + impact + gyroscope confirmation)
- **Medication reminders** — Timely, gentle voice reminders
- **Emergency button** — Instant alert to family
- **Real-time alerts** — Via mobile app, Telegram, and WhatsApp

### Family App
- Live dashboard with activity status
- Conversation history
- Medication tracking
- Alert management
- Onboarding wizard to configure Lumi

### Hardware
- M5Stack M5GO (ESP32) with animated eyes on screen
- Built-in microphone, speaker, IMU sensors
- LED indicators (green = listening, red = processing)
- Physical buttons: A (talk), B (repeat), C (emergency)

---

## Architecture

```
  Elderly Person                    Family
       |                              |
  [Press Button]               [Mobile App - iOS]
       |                              |
  [M5GO ESP32]                        |
  - Record audio                      |
  - Fall detection          [HTTPS - Caddy Proxy]
  - LED feedback                      |
       |                     [DigitalOcean Droplet]
       |                              |
  [WiFi - HTTP]              [FastAPI + LangGraph]
       |                      /       |       \
       +---------------------+       |        \
                             |        |         \
                      [Gemini 2.5]  [Redis]  [ElevenLabs]
                        STT + LLM   Cache      TTS
                             |
                      [MongoDB Atlas]
                    Users, Conversations,
                    Medications, Alerts
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Hardware** | M5Stack M5GO (ESP32) | Physical device — mic, speaker, screen, IMU |
| **AI / LLM** | Google Gemini 2.5 Pro | Conversation, reasoning, speech-to-text |
| **Voice** | ElevenLabs | Natural text-to-speech (Lily voice) |
| **Agent Framework** | LangGraph | Stateful conversation agent with tools |
| **Backend** | FastAPI + Uvicorn | REST API |
| **Database** | MongoDB Atlas | User profiles, conversations, alerts |
| **Cache** | Redis | Conversation history cache |
| **Mobile App** | React Native + Expo Router | Family monitoring app (iOS) |
| **Cloud** | DigitalOcean | Droplet hosting |
| **HTTPS** | Caddy | Automatic TLS certificates |
| **Alerts** | Telegram Bot API | Real-time family notifications |

---

## Project Structure

```
lumi/
├── src/
│   ├── backend/              # FastAPI + LangGraph backend
│   │   ├── graph/            # LangGraph agent (nodes, tools, builder)
│   │   ├── services/         # MongoDB, Redis, TTS, medications, alerts
│   │   ├── prompts/          # Lumi's personality prompt
│   │   ├── config.py         # Environment configuration
│   │   └── main.py           # API endpoints
│   │
│   ├── app/                  # React Native / Expo mobile app
│   │   ├── app/              # Expo Router screens
│   │   │   ├── (tabs)/       # Main tabs (home, activity, family, meds)
│   │   │   └── (onboarding)/ # Setup wizard
│   │   ├── components/       # Reusable UI components
│   │   └── lib/              # API client, theme, utilities
│   │
│   └── firmware/             # ESP32 / M5GO firmware (C++)
│       ├── src/              # Main code (audio, network, IMU, LEDs)
│       └── include/          # Headers and configuration
│
└── docs/                     # Documentation
```

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- PlatformIO (for firmware)
- Xcode (for iOS builds)
- M5Stack M5GO device

### Backend

```bash
cd src/backend
python -m venv .venv && source .venv/bin/activate
pip install -e .
cp .env.example .env  # Configure your API keys
python main.py
```

### Mobile App

```bash
cd src/app
npm install
npx expo start
```

### Firmware

```bash
cd src/firmware
# Edit include/config.h with your WiFi and backend URL
pio run -t upload
```

### Environment Variables

```env
GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=gemini-2.5-pro
ELEVENLABS_API_KEY=your_elevenlabs_key
ELEVENLABS_VOICE_ID=pFZP5JQG7iQjIQuC4Bku
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/companion
TELEGRAM_BOT_TOKEN=your_telegram_bot
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
```

---

## MLH Prize Tracks

| Track | How we use it |
|-------|--------------|
| **Best Use of ElevenLabs** | Natural voice synthesis for Lumi's responses |
| **Best Use of Gemini API** | Conversational AI + speech-to-text |
| **Best Use of MongoDB Atlas** | Cloud database for users, conversations, alerts |
| **Best Use of DigitalOcean** | Backend deployed on Droplet with HTTPS |

---

## Team

| Name | Role |
|------|------|
| **Jose Angel Salinas Terrazas** | Lead Developer & AI Engineer |
| **Danielle Sebastian Rivera Perez** | Hardware & Research (Fall Detection) |
| **Jorge Luis Ramirez Ramirez** | Frontend & Animations (Lumi's Eyes) |
| **Angel Moises Morales Consuelo** | QA & Testing |
| **Luis Julian Olalde Abarca** | Bug Fixing & Integration |

---

## License

This project was built during **Hackathon Troyano 2026** at Universidad Autonoma de Queretaro (UAQ). All intellectual property belongs to the team members.

---

<p align="center">
  <strong>Hackathon Troyano 2026</strong> — FIF UAQ<br/>
  <em>AI for Real-World Impact</em>
</p>
