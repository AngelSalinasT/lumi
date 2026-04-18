/*
 * Companion AI — Firmware M5GO v2.7
 * Ojos animados estilo EVA (Wall-E) + agente conversacional
 *
 * Botón A → graba WAV → POST /chat → recibe MP3 → reproduce
 * Botón B → repite último audio
 * Botón C → emergencia
 */

#include <M5Stack.h>
#include <WiFi.h>

#include "config.h"
#include "robo_eyes.h"
#include "audio.h"
#include "network.h"
#include "leds.h"
#include "imu.h"

// --- Estado ---
enum DeviceState { STATE_IDLE, STATE_RECORDING, STATE_PROCESSING, STATE_PLAYING, STATE_EMERGENCY };
volatile DeviceState currentState = STATE_IDLE;

// Ojos
RoboEyes eyes;

// Último audio (para Botón B)
uint8_t* lastAudio = nullptr;
size_t lastAudioSize = 0;

void setup() {
  M5.begin(true, true, true, true);
  Serial.begin(115200);
  Serial.println("\n=== Companion AI ===");

  M5.Lcd.setBrightness(80);
  leds_init();
  leds_set_color(COLOR_BLUE);

  // Pantalla de carga
  M5.Lcd.fillScreen(TFT_BLACK);
  M5.Lcd.setTextColor(0x5E1F);
  M5.Lcd.setTextSize(2);
  M5.Lcd.setCursor(70, 100);
  M5.Lcd.println("Conectando...");

  wifi_connect();

  M5.Lcd.setCursor(70, 130);
  M5.Lcd.println(check_backend_health() ? "Backend OK" : "Sin backend");
  delay(800);

  imu_init();
  audio_init();

  // Iniciar ojos
  eyes.begin(50);  // 50 FPS
  eyes.setAutoblinker(true, 2, 4);  // Parpadeo automático cada 2-6 seg
  eyes.setIdleMode(true, 3, 3);     // Mira alrededor cada 3-6 seg
  eyes.setCuriosity(true);           // Ojos se agrandan cuando miran al lado

  leds_off();
  Serial.println("Listo!");
}

void loop() {
  M5.update();
  eyes.update();

  if (M5.BtnA.wasPressed() && currentState == STATE_IDLE) handle_talk();
  if (M5.BtnB.wasPressed() && currentState == STATE_IDLE) handle_repeat();
  if (M5.BtnC.wasPressed()) handle_emergency();

  if (currentState != STATE_EMERGENCY && imu_check_fall()) {
    Serial.println("Caida detectada!");
    handle_emergency();
  }

  delay(5);
}

void handle_talk() {
  currentState = STATE_RECORDING;
  eyes.setMood(DEFAULT);
  eyes.setPosition(POS_CENTER);
  leds_set_color(COLOR_GREEN);
  Serial.println("Grabando...");

  size_t wav_size = 0;
  uint8_t* wav_data = audio_record(&wav_size);

  if (!wav_data || wav_size == 0) {
    eyes.setMood(TIRED);
    leds_set_color(COLOR_RED);
    delay(1500);
    eyes.setMood(DEFAULT);
    leds_off();
    currentState = STATE_IDLE;
    return;
  }

  // Procesando
  currentState = STATE_PROCESSING;
  eyes.setMood(TIRED);  // Ojos entrecerrados = pensando
  eyes.setPosition(POS_N);  // Mira arriba = pensando
  leds_set_color(COLOR_YELLOW);

  size_t response_size = 0;
  uint8_t* mp3_data = send_chat_audio(wav_data, wav_size, &response_size);
  free(wav_data);

  if (!mp3_data || response_size == 0) {
    eyes.setMood(ANGRY);
    leds_set_color(COLOR_RED);
    delay(1500);
    eyes.setMood(DEFAULT);
    leds_off();
    currentState = STATE_IDLE;
    return;
  }

  // Guardar para repetir
  if (lastAudio) free(lastAudio);
  lastAudio = mp3_data;
  lastAudioSize = response_size;

  // Reproducir
  currentState = STATE_PLAYING;
  eyes.setMood(HAPPY);
  eyes.setPosition(POS_CENTER);
  leds_set_color(COLOR_BLUE);

  audio_play_mp3(mp3_data, response_size);

  eyes.setMood(DEFAULT);
  leds_off();
  currentState = STATE_IDLE;
}

void handle_repeat() {
  if (!lastAudio || lastAudioSize == 0) return;

  currentState = STATE_PLAYING;
  eyes.setMood(HAPPY);
  leds_set_color(COLOR_BLUE);

  audio_play_mp3(lastAudio, lastAudioSize);

  eyes.setMood(DEFAULT);
  leds_off();
  currentState = STATE_IDLE;
}

void handle_emergency() {
  currentState = STATE_EMERGENCY;
  eyes.setColors(EVA_ALERT, EVA_BG);  // Ojos rojos
  eyes.setMood(ANGRY);
  leds_set_color(COLOR_RED);

  send_emergency();

  delay(3000);
  eyes.setColors(EVA_EYE, EVA_BG);  // Volver a azul
  eyes.setMood(DEFAULT);
  leds_off();
  currentState = STATE_IDLE;
}
