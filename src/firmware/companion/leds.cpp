#include "leds.h"
#include "config.h"
#include <M5Stack.h>
#include <Adafruit_NeoPixel.h>

static Adafruit_NeoPixel strip(NUM_LEDS, LED_PIN, NEO_GRB + NEO_KHZ800);

void leds_init() {
  strip.begin();
  strip.setBrightness(30); // Brillo bajo para no molestar
  strip.show();
}

void leds_set_color(uint32_t color) {
  uint8_t r = (color >> 16) & 0xFF;
  uint8_t g = (color >> 8) & 0xFF;
  uint8_t b = color & 0xFF;

  for (int i = 0; i < NUM_LEDS; i++) {
    strip.setPixelColor(i, strip.Color(r, g, b));
  }
  strip.show();
}

void leds_off() {
  leds_set_color(COLOR_OFF);
}
