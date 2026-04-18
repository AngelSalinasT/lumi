#ifndef LEDS_H
#define LEDS_H

#include <stdint.h>

void leds_init();
void leds_set_color(uint32_t color);
void leds_off();

#endif
