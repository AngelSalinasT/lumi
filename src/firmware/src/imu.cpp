#include "imu.h"
#include "config.h"
#include <M5Stack.h>

// Estados del detector de caídas
enum FallState { FALL_IDLE, FALL_FREEFALL, FALL_IMPACT, FALL_CONFIRM };
static FallState state = FALL_IDLE;
static unsigned long stateTime = 0;
static unsigned long lastFallAlert = 0;

void imu_init() {
  M5.IMU.Init();
  Serial.println("IMU MPU6886 inicializado");
}

bool imu_check_fall() {
  // Cooldown entre alertas
  if (lastFallAlert > 0 && millis() - lastFallAlert < FALL_COOLDOWN_MS) return false;

  float ax, ay, az, gx, gy, gz;
  M5.IMU.getAccelData(&ax, &ay, &az);
  M5.IMU.getGyroData(&gx, &gy, &gz);
  float accel = sqrt(ax * ax + ay * ay + az * az);
  float gyro = sqrt(gx * gx + gy * gy + gz * gz);

  switch (state) {
    case FALL_IDLE:
      // Fase 1: caída libre — momento de ingravidez (<0.4G)
      if (accel < FREEFALL_THRESHOLD_G) {
        state = FALL_FREEFALL;
        stateTime = millis();
        Serial.printf("IMU: caída libre detectada (%.2fG)\n", accel);
      }
      break;

    case FALL_FREEFALL:
      // Timeout: la caída libre no dura más de 500ms
      if (millis() - stateTime > 500) {
        state = FALL_IDLE;
        break;
      }
      // Fase 2: impacto fuerte después de caída libre
      if (accel > FALL_THRESHOLD_G) {
        state = FALL_IMPACT;
        stateTime = millis();
        Serial.printf("IMU: impacto %.2fG tras caída libre\n", accel);
      }
      break;

    case FALL_IMPACT:
      // Fase 3: verificar quietud durante FALL_CONFIRM_MS
      if (millis() - stateTime > FALL_CONFIRM_MS) {
        // Persona inmóvil (accel ~1G, poca rotación) = caída confirmada
        if (accel > 0.7 && accel < 1.4 && gyro < GYRO_THRESHOLD_DPS) {
          state = FALL_IDLE;
          lastFallAlert = millis();
          Serial.printf("IMU: CAIDA CONFIRMADA (accel=%.2fG, gyro=%.1f)\n", accel, gyro);
          return true;
        }
        // Se movió = falsa alarma
        Serial.println("IMU: falsa alarma, movimiento detectado");
        state = FALL_IDLE;
      }
      break;

    default:
      state = FALL_IDLE;
      break;
  }

  return false;
}
