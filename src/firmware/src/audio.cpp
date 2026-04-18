#include "audio.h"
#include "config.h"
#include <M5Stack.h>
#include <driver/adc.h>
#include <driver/dac.h>
#include <SD.h>

// --- ulaw decode table ---
static const int16_t ulaw_table[256] = {
  -32124,-31100,-30076,-29052,-28028,-27004,-25980,-24956,
  -23932,-22908,-21884,-20860,-19836,-18812,-17788,-16764,
  -15996,-15484,-14972,-14460,-13948,-13436,-12924,-12412,
  -11900,-11388,-10876,-10364,-9852,-9340,-8828,-8316,
  -7932,-7676,-7420,-7164,-6908,-6652,-6396,-6140,
  -5884,-5628,-5372,-5116,-4860,-4604,-4348,-4092,
  -3900,-3772,-3644,-3516,-3388,-3260,-3132,-3004,
  -2876,-2748,-2620,-2492,-2364,-2236,-2108,-1980,
  -1884,-1820,-1756,-1692,-1628,-1564,-1500,-1436,
  -1372,-1308,-1244,-1180,-1116,-1052,-988,-924,
  -876,-844,-812,-780,-748,-716,-684,-652,
  -620,-588,-556,-524,-492,-460,-428,-396,
  -372,-356,-340,-324,-308,-292,-276,-260,
  -244,-228,-212,-196,-180,-164,-148,-132,
  -120,-112,-104,-96,-88,-80,-72,-64,
  -56,-48,-40,-32,-24,-16,-8,0,
  32124,31100,30076,29052,28028,27004,25980,24956,
  23932,22908,21884,20860,19836,18812,17788,16764,
  15996,15484,14972,14460,13948,13436,12924,12412,
  11900,11388,10876,10364,9852,9340,8828,8316,
  7932,7676,7420,7164,6908,6652,6396,6140,
  5884,5628,5372,5116,4860,4604,4348,4092,
  3900,3772,3644,3516,3388,3260,3132,3004,
  2876,2748,2620,2492,2364,2236,2108,1980,
  1884,1820,1756,1692,1628,1564,1500,1436,
  1372,1308,1244,1180,1116,1052,988,924,
  876,844,812,780,748,716,684,652,
  620,588,556,524,492,460,428,396,
  372,356,340,324,308,292,276,260,
  244,228,212,196,180,164,148,132,
  120,112,104,96,88,80,72,64,
  56,48,40,32,24,16,8,0
};

// --- Grabación ---
static uint8_t wavBuffer[WAV_HEADER_SIZE + (SAMPLE_RATE * RECORD_SECONDS * 2)];
static int16_t* sampleBuffer = (int16_t*)(wavBuffer + WAV_HEADER_SIZE);
static volatile uint32_t sampleIndex = 0;
static volatile bool recording = false;
static const uint32_t maxSamples = SAMPLE_RATE * RECORD_SECONDS;

static hw_timer_t* sampleTimer = NULL;

static void IRAM_ATTR onSampleTimer() {
  if (!recording || sampleIndex >= maxSamples) {
    recording = false;
    return;
  }
  int raw = adc1_get_raw(ADC1_CHANNEL_6);
  sampleBuffer[sampleIndex++] = (int16_t)((raw - 2048) * 16);
}

static void write_wav_header(uint8_t* buf, uint32_t data_size) {
  uint32_t file_size = data_size + WAV_HEADER_SIZE - 8;
  uint16_t channels = 1;
  uint16_t bits = SAMPLE_BITS;
  uint32_t rate = SAMPLE_RATE;
  uint32_t byte_rate = rate * channels * (bits / 8);
  uint16_t block_align = channels * (bits / 8);

  memcpy(buf, "RIFF", 4);
  memcpy(buf + 4, &file_size, 4);
  memcpy(buf + 8, "WAVE", 4);
  memcpy(buf + 12, "fmt ", 4);
  uint32_t fmt_size = 16;
  memcpy(buf + 16, &fmt_size, 4);
  uint16_t audio_format = 1;
  memcpy(buf + 20, &audio_format, 2);
  memcpy(buf + 22, &channels, 2);
  memcpy(buf + 24, &rate, 4);
  memcpy(buf + 28, &byte_rate, 4);
  memcpy(buf + 32, &block_align, 2);
  memcpy(buf + 34, &bits, 2);
  memcpy(buf + 36, "data", 4);
  memcpy(buf + 40, &data_size, 4);
}

void audio_init() {
  adc1_config_width(ADC_WIDTH_BIT_12);
  adc1_config_channel_atten(ADC1_CHANNEL_6, ADC_ATTEN_DB_11);
  Serial.printf("Audio init OK, heap: %d\n", ESP.getFreeHeap());
}

// --- Push-to-talk: iniciar grabación ---
void audio_start_recording() {
  sampleIndex = 0;
  recording = true;

  sampleTimer = timerBegin(0, 80, true);
  timerAttachInterrupt(sampleTimer, &onSampleTimer, true);
  timerAlarmWrite(sampleTimer, 1000000 / SAMPLE_RATE, true);
  timerAlarmEnable(sampleTimer);

  Serial.println("Grabando (push-to-talk)...");
}

// --- Push-to-talk: detener y retornar WAV ---
uint8_t* audio_stop_recording(size_t* out_size) {
  timerAlarmDisable(sampleTimer);
  timerDetachInterrupt(sampleTimer);
  timerEnd(sampleTimer);
  recording = false;

  uint32_t actualSamples = sampleIndex;
  if (actualSamples < 800) {  // Menos de 0.1 seg = no vale
    Serial.println("Grabacion muy corta, descartando");
    *out_size = 0;
    return nullptr;
  }

  uint32_t actualDataSize = actualSamples * 2;
  uint32_t actualTotalSize = WAV_HEADER_SIZE + actualDataSize;

  write_wav_header(wavBuffer, actualDataSize);

  Serial.printf("WAV: %d samples, %d bytes, heap: %d\n", actualSamples, actualTotalSize, ESP.getFreeHeap());
  *out_size = actualTotalSize;
  return wavBuffer;
}

// --- Reproducción ulaw desde SD con animación ---
static volatile const uint8_t* playPtr = NULL;
static volatile uint32_t playLen = 0;
static volatile uint32_t playPos = 0;

static hw_timer_t* playTimer = NULL;

static void IRAM_ATTR onPlayTimer() {
  if (playPos >= playLen) return;
  int16_t sample = ulaw_table[playPtr[playPos++]];
  uint8_t dacVal = (uint8_t)((sample + 32768) >> 8);
  dac_output_voltage(DAC_CHANNEL_1, dacVal);
}

bool audio_is_playing() {
  return playPos < playLen;
}

#define PLAY_CHUNK_SIZE 8000

void audio_play_mp3(const uint8_t* data, size_t size, PlaybackCallback onChunk) {
  File f = SD.open("/response.mp3", FILE_READ);
  if (!f) {
    Serial.println("Error abriendo audio de SD");
    return;
  }

  size_t audioSize = f.size();
  Serial.printf("Reproduciendo ulaw: %d bytes\n", audioSize);

  dac_output_enable(DAC_CHANNEL_1);

  size_t totalPlayed = 0;
  while (totalPlayed < audioSize) {
    size_t toRead = audioSize - totalPlayed;
    if (toRead > PLAY_CHUNK_SIZE) toRead = PLAY_CHUNK_SIZE;

    f.read(wavBuffer, toRead);

    playPtr = wavBuffer;
    playLen = toRead;
    playPos = 0;

    playTimer = timerBegin(1, 80, true);
    timerAttachInterrupt(playTimer, &onPlayTimer, true);
    timerAlarmWrite(playTimer, 125, true);
    timerAlarmEnable(playTimer);

    while (playPos < playLen) {
      if (onChunk) onChunk();  // Callback para animar ojos
      delay(5);
    }

    timerAlarmDisable(playTimer);
    timerDetachInterrupt(playTimer);
    timerEnd(playTimer);

    totalPlayed += toRead;
  }

  f.close();
  dac_output_voltage(DAC_CHANNEL_1, 0);
  dac_output_disable(DAC_CHANNEL_1);
  Serial.println("Reproduccion completa");
}
