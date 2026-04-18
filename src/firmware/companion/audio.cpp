#include "audio.h"
#include "config.h"
#include <M5Stack.h>
#include <driver/i2s.h>

// I2S config para micrófono
#define I2S_MIC_PORT    I2S_NUM_0
#define I2S_MIC_BCK     12
#define I2S_MIC_WS      0
#define I2S_MIC_DATA_IN 34

// I2S config para speaker
#define I2S_SPK_PORT    I2S_NUM_1
#define I2S_SPK_BCK     12
#define I2S_SPK_WS      0
#define I2S_SPK_DATA_OUT 25

static bool i2s_mic_installed = false;
static bool i2s_spk_installed = false;

// --- WAV Header ---
static void write_wav_header(uint8_t* buf, uint32_t data_size) {
  uint32_t file_size = data_size + WAV_HEADER_SIZE - 8;
  uint16_t channels = 1;
  uint16_t bits = SAMPLE_BITS;
  uint32_t rate = SAMPLE_RATE;
  uint32_t byte_rate = rate * channels * (bits / 8);
  uint16_t block_align = channels * (bits / 8);

  // RIFF header
  memcpy(buf, "RIFF", 4);
  memcpy(buf + 4, &file_size, 4);
  memcpy(buf + 8, "WAVE", 4);

  // fmt chunk
  memcpy(buf + 12, "fmt ", 4);
  uint32_t fmt_size = 16;
  memcpy(buf + 16, &fmt_size, 4);
  uint16_t audio_format = 1; // PCM
  memcpy(buf + 20, &audio_format, 2);
  memcpy(buf + 22, &channels, 2);
  memcpy(buf + 24, &rate, 4);
  memcpy(buf + 28, &byte_rate, 4);
  memcpy(buf + 32, &block_align, 2);
  memcpy(buf + 34, &bits, 2);

  // data chunk
  memcpy(buf + 36, "data", 4);
  memcpy(buf + 40, &data_size, 4);
}

// --- Init ---
void audio_init() {
  Serial.println("Audio init");
}

static void i2s_mic_init() {
  if (i2s_mic_installed) return;

  i2s_config_t i2s_config = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX | I2S_MODE_PDM),
    .sample_rate = SAMPLE_RATE,
    .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
    .channel_format = I2S_CHANNEL_FMT_ONLY_RIGHT,
    .communication_format = I2S_COMM_FORMAT_STAND_I2S,
    .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
    .dma_buf_count = 4,
    .dma_buf_len = 1024,
    .use_apll = false,
    .tx_desc_auto_clear = false,
    .fixed_mclk = 0,
  };

  i2s_pin_config_t pin_config = {
    .bck_io_num = I2S_PIN_NO_CHANGE,
    .ws_io_num = GPIO_NUM_0,
    .data_out_num = I2S_PIN_NO_CHANGE,
    .data_in_num = GPIO_NUM_34,
  };

  i2s_driver_install(I2S_MIC_PORT, &i2s_config, 0, NULL);
  i2s_set_pin(I2S_MIC_PORT, &pin_config);
  i2s_set_clk(I2S_MIC_PORT, SAMPLE_RATE, I2S_BITS_PER_SAMPLE_16BIT, I2S_CHANNEL_MONO);
  i2s_mic_installed = true;
}

static void i2s_mic_deinit() {
  if (!i2s_mic_installed) return;
  i2s_driver_uninstall(I2S_MIC_PORT);
  i2s_mic_installed = false;
}

// --- Grabación ---
uint8_t* audio_record(size_t* out_size) {
  uint32_t data_size = WAV_BUFFER_SIZE;
  uint32_t total_size = WAV_HEADER_SIZE + data_size;

  uint8_t* wav_buf = (uint8_t*)ps_malloc(total_size);
  if (!wav_buf) {
    wav_buf = (uint8_t*)malloc(total_size);
  }
  if (!wav_buf) {
    Serial.println("Error: no hay memoria para WAV");
    *out_size = 0;
    return nullptr;
  }

  write_wav_header(wav_buf, data_size);

  i2s_mic_init();

  // Leer muestras del micrófono
  size_t bytes_read = 0;
  size_t offset = WAV_HEADER_SIZE;
  size_t remaining = data_size;

  Serial.printf("Grabando %d segundos...\n", RECORD_SECONDS);

  while (remaining > 0) {
    size_t to_read = (remaining > 1024) ? 1024 : remaining;
    i2s_read(I2S_MIC_PORT, wav_buf + offset, to_read, &bytes_read, portMAX_DELAY);
    offset += bytes_read;
    remaining -= bytes_read;
  }

  i2s_mic_deinit();

  // Amplificar señal (el micrófono del M5GO es muy bajo)
  int16_t* samples = (int16_t*)(wav_buf + WAV_HEADER_SIZE);
  int num_samples = data_size / 2;
  for (int i = 0; i < num_samples; i++) {
    int32_t amplified = samples[i] * 8; // Ganancia x8
    if (amplified > 32767) amplified = 32767;
    if (amplified < -32768) amplified = -32768;
    samples[i] = (int16_t)amplified;
  }

  *out_size = total_size;
  Serial.printf("Grabación completa: %d bytes\n", total_size);
  return wav_buf;
}

// --- Reproducción MP3 ---
// Usa el DAC interno del ESP32 (pin 25) para reproducir audio
// Para MP3 necesitamos decodificar primero — usamos la librería ESP8266Audio

#include <AudioFileSourceBuffer.h>
#include <AudioGeneratorMP3.h>
#include <AudioOutputI2S.h>
#include <AudioFileSourcePROGMEM.h>

void audio_play_mp3(const uint8_t* data, size_t size) {
  AudioGeneratorMP3 *mp3 = new AudioGeneratorMP3();
  AudioFileSourcePROGMEM *src = new AudioFileSourcePROGMEM(data, size);
  AudioOutputI2S *out = new AudioOutputI2S(0, AudioOutputI2S::INTERNAL_DAC);
  out->SetGain(0.8);

  if (!mp3->begin(src, out)) {
    Serial.println("Error iniciando MP3");
    delete mp3;
    delete src;
    delete out;
    return;
  }

  while (mp3->isRunning()) {
    if (!mp3->loop()) {
      mp3->stop();
    }
    delay(1);
  }

  delete mp3;
  delete src;
  delete out;

  Serial.println("Reproducción completa");
}
