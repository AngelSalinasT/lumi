/*
 * RoboEyes adaptado para M5Stack (320x240) — estilo EVA Wall-E
 * Basado en TFT_RoboEyes de Youssef Tech / FluxGarage
 * Adaptado: colores azul-celeste, ojos más grandes, 320x240
 */

#ifndef _ROBO_EYES_H
#define _ROBO_EYES_H

#include <M5Stack.h>

#define DEFAULT   0
#define TIRED     1
#define ANGRY     2
#define HAPPY     3

#define ON  1
#define OFF 0

#define POS_N   1
#define POS_NE  2
#define POS_E   3
#define POS_SE  4
#define POS_S   5
#define POS_SW  6
#define POS_W   7
#define POS_NW  8
#define POS_CENTER 0

// Colores EVA
#define EVA_BG      TFT_BLACK
#define EVA_EYE     0x5E1F   // Azul celeste brillante
#define EVA_ALERT   0xF800   // Rojo emergencia

class RoboEyes {
  public:
    TFT_eSprite *sprite;

    int screenWidth = 320;
    int screenHeight = 240;
    uint16_t bgColor;
    uint16_t mainColor;

    int frameInterval;
    unsigned long fpsTimer;

    bool tired, angry, happy, curious, cyclops;
    bool eyeL_open, eyeR_open;

    int eyeLwidthDefault, eyeLheightDefault;
    int eyeLwidthCurrent, eyeLheightCurrent;
    int eyeLwidthNext, eyeLheightNext;
    int eyeLheightOffset;
    uint8_t eyeLborderRadiusDefault, eyeLborderRadiusCurrent, eyeLborderRadiusNext;

    int eyeRwidthDefault, eyeRheightDefault;
    int eyeRwidthCurrent, eyeRheightCurrent;
    int eyeRwidthNext, eyeRheightNext;
    int eyeRheightOffset;
    uint8_t eyeRborderRadiusDefault, eyeRborderRadiusCurrent, eyeRborderRadiusNext;

    int eyeLxDefault, eyeLyDefault;
    int eyeLx, eyeLy, eyeLxNext, eyeLyNext;

    int eyeRxDefault, eyeRyDefault;
    int eyeRx, eyeRy, eyeRxNext, eyeRyNext;

    uint8_t eyelidsHeightMax;
    uint8_t eyelidsTiredHeight, eyelidsTiredHeightNext;
    uint8_t eyelidsAngryHeight, eyelidsAngryHeightNext;
    uint8_t eyelidsHappyBottomOffsetMax;
    uint8_t eyelidsHappyBottomOffset, eyelidsHappyBottomOffsetNext;
    int spaceBetweenDefault, spaceBetweenCurrent, spaceBetweenNext;

    bool hFlicker, hFlickerAlternate;
    uint8_t hFlickerAmplitude;
    bool vFlicker, vFlickerAlternate;
    uint8_t vFlickerAmplitude;
    bool autoblinker;
    int blinkInterval, blinkIntervalVariation;
    unsigned long blinktimer;
    bool idleMode;
    int idleInterval, idleIntervalVariation;
    unsigned long idleAnimationTimer;
    bool confused;
    unsigned long confusedAnimationTimer;
    int confusedAnimationDuration;
    bool confusedToggle;
    bool laugh;
    unsigned long laughAnimationTimer;
    int laughAnimationDuration;
    bool laughToggle;

    bool blinkingActive;
    unsigned long blinkCloseDurationTimer;
    int blinkCloseDuration = 120;

    RoboEyes() {
      bgColor = EVA_BG;
      mainColor = EVA_EYE;

      frameInterval = 1000 / 50;
      fpsTimer = 0;

      tired = angry = happy = curious = cyclops = false;
      eyeL_open = eyeR_open = false;

      // Ojos estilo EVA: altos y ovalados (60x80)
      eyeLwidthDefault = 60;
      eyeLheightDefault = 80;
      eyeLwidthCurrent = eyeLwidthDefault;
      eyeLheightCurrent = 1;
      eyeLwidthNext = eyeLwidthDefault;
      eyeLheightNext = eyeLheightDefault;
      eyeLheightOffset = 0;
      eyeLborderRadiusDefault = 20;  // Muy redondeados
      eyeLborderRadiusCurrent = eyeLborderRadiusDefault;
      eyeLborderRadiusNext = eyeLborderRadiusDefault;

      eyeRwidthDefault = eyeLwidthDefault;
      eyeRheightDefault = eyeLheightDefault;
      eyeRwidthCurrent = eyeRwidthDefault;
      eyeRheightCurrent = 1;
      eyeRwidthNext = eyeRwidthDefault;
      eyeRheightNext = eyeRheightDefault;
      eyeRheightOffset = 0;
      eyeRborderRadiusDefault = eyeLborderRadiusDefault;
      eyeRborderRadiusCurrent = eyeRborderRadiusDefault;
      eyeRborderRadiusNext = eyeRborderRadiusDefault;

      spaceBetweenDefault = 30;
      spaceBetweenCurrent = spaceBetweenDefault;
      spaceBetweenNext = spaceBetweenDefault;

      eyeLxDefault = (screenWidth - (eyeLwidthDefault + spaceBetweenDefault + eyeRwidthDefault)) / 2;
      eyeLyDefault = (screenHeight - eyeLheightDefault) / 2;
      eyeLx = eyeLxDefault; eyeLy = eyeLyDefault;
      eyeLxNext = eyeLx; eyeLyNext = eyeLy;

      eyeRxDefault = eyeLxDefault + eyeLwidthDefault + spaceBetweenDefault;
      eyeRyDefault = eyeLyDefault;
      eyeRx = eyeRxDefault; eyeRy = eyeRyDefault;
      eyeRxNext = eyeRx; eyeRyNext = eyeRy;

      eyelidsHeightMax = eyeLheightDefault / 2;
      eyelidsTiredHeight = 0; eyelidsTiredHeightNext = 0;
      eyelidsAngryHeight = 0; eyelidsAngryHeightNext = 0;
      eyelidsHappyBottomOffsetMax = (eyeLheightDefault / 2) + 3;
      eyelidsHappyBottomOffset = 0; eyelidsHappyBottomOffsetNext = 0;

      hFlicker = false; hFlickerAlternate = false; hFlickerAmplitude = 2;
      vFlicker = false; vFlickerAlternate = false; vFlickerAmplitude = 10;
      autoblinker = false; blinkInterval = 2; blinkIntervalVariation = 4; blinktimer = 0;
      idleMode = false; idleInterval = 2; idleIntervalVariation = 3; idleAnimationTimer = 0;
      confused = false; confusedAnimationDuration = 500; confusedToggle = true;
      laugh = false; laughAnimationDuration = 500; laughToggle = true;
      blinkingActive = false; blinkCloseDurationTimer = 0;
    }

    void begin(byte frameRate = 50) {
      sprite = new TFT_eSprite(&M5.Lcd);
      sprite->setColorDepth(16);
      if (!sprite->createSprite(screenWidth, screenHeight)) {
        sprite->setColorDepth(8);
        sprite->createSprite(screenWidth, screenHeight);
      }
      sprite->fillSprite(bgColor);
      eyeLheightCurrent = 1;
      eyeRheightCurrent = 1;
      setFramerate(frameRate);
    }

    void update() {
      if (millis() - fpsTimer >= (unsigned long)frameInterval) {
        drawEyes();
        sprite->pushSprite(0, 0);
        fpsTimer = millis();
      }
    }

    void setFramerate(byte fps) { frameInterval = 1000 / fps; }

    void setWidth(int l, int r) { eyeLwidthNext = l; eyeRwidthNext = r; eyeLwidthDefault = l; eyeRwidthDefault = r; }
    void setHeight(int l, int r) { eyeLheightNext = l; eyeRheightNext = r; eyeLheightDefault = l; eyeRheightDefault = r; }
    void setBorderradius(uint8_t l, uint8_t r) { eyeLborderRadiusNext = l; eyeRborderRadiusNext = r; eyeLborderRadiusDefault = l; eyeRborderRadiusDefault = r; }
    void setSpacebetween(int s) { spaceBetweenNext = s; spaceBetweenDefault = s; }

    void setMood(uint8_t mood) {
      switch (mood) {
        case TIRED: tired = true; angry = false; happy = false; break;
        case ANGRY: tired = false; angry = true; happy = false; break;
        case HAPPY: tired = false; angry = false; happy = true; break;
        default:    tired = false; angry = false; happy = false; break;
      }
    }

    void setPosition(uint8_t pos) {
      switch (pos) {
        case POS_N:  eyeLxNext = getScreenConstraint_X()/2; eyeLyNext = 0; break;
        case POS_NE: eyeLxNext = getScreenConstraint_X(); eyeLyNext = 0; break;
        case POS_E:  eyeLxNext = getScreenConstraint_X(); eyeLyNext = getScreenConstraint_Y()/2; break;
        case POS_SE: eyeLxNext = getScreenConstraint_X(); eyeLyNext = getScreenConstraint_Y(); break;
        case POS_S:  eyeLxNext = getScreenConstraint_X()/2; eyeLyNext = getScreenConstraint_Y(); break;
        case POS_SW: eyeLxNext = 0; eyeLyNext = getScreenConstraint_Y(); break;
        case POS_W:  eyeLxNext = 0; eyeLyNext = getScreenConstraint_Y()/2; break;
        case POS_NW: eyeLxNext = 0; eyeLyNext = 0; break;
        default:     eyeLxNext = eyeLxDefault; eyeLyNext = eyeLyDefault; break;
      }
    }

    void setAutoblinker(bool active, int interval = 2, int variation = 4) {
      autoblinker = active;
      blinkInterval = interval;
      blinkIntervalVariation = variation;
      blinktimer = millis() + (blinkInterval * 1000UL) + (random(blinkIntervalVariation) * 1000UL);
      blinkingActive = false;
    }

    void setIdleMode(bool active, int interval = 2, int variation = 3) {
      idleMode = active;
      idleInterval = interval;
      idleIntervalVariation = variation;
    }

    void setCuriosity(bool c) { curious = c; }

    void setColors(uint16_t main, uint16_t bg) { mainColor = main; bgColor = bg; }

    void close() {
      eyeLheightNext = 1; eyeRheightNext = 1;
      eyeL_open = false; eyeR_open = false;
      eyeLborderRadiusNext = 0; eyeRborderRadiusNext = 0;
    }
    void open() {
      eyeL_open = true; eyeR_open = true;
      eyeLheightNext = eyeLheightDefault; eyeRheightNext = eyeRheightDefault;
      eyeLborderRadiusNext = eyeLborderRadiusDefault; eyeRborderRadiusNext = eyeRborderRadiusDefault;
    }
    void blink() { close(); open(); }

    void anim_confused() { confused = true; }
    void anim_laugh() { laugh = true; }

    int getScreenConstraint_X() { return screenWidth - eyeLwidthCurrent - spaceBetweenCurrent - eyeRwidthCurrent; }
    int getScreenConstraint_Y() { return screenHeight - eyeLheightDefault; }

  private:
    void drawEyes() {
      if (curious) {
        eyeLheightOffset = (eyeLxNext <= 10) ? 10 : 0;
        eyeRheightOffset = (eyeRxNext >= screenWidth - eyeRwidthCurrent - 10) ? 10 : 0;
      } else {
        eyeLheightOffset = 0; eyeRheightOffset = 0;
      }

      // Interpolación suave
      eyeLheightCurrent = (eyeLheightCurrent + eyeLheightNext + eyeLheightOffset) / 2;
      eyeLy += ((eyeLheightDefault - eyeLheightCurrent) / 2) - eyeLheightOffset / 2;
      eyeRheightCurrent = (eyeRheightCurrent + eyeRheightNext + eyeRheightOffset) / 2;
      eyeRy += ((eyeRheightDefault - eyeRheightCurrent) / 2) - eyeRheightOffset / 2;

      if (eyeL_open && eyeLheightCurrent <= 1 + eyeLheightOffset) eyeLheightNext = eyeLheightDefault;
      if (eyeR_open && eyeRheightCurrent <= 1 + eyeRheightOffset) eyeRheightNext = eyeRheightDefault;

      eyeLwidthCurrent = (eyeLwidthCurrent + eyeLwidthNext) / 2;
      eyeRwidthCurrent = (eyeRwidthCurrent + eyeRwidthNext) / 2;
      spaceBetweenCurrent = (spaceBetweenCurrent + spaceBetweenNext) / 2;

      eyeLx = (eyeLx + eyeLxNext) / 2;
      eyeLy = (eyeLy + eyeLyNext) / 2;
      eyeRxNext = eyeLxNext + eyeLwidthCurrent + spaceBetweenCurrent;
      eyeRyNext = eyeLyNext;
      eyeRx = (eyeRx + eyeRxNext) / 2;
      eyeRy = (eyeRy + eyeRyNext) / 2;
      eyeLborderRadiusCurrent = (eyeLborderRadiusCurrent + eyeLborderRadiusNext) / 2;
      eyeRborderRadiusCurrent = (eyeRborderRadiusCurrent + eyeRborderRadiusNext) / 2;

      // Auto blink
      if (autoblinker && !blinkingActive && millis() >= blinktimer) {
        close();
        blinkingActive = true;
        blinkCloseDurationTimer = millis() + blinkCloseDuration;
        blinktimer = millis() + (blinkInterval * 1000UL) + (random(blinkIntervalVariation) * 1000UL);
      }
      if (blinkingActive && millis() >= blinkCloseDurationTimer) {
        open(); blinkingActive = false;
      }

      // Laugh
      if (laugh) {
        if (laughToggle) { vFlicker = true; vFlickerAmplitude = 5; laughAnimationTimer = millis(); laughToggle = false; }
        else if (millis() >= laughAnimationTimer + laughAnimationDuration) { vFlicker = false; vFlickerAmplitude = 0; laughToggle = true; laugh = false; }
      }

      // Confused
      if (confused) {
        if (confusedToggle) { hFlicker = true; hFlickerAmplitude = 20; confusedAnimationTimer = millis(); confusedToggle = false; }
        else if (millis() >= confusedAnimationTimer + confusedAnimationDuration) { hFlicker = false; hFlickerAmplitude = 0; confusedToggle = true; confused = false; }
      }

      // Idle
      if (idleMode && millis() >= idleAnimationTimer) {
        eyeLxNext = random(getScreenConstraint_X());
        eyeLyNext = random(getScreenConstraint_Y());
        idleAnimationTimer = millis() + (idleInterval * 1000UL) + (random(idleIntervalVariation) * 1000UL);
      }

      // Flicker
      if (hFlicker) { int d = hFlickerAlternate ? hFlickerAmplitude : -hFlickerAmplitude; eyeLx += d; eyeRx += d; hFlickerAlternate = !hFlickerAlternate; }
      if (vFlicker) { int d = vFlickerAlternate ? vFlickerAmplitude : -vFlickerAmplitude; eyeLy += d; eyeRy += d; vFlickerAlternate = !vFlickerAlternate; }

      // Dibujar
      sprite->fillSprite(bgColor);
      sprite->fillRoundRect(eyeLx, eyeLy, eyeLwidthCurrent, eyeLheightCurrent, eyeLborderRadiusCurrent, mainColor);
      sprite->fillRoundRect(eyeRx, eyeRy, eyeRwidthCurrent, eyeRheightCurrent, eyeRborderRadiusCurrent, mainColor);

      // Mood overlays
      if (tired) { eyelidsTiredHeightNext = eyeLheightCurrent / 2; eyelidsAngryHeightNext = 0; }
      else { eyelidsTiredHeightNext = 0; }
      if (angry) { eyelidsAngryHeightNext = eyeLheightCurrent / 2; eyelidsTiredHeightNext = 0; }
      else { eyelidsAngryHeightNext = 0; }
      if (happy) { eyelidsHappyBottomOffsetNext = eyeLheightCurrent / 2; }
      else { eyelidsHappyBottomOffsetNext = 0; }

      // Tired eyelids
      eyelidsTiredHeight = (eyelidsTiredHeight + eyelidsTiredHeightNext) / 2;
      sprite->fillTriangle(eyeLx, eyeLy-1, eyeLx+eyeLwidthCurrent, eyeLy-1, eyeLx, eyeLy+eyelidsTiredHeight-1, bgColor);
      sprite->fillTriangle(eyeRx, eyeRy-1, eyeRx+eyeRwidthCurrent, eyeRy-1, eyeRx+eyeRwidthCurrent, eyeRy+eyelidsTiredHeight-1, bgColor);

      // Angry eyelids
      eyelidsAngryHeight = (eyelidsAngryHeight + eyelidsAngryHeightNext) / 2;
      sprite->fillTriangle(eyeLx, eyeLy-1, eyeLx+eyeLwidthCurrent, eyeLy-1, eyeLx+eyeLwidthCurrent, eyeLy+eyelidsAngryHeight-1, bgColor);
      sprite->fillTriangle(eyeRx, eyeRy-1, eyeRx+eyeRwidthCurrent, eyeRy-1, eyeRx, eyeRy+eyelidsAngryHeight-1, bgColor);

      // Happy bottom cut
      eyelidsHappyBottomOffset = (eyelidsHappyBottomOffset + eyelidsHappyBottomOffsetNext) / 2;
      sprite->fillRoundRect(eyeLx-1, (eyeLy+eyeLheightCurrent)-eyelidsHappyBottomOffset+1, eyeLwidthCurrent+2, eyeLheightDefault, eyeLborderRadiusCurrent, bgColor);
      sprite->fillRoundRect(eyeRx-1, (eyeRy+eyeRheightCurrent)-eyelidsHappyBottomOffset+1, eyeRwidthCurrent+2, eyeRheightDefault, eyeRborderRadiusCurrent, bgColor);
    }
};

#endif
