#include "network.h"
#include "config.h"
#include <M5Stack.h>
#include <WiFi.h>
#include <HTTPClient.h>

void wifi_connect() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.printf("Conectando a %s", WIFI_SSID);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\nWiFi conectado! IP: %s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("\nError: no se pudo conectar al WiFi");
  }
}

bool check_backend_health() {
  HTTPClient http;
  String url = String(BACKEND_URL) + "/health";

  http.begin(url);
  http.setTimeout(5000);
  int httpCode = http.GET();

  bool ok = (httpCode == 200);
  if (ok) {
    Serial.println("Backend health: OK");
  } else {
    Serial.printf("Backend health: error %d\n", httpCode);
  }
  http.end();
  return ok;
}

uint8_t* send_chat_audio(const uint8_t* wav_data, size_t wav_size, size_t* response_size) {
  HTTPClient http;
  String url = String(BACKEND_URL) + "/chat";

  http.begin(url);
  http.setTimeout(30000); // 30s timeout — el LLM puede tardar

  // Construir multipart body
  String boundary = "----CompanionBoundary";
  String content_type = "multipart/form-data; boundary=" + boundary;
  http.addHeader("Content-Type", content_type);

  // Construir body
  String body_start = "--" + boundary + "\r\n"
    "Content-Disposition: form-data; name=\"device_id\"\r\n\r\n"
    + String(DEVICE_ID) + "\r\n"
    "--" + boundary + "\r\n"
    "Content-Disposition: form-data; name=\"audio\"; filename=\"recording.wav\"\r\n"
    "Content-Type: audio/wav\r\n\r\n";

  String body_end = "\r\n--" + boundary + "--\r\n";

  size_t total_len = body_start.length() + wav_size + body_end.length();

  // Enviar con buffer
  uint8_t* post_buf = (uint8_t*)ps_malloc(total_len);
  if (!post_buf) post_buf = (uint8_t*)malloc(total_len);
  if (!post_buf) {
    Serial.println("Error: sin memoria para POST");
    *response_size = 0;
    return nullptr;
  }

  size_t offset = 0;
  memcpy(post_buf + offset, body_start.c_str(), body_start.length());
  offset += body_start.length();
  memcpy(post_buf + offset, wav_data, wav_size);
  offset += wav_size;
  memcpy(post_buf + offset, body_end.c_str(), body_end.length());

  Serial.printf("POST /chat (%d bytes)...\n", total_len);
  int httpCode = http.POST(post_buf, total_len);
  free(post_buf);

  if (httpCode != 200) {
    Serial.printf("Error HTTP: %d\n", httpCode);
    http.end();
    *response_size = 0;
    return nullptr;
  }

  // Leer respuesta MP3
  int len = http.getSize();
  if (len <= 0) {
    Serial.println("Respuesta vacía");
    http.end();
    *response_size = 0;
    return nullptr;
  }

  uint8_t* mp3_buf = (uint8_t*)ps_malloc(len);
  if (!mp3_buf) mp3_buf = (uint8_t*)malloc(len);
  if (!mp3_buf) {
    Serial.println("Error: sin memoria para MP3");
    http.end();
    *response_size = 0;
    return nullptr;
  }

  WiFiClient* stream = http.getStreamPtr();
  size_t read_total = 0;
  while (read_total < (size_t)len) {
    size_t available = stream->available();
    if (available > 0) {
      size_t to_read = (available > 1024) ? 1024 : available;
      size_t read_now = stream->readBytes(mp3_buf + read_total, to_read);
      read_total += read_now;
    }
    delay(1);
  }

  http.end();

  Serial.printf("Recibido MP3: %d bytes\n", read_total);
  *response_size = read_total;
  return mp3_buf;
}

void send_emergency() {
  HTTPClient http;
  String url = String(BACKEND_URL) + "/emergency";

  http.begin(url);
  http.addHeader("Content-Type", "application/x-www-form-urlencoded");

  String body = "device_id=" + String(DEVICE_ID);
  int httpCode = http.POST(body);

  if (httpCode == 200) {
    Serial.println("Alerta de emergencia enviada");
  } else {
    Serial.printf("Error enviando alerta: %d\n", httpCode);
  }
  http.end();
}
