/*
 * Lumi — Companion AI · M5GO v2.7
 * Push-to-talk + animated eyes + voice response
 */

#include <M5Stack.h>
#include <WiFi.h>

#include "config.h"
#include "robo_eyes.h"
#include "audio.h"
#include "network.h"
#include "leds.h"
#include "imu.h"

// Forward declarations
void handle_talk();
void handle_repeat();
void handle_emergency(const char* reason);
void updateEyesDuringPlayback();

// --- Estado ---
enum DeviceState { STATE_IDLE, STATE_RECORDING, STATE_PROCESSING, STATE_PLAYING, STATE_EMERGENCY };
volatile DeviceState currentState = STATE_IDLE;

// Ojos
RoboEyes eyes;
size_t lastAudioSize = 0;

// HTTP task
volatile bool httpDone = false;
volatile bool httpSuccess = false;
volatile size_t httpResponseSize = 0;

void httpTask(void* param) {
  size_t* sizes = (size_t*)param;
  size_t wav_size = sizes[0];
  uint8_t* wav_data = (uint8_t*)sizes[1];

  size_t response_size = 0;
  uint8_t* result = send_chat_audio(wav_data, wav_size, &response_size);

  httpResponseSize = response_size;
  httpSuccess = (result != nullptr && response_size > 0);
  httpDone = true;
  vTaskDelete(NULL);
}

void setup() {
  M5.begin(true, true, true, true);
  Serial.begin(115200);
  Serial.println("\n=== Lumi - Companion AI ===");

  M5.Lcd.setBrightness(80);
  leds_init();
  leds_set_color(COLOR_BLUE);

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

  M5.Lcd.fillScreen(TFT_BLACK);
  leds_off();
  delay(500);

  eyes.begin(50);
  eyes.setAutoblinker(true, 2, 4);
  eyes.setIdleMode(true, 3, 3);
  eyes.setCuriosity(true);

  leds_off();
  Serial.println("Listo!");
}

void loop() {
  M5.update();
  eyes.update();

  // --- Boton A: Push-to-talk ---
  if (M5.BtnA.wasPressed() && currentState == STATE_IDLE) {
    currentState = STATE_RECORDING;
    eyes.setMood(DEFAULT);
    eyes.setPosition(POS_CENTER);
    eyes.setIdleMode(false);
    leds_set_color(COLOR_GREEN);
    audio_start_recording();
  }

  // Soltar Boton A → dejar de grabar y procesar
  if (M5.BtnA.wasReleased() && currentState == STATE_RECORDING) {
    handle_talk();
  }

  // Flush audio a SD durante grabación
  if (currentState == STATE_RECORDING) {
    audio_flush_to_sd();
    static unsigned long lastRecBlink = 0;
    if (millis() - lastRecBlink > 500) {
      eyes.blink();
      lastRecBlink = millis();
    }
  }

  if (M5.BtnB.wasPressed() && currentState == STATE_IDLE) handle_repeat();
  if (M5.BtnC.wasPressed()) handle_emergency("boton");

  if (currentState != STATE_EMERGENCY && currentState == STATE_IDLE && imu_check_fall()) {
    handle_emergency("caida");
  }

  // Polling de notificaciones cada 15 segundos
  static unsigned long lastPoll = 0;
  if (currentState == STATE_IDLE && millis() - lastPoll > 15000) {
    lastPoll = millis();
    size_t notifSize = 0;
    if (check_notifications(&notifSize) && notifSize > 0) {
      currentState = STATE_PLAYING;
      eyes.setMood(DEFAULT);
      eyes.setPosition(POS_CENTER);
      leds_set_color(COLOR_YELLOW);

      lastAudioSize = notifSize;
      audio_play_mp3(nullptr, notifSize, updateEyesDuringPlayback);

      eyes.setMood(DEFAULT);
      eyes.setIdleMode(true, 3, 3);
      leds_off();
      currentState = STATE_IDLE;
    }
  }

  delay(5);
}

void updateEyesDuringPlayback() {
  eyes.update();
  M5.update();
}

void handle_talk() {
  size_t wav_size = 0;
  audio_stop_recording(&wav_size);

  if (wav_size == 0) {
    eyes.setMood(DEFAULT);
    eyes.setIdleMode(true);
    leds_off();
    currentState = STATE_IDLE;
    return;
  }

  currentState = STATE_PROCESSING;
  eyes.setMood(HAPPY);
  eyes.setPosition(POS_CENTER);
  eyes.setAutoblinker(true, 1, 2);
  eyes.setIdleMode(true, 1, 2);
  leds_set_color(COLOR_YELLOW);

  httpDone = false;
  httpSuccess = false;
  httpResponseSize = 0;

  static size_t taskParams[2];
  taskParams[0] = wav_size;
  taskParams[1] = 0;  // Ya no se usa, datos en SD

  xTaskCreatePinnedToCore(httpTask, "http", 8192, taskParams, 1, NULL, 0);

  while (!httpDone) {
    eyes.update();
    M5.update();
    delay(5);
  }

  eyes.setAutoblinker(true, 2, 4);

  if (!httpSuccess) {
    eyes.setMood(ANGRY);
    leds_set_color(COLOR_RED);
    delay(1500);
    eyes.setMood(DEFAULT);
    eyes.setIdleMode(true, 3, 3);
    leds_off();
    currentState = STATE_IDLE;
    return;
  }

  lastAudioSize = httpResponseSize;

  currentState = STATE_PLAYING;
  eyes.setMood(HAPPY);
  eyes.setPosition(POS_CENTER);
  eyes.setIdleMode(false);
  leds_set_color(COLOR_BLUE);

  audio_play_mp3(nullptr, httpResponseSize, updateEyesDuringPlayback);

  eyes.setMood(DEFAULT);
  eyes.setIdleMode(true, 3, 3);
  leds_off();
  currentState = STATE_IDLE;
}

void handle_repeat() {
  if (lastAudioSize == 0) return;

  currentState = STATE_PLAYING;
  eyes.setMood(HAPPY);
  leds_set_color(COLOR_BLUE);

  audio_play_mp3(nullptr, lastAudioSize, updateEyesDuringPlayback);

  eyes.setMood(DEFAULT);
  leds_off();
  currentState = STATE_IDLE;
}

void handle_emergency(const char* reason) {
  currentState = STATE_EMERGENCY;
  eyes.setColors(EVA_ALERT, EVA_BG);
  eyes.setMood(ANGRY);
  leds_set_color(COLOR_RED);

  send_emergency(reason);

  delay(3000);
  eyes.setColors(EVA_EYE, EVA_BG);
  eyes.setMood(DEFAULT);
  leds_off();
  currentState = STATE_IDLE;
}
