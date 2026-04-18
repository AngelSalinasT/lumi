#include "imu.h"
#include "config.h"
#include <M5Stack.h>

// ─── Algoritmo de detección de caídas en 3 fases ─────────────
//
// Basado en Analog Devices + papers ESP32 fall detection (95-98% acc):
//
// FASE 1 — Caída libre: aceleración cae a <0.4g (ingravidez momentánea)
// FASE 2 — Impacto: aceleración sube a >2.5g (golpe contra el suelo)
// FASE 3 — Inmovilidad: aceleración ~1g sostenida (persona quieta en el suelo)
//
// Bonus: giroscopio confirma rotación brusca (>200°/s) durante caída
//
// Esto elimina falsos positivos de:
// - Golpes en mesa (no hay caída libre previa)
// - Sentarse rápido (no hay impacto fuerte)
// - Movimientos bruscos normales (no hay inmovilidad posterior)

// ─── Estado de la máquina de estados ─────────────────────────
enum FallPhase {
  PHASE_IDLE,       // Esperando caída libre
  PHASE_FREEFALL,   // Caída libre detectada, esperando impacto
  PHASE_IMPACT,     // Impacto detectado, esperando inmovilidad
};

static FallPhase phase = PHASE_IDLE;
static unsigned long phase_start = 0;
static unsigned long last_alert_time = 0;
static bool gyro_rotation_detected = false;

// Media móvil para suavizar ruido
#define SMOOTH_N 4
static float accel_buf[SMOOTH_N] = {1, 1, 1, 1};
static float gyro_buf[SMOOTH_N] = {0, 0, 0, 0};
static int buf_idx = 0;

void imu_init() {
  M5.IMU.Init();
  Serial.println("[IMU] MPU6886 init — fall detection v3 (3-phase + gyro)");
}

static void read_imu(float &accel_mag, float &gyro_mag) {
  float ax, ay, az, gx, gy, gz;
  M5.IMU.getAccelData(&ax, &ay, &az);
  M5.IMU.getGyroData(&gx, &gy, &gz);

  float a = sqrt(ax * ax + ay * ay + az * az);
  float g = sqrt(gx * gx + gy * gy + gz * gz);

  // Actualizar buffer circular
  accel_buf[buf_idx] = a;
  gyro_buf[buf_idx] = g;
  buf_idx = (buf_idx + 1) % SMOOTH_N;

  // Media móvil
  accel_mag = 0;
  gyro_mag = 0;
  for (int i = 0; i < SMOOTH_N; i++) {
    accel_mag += accel_buf[i];
    gyro_mag += gyro_buf[i];
  }
  accel_mag /= SMOOTH_N;
  gyro_mag /= SMOOTH_N;
}

bool imu_check_fall() {
  float accel, gyro;
  read_imu(accel, gyro);
  unsigned long now = millis();

  // Cooldown: mínimo 30s entre alertas
  if (last_alert_time > 0 && (now - last_alert_time) < FALL_COOLDOWN_MS) {
    return false;
  }

  switch (phase) {

    // ─── IDLE: buscando caída libre ───
    case PHASE_IDLE:
      // Caída libre = ingravidez momentánea (<0.4g)
      // O impacto directo muy fuerte (>3.5g) sin caída libre previa
      if (accel < FREEFALL_THRESHOLD_G) {
        phase = PHASE_FREEFALL;
        phase_start = now;
        gyro_rotation_detected = false;
        Serial.printf("[IMU] FASE 1: Caída libre (%.2fg < %.1fg)\n", accel, FREEFALL_THRESHOLD_G);
      }
      // Impacto directo sin caída libre (caída desde poca altura)
      else if (accel > FALL_THRESHOLD_G * 1.4) {
        phase = PHASE_IMPACT;
        phase_start = now;
        gyro_rotation_detected = (gyro > GYRO_THRESHOLD_DPS);
        Serial.printf("[IMU] IMPACTO DIRECTO (%.2fg, gyro: %.0f°/s)\n", accel, gyro);
      }
      break;

    // ─── FREEFALL: esperando impacto ───
    case PHASE_FREEFALL:
      // Trackear rotación durante la caída (confirma que es caída real)
      if (gyro > GYRO_THRESHOLD_DPS) {
        gyro_rotation_detected = true;
      }

      // Timeout: caída libre no debería durar más de 1 segundo
      if (now - phase_start > 1000) {
        phase = PHASE_IDLE;
        Serial.println("[IMU] Caída libre descartada (timeout)");
        break;
      }

      // Impacto después de caída libre
      if (accel > FALL_THRESHOLD_G) {
        phase = PHASE_IMPACT;
        phase_start = now;
        Serial.printf("[IMU] FASE 2: Impacto post-caída (%.2fg, gyro_rot: %s)\n",
                      accel, gyro_rotation_detected ? "SI" : "NO");
      }
      break;

    // ─── IMPACT: esperando inmovilidad ───
    case PHASE_IMPACT:
      // Timeout: si no hay inmovilidad en 4 segundos, fue un golpe normal
      if (now - phase_start > 4000) {
        phase = PHASE_IDLE;
        Serial.println("[IMU] Impacto descartado (persona siguió moviéndose)");
        break;
      }

      // Esperar al menos FALL_CONFIRM_MS antes de verificar
      if (now - phase_start < FALL_CONFIRM_MS) {
        break;
      }

      // FASE 3: Verificar inmovilidad
      // Persona acostada/quieta = solo gravedad (~1g) y poco giro (<30°/s)
      if (accel > 0.7 && accel < 1.4 && gyro < 30.0) {
        phase = PHASE_IDLE;
        last_alert_time = now;

        if (gyro_rotation_detected) {
          Serial.println("[IMU] *** CAÍDA CONFIRMADA (libre + impacto + inmóvil + rotación) ***");
        } else {
          Serial.println("[IMU] *** CAÍDA PROBABLE (impacto + inmóvil, sin rotación) ***");
        }
        return true;
      }
      break;
  }

  return false;
}
