#ifndef EVA_FACE_H
#define EVA_FACE_H

#include <M5Stack.h>

// --- Expresiones ---
enum EvaExpression {
  EVA_NEUTRAL,      // Ojos normales ovalados
  EVA_HAPPY,        // Ojos curvados abajo (sonrisa)
  EVA_SAD,          // Ojos inclinados hacia adentro
  EVA_LISTENING,    // Ojos un poco más abiertos, brillantes
  EVA_THINKING,     // Ojos entrecerrados, mirando arriba
  EVA_TALKING,      // Ojos normales + boca animada
  EVA_ANGRY,        // Ojos inclinados hacia afuera (ceño)
  EVA_LOVE,         // Ojos en forma de corazón ❤️
  EVA_ALERT,        // Ojos grandes, rojos
  EVA_SLEEPING      // Ojos como líneas horizontales
};

// --- Colores EVA ---
#define EVA_BG        TFT_BLACK
#define EVA_EYE_COLOR 0x5E1F   // Azul-celeste brillante (como EVA)
#define EVA_EYE_GLOW  0x7FFF   // Blanco-azulado para brillo
#define EVA_EYE_DIM   0x2C0F   // Azul más oscuro para sombra
#define EVA_RED       0xF800   // Rojo para emergencia
#define EVA_MOUTH_COLOR 0x5E1F

// --- API ---
void eva_init();
void eva_set_expression(EvaExpression expr);
void eva_update();  // Llamar en loop para animaciones
void eva_set_talking(bool talking);

#endif
