# M5GO v2.7 — Referencia de Hardware

## Specs principales
| Spec | Valor |
|------|-------|
| SoC | ESP32-D0WDQ6-V3, dual-core 240MHz |
| SRAM | 520KB |
| Flash | 16MB |
| WiFi | 2.4GHz 802.11 b/g/n |
| Display | 2" IPS 320x240, ILI9342C, 853nit |
| Batería | 500mAh @ 3.7V |
| Tamaño | 54x54x28.6mm, 87.7g |

## Pines clave
| Componente | Pin | Tipo |
|-----------|-----|------|
| Micrófono BSE3729 | GPIO34 | ADC analógico (ADC1_CH6) |
| Speaker | GPIO25 | DAC interno |
| Botón A | GPIO39 | Digital (activo bajo) |
| Botón B | GPIO38 | Digital (activo bajo) |
| Botón C | GPIO37 | Digital (activo bajo) |
| IMU MPU6886 | I2C (SDA=21, SCL=22) | 6-axis |
| LEDs SK6812 x10 | GPIO15 | NeoPixel RGB |
| LCD CS | GPIO14 | SPI |
| LCD RST | GPIO33 | SPI |
| LCD DC | GPIO27 | SPI |
| LCD SCK | GPIO18 | SPI |
| LCD MOSI | GPIO23 | SPI |
| SD CS | GPIO4 | SPI |

## Micrófono
- **Tipo:** Analógico BSE3729
- **Pin:** GPIO34 (ADC1_CHANNEL_6)
- **Lectura:** `adc1_get_raw(ADC1_CHANNEL_6)` — 12-bit (0-4095)
- **Atenuación:** ADC_ATTEN_DB_11 para rango completo
- **Sample rate recomendado:** 8000-22050 Hz via hw_timer
- **Nivel DC:** ~2048 (mitad del rango ADC)
- **Amplificación:** Los samples crudos son muy bajos, multiplicar x8-x16

## Speaker
- **Pin:** GPIO25 (DAC interno del ESP32)
- **Método:** AudioOutputI2S con INTERNAL_DAC
- **Formatos soportados:** MP3 (via ESP8266Audio), WAV

## IMU MPU6886
- **Bus:** I2C en SDA=21, SCL=22
- **Init:** `M5.IMU.Init()`
- **Acelerómetro:** `M5.IMU.getAccelData(&ax, &ay, &az)` en G
- **Detección de caída:** Umbral típico >= 2.5G

## LEDs SK6812
- **Cantidad:** 10 LEDs RGB en la base M5GO
- **Pin datos:** GPIO15
- **Librería:** Adafruit NeoPixel o FastLED
- **Nota:** Brillo bajo (30-50) recomendado para no molestar

## Botones
- Todos son activo-bajo con pull-up interno
- M5Stack library: `M5.BtnA.wasPressed()`, etc.
- Botón A = izquierdo, B = centro, C = derecho

## Puertos
- **Port A (rojo):** I2C (GPIO21/22)
- **Port B (negro):** GPIO (GPIO36/26)
- **Port C (azul):** UART (GPIO16/17)

## Grabación de audio — método correcto
```cpp
#include <driver/adc.h>
#include <driver/timer.h>

// Init
adc1_config_width(ADC_WIDTH_BIT_12);
adc1_config_channel_atten(ADC1_CHANNEL_6, ADC_ATTEN_DB_11);

// En ISR del timer (a SAMPLE_RATE Hz):
int raw = adc1_get_raw(ADC1_CHANNEL_6);
sample = (int16_t)((raw - 2048) * 16); // Centrar + amplificar
```

## Reproducción de MP3
```cpp
#include <AudioFileSourcePROGMEM.h>
#include <AudioGeneratorMP3.h>
#include <AudioOutputI2S.h>

AudioGeneratorMP3 *mp3 = new AudioGeneratorMP3();
AudioFileSourcePROGMEM *src = new AudioFileSourcePROGMEM(data, size);
AudioOutputI2S *out = new AudioOutputI2S(0, AudioOutputI2S::INTERNAL_DAC);
out->SetGain(0.8);
mp3->begin(src, out);
while (mp3->isRunning()) { if (!mp3->loop()) mp3->stop(); }
```
