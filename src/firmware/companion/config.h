#ifndef CONFIG_H
#define CONFIG_H

// --- WiFi ---
#define WIFI_SSID     "Totalplay-3C9F"
#define WIFI_PASSWORD "3C9FA0A6my3NTs2Q"

// --- Backend ---
#define BACKEND_URL   "http://192.168.100.99:8000"
#define DEVICE_ID     "m5go_001"

// --- Audio Recording ---
#define SAMPLE_RATE   8000
#define SAMPLE_BITS   16
#define RECORD_SECONDS 6
#define MIC_PIN       34

// Buffer: 8000 Hz × 2 bytes × 6 seg = 96KB
#define WAV_BUFFER_SIZE (SAMPLE_RATE * (SAMPLE_BITS / 8) * RECORD_SECONDS)
#define WAV_HEADER_SIZE 44

// --- IMU (detección de caídas — algoritmo 3 fases) ---
// Fase 1: Caída libre (ingravidez)
#define FREEFALL_THRESHOLD_G  0.4   // <0.4g = caída libre
// Fase 2: Impacto
#define FALL_THRESHOLD_G      2.5   // >2.5g = impacto con suelo
// Fase 3: Inmovilidad post-caída
#define FALL_CONFIRM_MS       1500  // Esperar 1.5s antes de verificar quietud
// Giroscopio: rotación durante caída
#define GYRO_THRESHOLD_DPS    200.0 // >200°/s = rotación de caída
// Cooldown entre alertas
#define FALL_COOLDOWN_MS      30000 // 30 segundos

// --- LEDs ---
#define NUM_LEDS    10
#define LED_PIN     15

// Colores LED
#define COLOR_GREEN  0x00FF00
#define COLOR_RED    0xFF0000
#define COLOR_BLUE   0x0000FF
#define COLOR_YELLOW 0xFFFF00
#define COLOR_OFF    0x000000

#endif
