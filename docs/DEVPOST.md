# Lumi — AI Companion for Elderly

## Inspiration

In Mexico, over 40% of elderly adults experience loneliness on a daily basis. Their children and grandchildren — busy with work, school, and life responsibilities — simply can't be there 24/7. As time passes, social circles shrink: friends move away, physical limitations grow, and the interactions that once filled their days become fewer and fewer.

We asked ourselves: *what if we could give them a companion that's always there?* Not a passive screen to stare at, but someone who actually talks to them, asks about their day, remembers their stories, and cares about how they feel.

That's how **Lumi** was born.

## What it does

Lumi is an AI-powered conversational companion built on an M5GO (ESP32) device that lives alongside elderly people in their home. But Lumi is much more than a reminder tool:

- **Converses naturally** — Lumi doesn't just ask "how are you?" and move on. It remembers your favorite music, your stories, your interests, and brings them up naturally in conversation. It learns who you are and builds a relationship over time.
- **Medication reminders** — Gentle, timely reminders so they never miss a dose.
- **Fall detection** — Using accelerometer and gyroscope sensors, Lumi detects falls and immediately alerts family members via the app, Telegram, or WhatsApp.
- **Family app** — A React Native mobile app where children and grandchildren can monitor their loved one's well-being, see conversation activity, medication status, and receive real-time emergency alerts.
- **Proactive engagement** — Lumi doesn't wait to be spoken to. It initiates conversations, shares fun facts about topics they love, and keeps them mentally active.

## How we built it

- **Conversational AI**: LangGraph + Google Gemini 2.5 Pro for natural, context-aware conversations with memory
- **Voice**: ElevenLabs for natural text-to-speech, Gemini for speech-to-text
- **Hardware**: M5Stack M5GO (ESP32) with built-in microphone, speaker, IMU sensors, and display
- **Backend**: FastAPI deployed on DigitalOcean with Caddy (HTTPS)
- **Database**: MongoDB Atlas for user profiles, conversations, and alerts. Redis for conversation cache
- **Mobile App**: React Native with Expo Router, installed on iPhone for family monitoring
- **Alerts**: Real-time notifications via the app, Telegram, and WhatsApp

## Challenges we ran into

- **Making Lumi proactive** — Getting an AI agent to not just respond but actively engage, ask follow-up questions about the person's interests, and feel genuinely curious required extensive prompt engineering.
- **Fall detection tuning** — Calibrating the accelerometer and gyroscope on the M5GO to accurately detect falls without false positives was a significant challenge. We implemented a 3-phase algorithm: freefall detection, impact confirmation, and gyroscope validation.
- **Real-time alerts** — Ensuring that when a fall is detected, the family is notified instantly across multiple channels (app, Telegram) required careful architecture.
- **Addressing conditions like Alzheimer's** — We recognized early that conditions like hearing loss or dementia could limit interaction. While we scoped this for a future phase, it shaped how we designed Lumi's memory system — potentially detecting patterns like repeated conversations that could signal early signs of cognitive decline.

## Accomplishments that we're proud of

We're most proud of building a conversational agent that **goes beyond surface-level interaction**. Lumi doesn't just respond — it genuinely engages. It asks about your favorite team, remembers that you love boleros, brings up fun facts about history because it knows you enjoy it. Watching it have a natural conversation with someone and seeing them smile — that's what made this worth building.

## What we learned

This project taught us something deeply human: our elderly loved ones — grandparents, parents — inevitably face a reality where their physical capabilities diminish, their social circles shrink, and loneliness grows. As much as we want to be there 24/7, our own responsibilities make that impossible.

Building Lumi showed us that technology can bridge that gap — not to replace human connection, but to complement it. Having a companion that listens, remembers, and cares can make a real difference. And knowing that one day we'll all reach that stage of life makes this problem deeply personal.

## What's next for Lumi

- **Voice activation** — Currently Lumi requires a button press to start listening. The next step is wake-word detection ("Hey Lumi") for a more natural interaction.
- **Alzheimer's and cognitive health** — Using conversation history to detect patterns: repeated stories, confusion, memory gaps — potential early indicators of cognitive decline that can alert the family.
- **Hearing impairment support** — Adapting the interface for people with hearing loss, potentially through visual cues and text display.
- **Always-on listening** — Moving beyond the ESP32's memory limitations to enable continuous conversation without hardware constraints.
- **Behavioral pattern analysis** — Detecting changes in mood, activity levels, or conversation patterns that could indicate health concerns.

## Built With

- `gemini-2.5-pro` — Conversational AI (STT + reasoning)
- `elevenlabs` — Natural text-to-speech
- `langgraph` — Agent orchestration
- `fastapi` — Backend API
- `mongodb-atlas` — Cloud database
- `redis` — Conversation cache
- `react-native` — Family mobile app (Expo)
- `esp32` — M5Stack M5GO hardware
- `digitalocean` — Cloud hosting
- `caddy` — HTTPS reverse proxy

## Team

- **Jose Angel Salinas Terrazas** — Lead Developer & AI Engineer
- **Danielle Sebastian Rivera Perez** — Hardware & Research (Fall Detection)
- **Jorge Luis Ramirez Ramirez** — Frontend & Animations (Lumi's Eyes)
- **Angel Moises Morales Consuelo** — QA & Testing
- **Luis Julian Olalde Abarca** — Bug Fixing & Integration
