#include "imu.h"
#include "config.h"
#include <M5Stack.h>

static bool fallDetected = false;
static unsigned long fallTime = 0;

void imu_init() {
  M5.IMU.Init();
  Serial.println("IMU MPU6886 inicializado");
}

bool imu_check_fall() {
  float ax, ay, az;
  M5.IMU.getAccelData(&ax, &ay, &az);
  float magnitude = sqrt(ax * ax + ay * ay + az * az);

  if (!fallDetected) {
    // Fase 1: detectar impacto fuerte (>4G)
    if (magnitude > FALL_THRESHOLD_G) {
      Serial.printf("IMU: impacto %.2fG detectado, verificando...\n", magnitude);
      fallDetected = true;
      fallTime = millis();
    }
    return false;
  }

  // Fase 2: después del impacto, esperar 1 segundo y verificar que
  // la persona quedó quieta (magnitud cerca de 1G = acostado/inmóvil)
  if (millis() - fallTime > 1000) {
    fallDetected = false;
    if (magnitude < 1.3) {
      // Quietud después de impacto = caída confirmada
      Serial.printf("IMU: caída confirmada (quietud: %.2fG)\n", magnitude);
      return true;
    }
    // Se movió después del impacto = no fue caída (solo sacudida)
    Serial.println("IMU: falsa alarma, sigue en movimiento");
    return false;
  }

  return false;
}
