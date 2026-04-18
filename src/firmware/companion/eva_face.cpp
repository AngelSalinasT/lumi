#include "eva_face.h"
#include <M5Stack.h>

// --- Pantalla: 320x240 ---
#define SCR_W 320
#define SCR_H 240

// --- Geometría de ojos ---
#define EYE_W       50    // Ancho del ojo
#define EYE_H       70    // Alto del ojo (más alto que ancho = estilo EVA)
#define EYE_SPACING 30    // Espacio entre ojos
#define EYE_Y       105   // Centro Y de los ojos

// Centros de cada ojo
#define LEFT_EYE_X  (SCR_W / 2 - EYE_SPACING / 2 - EYE_W / 2)
#define RIGHT_EYE_X (SCR_W / 2 + EYE_SPACING / 2 + EYE_W / 2)

// --- Estado interno ---
static EvaExpression currentExpr = EVA_NEUTRAL;
static EvaExpression targetExpr = EVA_NEUTRAL;

// Parpadeo
static unsigned long lastBlinkTime = 0;
static unsigned long blinkInterval = 3000;  // Parpadea cada 3-5 seg
static bool isBlinking = false;
static int blinkFrame = 0;
#define BLINK_FRAMES 6

// Movimiento de pupilas
static float pupilOffsetX = 0;
static float pupilOffsetY = 0;
static float targetPupilX = 0;
static float targetPupilY = 0;
static unsigned long lastPupilMove = 0;

// Boca (para hablar)
static bool isTalking = false;
static int mouthFrame = 0;
static unsigned long lastMouthFrame = 0;

// Sprite para double buffering (sin parpadeo)
static TFT_eSprite sprite(&M5.Lcd);
static bool spriteCreated = false;

// --- Funciones de dibujo ---

static void drawEllipse(TFT_eSprite &spr, int cx, int cy, int rx, int ry, uint16_t color) {
  spr.fillEllipse(cx, cy, rx, ry, color);
}

// Dibuja un ojo estilo EVA con brillo
static void drawEvaEye(TFT_eSprite &spr, int cx, int cy, int w, int h,
                       uint16_t color, uint16_t glowColor, float pupilX, float pupilY) {
  // Sombra/glow exterior (más grande, más oscuro)
  drawEllipse(spr, cx, cy, w / 2 + 4, h / 2 + 4, EVA_EYE_DIM);

  // Ojo principal
  drawEllipse(spr, cx, cy, w / 2, h / 2, color);

  // Brillo superior (reflejo de luz)
  int glowX = cx - w / 6 + (int)(pupilX * 2);
  int glowY = cy - h / 4 + (int)(pupilY * 2);
  drawEllipse(spr, glowX, glowY, w / 6, h / 6, glowColor);

  // Brillo pequeño (punto de luz)
  drawEllipse(spr, glowX + w / 8, glowY + h / 8, 3, 3, TFT_WHITE);
}

// Ojo parpadeando (se cierra verticalmente)
static void drawEvaEyeBlink(TFT_eSprite &spr, int cx, int cy, int w, int h,
                            int blinkProgress, uint16_t color) {
  // blinkProgress: 0 = abierto, BLINK_FRAMES = cerrado
  float closeFactor = (float)blinkProgress / BLINK_FRAMES;
  int currentH = h * (1.0 - closeFactor);
  if (currentH < 4) currentH = 4;  // Línea mínima cuando está cerrado

  drawEllipse(spr, cx, cy, w / 2, currentH / 2, color);

  // Sin brillo cuando está muy cerrado
  if (closeFactor < 0.5) {
    int glowX = cx - w / 6;
    int glowY = cy - currentH / 4;
    drawEllipse(spr, glowX, glowY, w / 6, currentH / 6, EVA_EYE_GLOW);
  }
}

// Ojos felices (curvados abajo, como sonrisa)
static void drawHappyEye(TFT_eSprite &spr, int cx, int cy, int w, int h, uint16_t color) {
  // Dibujar ojo completo
  drawEllipse(spr, cx, cy, w / 2, h / 2, color);
  // Cortar la mitad inferior para hacer forma de "n" invertida
  spr.fillRect(cx - w / 2 - 2, cy + 2, w + 4, h / 2 + 6, EVA_BG);
  // Brillo
  drawEllipse(spr, cx - w / 6, cy - h / 6, w / 6, h / 8, EVA_EYE_GLOW);
}

// Ojos tristes (inclinados)
static void drawSadEye(TFT_eSprite &spr, int cx, int cy, int w, int h,
                       bool isLeft, uint16_t color) {
  drawEllipse(spr, cx, cy, w / 2, h / 2, color);
  // Cortar diagonal superior para crear efecto triste
  int tiltDir = isLeft ? 1 : -1;
  for (int i = 0; i < h / 3; i++) {
    int lineY = cy - h / 2 + i;
    int cutStart = isLeft ? (cx - w / 2) : (cx + w / 2 - i * tiltDir);
    spr.drawFastHLine(cx + tiltDir * (w / 4 - i), lineY, w / 4 + i, EVA_BG);
  }
}

// Ojos pensando (entrecerrados, mirando arriba)
static void drawThinkingEye(TFT_eSprite &spr, int cx, int cy, int w, int h, uint16_t color) {
  int squintH = h * 0.5;
  drawEllipse(spr, cx, cy + 5, w / 2, squintH / 2, color);
  // Brillo arriba
  drawEllipse(spr, cx - w / 6, cy - squintH / 6 + 5, w / 8, squintH / 8, EVA_EYE_GLOW);
}

// Ojos de alerta (grandes, rojos)
static void drawAlertEye(TFT_eSprite &spr, int cx, int cy, int w, int h) {
  drawEllipse(spr, cx, cy, w / 2 + 8, h / 2 + 8, EVA_RED);
  drawEllipse(spr, cx, cy, w / 2 + 4, h / 2 + 4, 0xFBE0); // Naranja
  // Signo de exclamación
  spr.fillRect(cx - 3, cy - h / 4, 6, h / 3, EVA_BG);
  spr.fillCircle(cx, cy + h / 6, 4, EVA_BG);
}

// Ojos dormidos (líneas horizontales)
static void drawSleepingEye(TFT_eSprite &spr, int cx, int cy, int w, uint16_t color) {
  spr.drawFastHLine(cx - w / 2, cy, w, color);
  spr.drawFastHLine(cx - w / 2, cy - 1, w, color);
  spr.drawFastHLine(cx - w / 2, cy + 1, w, color);
}

// Boca simple (línea que se abre al hablar)
static void drawMouth(TFT_eSprite &spr, int mouthOpenness) {
  int mouthY = EYE_Y + EYE_H / 2 + 25;
  int mouthW = 30;
  int cx = SCR_W / 2;

  if (mouthOpenness <= 0) {
    // Boca cerrada — línea simple
    spr.drawFastHLine(cx - mouthW / 2, mouthY, mouthW, EVA_MOUTH_COLOR);
  } else {
    // Boca abierta — óvalo
    int openH = mouthOpenness * 3;
    if (openH > 15) openH = 15;
    drawEllipse(spr, cx, mouthY, mouthW / 2, openH, EVA_MOUTH_COLOR);
    // Interior oscuro
    if (openH > 4) {
      drawEllipse(spr, cx, mouthY, mouthW / 2 - 3, openH - 3, EVA_BG);
    }
  }
}

// --- Renderizado principal ---

static void renderFrame() {
  if (!spriteCreated) return;

  sprite.fillSprite(EVA_BG);

  // Actualizar pupilas (movimiento suave)
  pupilOffsetX += (targetPupilX - pupilOffsetX) * 0.15;
  pupilOffsetY += (targetPupilY - pupilOffsetY) * 0.15;

  uint16_t eyeColor = EVA_EYE_COLOR;

  // --- Dibujar según expresión ---
  if (isBlinking) {
    drawEvaEyeBlink(sprite, LEFT_EYE_X, EYE_Y, EYE_W, EYE_H, blinkFrame, eyeColor);
    drawEvaEyeBlink(sprite, RIGHT_EYE_X, EYE_Y, EYE_W, EYE_H, blinkFrame, eyeColor);
  } else {
    switch (currentExpr) {
      case EVA_NEUTRAL:
      case EVA_LISTENING:
      case EVA_TALKING: {
        int w = (currentExpr == EVA_LISTENING) ? EYE_W + 6 : EYE_W;
        int h = (currentExpr == EVA_LISTENING) ? EYE_H + 6 : EYE_H;
        drawEvaEye(sprite, LEFT_EYE_X, EYE_Y, w, h, eyeColor, EVA_EYE_GLOW, pupilOffsetX, pupilOffsetY);
        drawEvaEye(sprite, RIGHT_EYE_X, EYE_Y, w, h, eyeColor, EVA_EYE_GLOW, pupilOffsetX, pupilOffsetY);
        break;
      }
      case EVA_HAPPY:
        drawHappyEye(sprite, LEFT_EYE_X, EYE_Y, EYE_W, EYE_H, eyeColor);
        drawHappyEye(sprite, RIGHT_EYE_X, EYE_Y, EYE_W, EYE_H, eyeColor);
        break;

      case EVA_SAD:
        drawSadEye(sprite, LEFT_EYE_X, EYE_Y, EYE_W, EYE_H, true, eyeColor);
        drawSadEye(sprite, RIGHT_EYE_X, EYE_Y, EYE_W, EYE_H, false, eyeColor);
        break;

      case EVA_THINKING:
        drawThinkingEye(sprite, LEFT_EYE_X, EYE_Y - 10, EYE_W, EYE_H, eyeColor);
        drawThinkingEye(sprite, RIGHT_EYE_X, EYE_Y - 10, EYE_W, EYE_H, eyeColor);
        break;

      case EVA_ANGRY:
        drawSadEye(sprite, LEFT_EYE_X, EYE_Y, EYE_W, EYE_H, false, eyeColor);
        drawSadEye(sprite, RIGHT_EYE_X, EYE_Y, EYE_W, EYE_H, true, eyeColor);
        break;

      case EVA_ALERT:
        drawAlertEye(sprite, LEFT_EYE_X, EYE_Y, EYE_W, EYE_H);
        drawAlertEye(sprite, RIGHT_EYE_X, EYE_Y, EYE_W, EYE_H);
        break;

      case EVA_SLEEPING:
        drawSleepingEye(sprite, LEFT_EYE_X, EYE_Y, EYE_W, eyeColor);
        drawSleepingEye(sprite, RIGHT_EYE_X, EYE_Y, EYE_W, eyeColor);
        break;

      case EVA_LOVE:
        // Corazones en vez de ojos
        drawEllipse(sprite, LEFT_EYE_X, EYE_Y, EYE_W / 2, EYE_H / 2, 0xF800);
        drawEllipse(sprite, RIGHT_EYE_X, EYE_Y, EYE_W / 2, EYE_H / 2, 0xF800);
        break;
    }
  }

  // Boca (solo si habla o es neutral)
  if (isTalking) {
    drawMouth(sprite, mouthFrame);
  }

  // Push sprite a pantalla (sin parpadeo)
  sprite.pushSprite(0, 0);
}

// --- Animación de parpadeo ---
static void updateBlink() {
  unsigned long now = millis();

  if (!isBlinking) {
    if (now - lastBlinkTime > blinkInterval) {
      isBlinking = true;
      blinkFrame = 0;
      lastBlinkTime = now;
      blinkInterval = 2500 + random(3000);  // 2.5-5.5 seg entre parpadeos
    }
  } else {
    if (blinkFrame < BLINK_FRAMES) {
      blinkFrame++;  // Cerrando
    } else if (blinkFrame < BLINK_FRAMES * 2) {
      blinkFrame++;  // Abriendo
    } else {
      isBlinking = false;
      blinkFrame = 0;
    }
  }
}

// --- Movimiento aleatorio de pupilas ---
static void updatePupils() {
  unsigned long now = millis();
  if (now - lastPupilMove > 2000 + random(3000)) {
    targetPupilX = random(-8, 9);
    targetPupilY = random(-5, 6);
    lastPupilMove = now;
  }
}

// --- Animación de boca ---
static void updateMouth() {
  if (!isTalking) {
    mouthFrame = 0;
    return;
  }
  unsigned long now = millis();
  if (now - lastMouthFrame > 100) {
    mouthFrame = random(0, 6);  // Apertura aleatoria para simular habla
    lastMouthFrame = now;
  }
}

// --- API pública ---

void eva_init() {
  M5.Lcd.fillScreen(EVA_BG);

  // Crear sprite del tamaño de la pantalla para double buffering
  sprite.setColorDepth(16);
  spriteCreated = sprite.createSprite(SCR_W, SCR_H);

  if (!spriteCreated) {
    // Si no hay suficiente RAM, intentar con 8 bits
    sprite.setColorDepth(8);
    spriteCreated = sprite.createSprite(SCR_W, SCR_H);
  }

  if (spriteCreated) {
    Serial.println("EVA face: sprite creado OK");
  } else {
    Serial.println("EVA face: ERROR creando sprite, usando LCD directo");
  }

  lastBlinkTime = millis();
  lastPupilMove = millis();

  renderFrame();
}

void eva_set_expression(EvaExpression expr) {
  targetExpr = expr;
  currentExpr = expr;

  // Resetear pupilas según expresión
  if (expr == EVA_THINKING) {
    targetPupilX = 0;
    targetPupilY = -6;  // Mirar arriba
  } else if (expr == EVA_ALERT) {
    targetPupilX = 0;
    targetPupilY = 0;
  }
}

void eva_set_talking(bool talking) {
  isTalking = talking;
  if (!talking) mouthFrame = 0;
}

void eva_update() {
  updateBlink();
  updatePupils();
  updateMouth();
  renderFrame();
}
