#include "network.h"
#include "config.h"
#include <M5Stack.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <SD.h>

#define MP3_FILE_PATH "/response.mp3"

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
  Serial.printf("Backend health: %s\n", ok ? "OK" : "FAIL");
  http.end();
  return ok;
}

uint8_t* send_chat_audio(const uint8_t* wav_data, size_t wav_size, size_t* response_size, IdleCallback onIdle) {
  WiFiClient client;

  // Parsear host y puerto de BACKEND_URL
  String host = String(BACKEND_URL).substring(7); // quitar "http://"
  int colonPos = host.indexOf(':');
  String ip = host.substring(0, colonPos);
  int port = host.substring(colonPos + 1).toInt();

  if (!client.connect(ip.c_str(), port)) {
    Serial.println("Error: no conecta al backend");
    *response_size = 0;
    return nullptr;
  }

  // Leer WAV desde SD
  File wavFile = SD.open("/recording.wav", FILE_READ);
  if (!wavFile) {
    Serial.println("Error abriendo WAV de SD");
    client.stop();
    *response_size = 0;
    return nullptr;
  }
  size_t fileSize = wavFile.size();

  // Multipart por streaming
  String boundary = "----Companion";
  String partHeader =
    "--" + boundary + "\r\n"
    "Content-Disposition: form-data; name=\"device_id\"\r\n\r\n"
    + String(DEVICE_ID) + "\r\n"
    "--" + boundary + "\r\n"
    "Content-Disposition: form-data; name=\"audio\"; filename=\"r.wav\"\r\n"
    "Content-Type: audio/wav\r\n\r\n";
  String partFooter = "\r\n--" + boundary + "--\r\n";

  size_t contentLength = partHeader.length() + fileSize + partFooter.length();

  // HTTP headers
  client.printf("POST /chat HTTP/1.1\r\n");
  client.printf("Host: %s:%d\r\n", ip.c_str(), port);
  client.printf("Content-Type: multipart/form-data; boundary=%s\r\n", boundary.c_str());
  client.printf("Content-Length: %d\r\n", contentLength);
  client.printf("Connection: close\r\n\r\n");

  // Body en streaming desde SD
  client.print(partHeader);

  uint8_t sdBuf[512];
  size_t sent = 0;
  while (sent < fileSize) {
    size_t chunk = (fileSize - sent > 512) ? 512 : (fileSize - sent);
    size_t got = wavFile.read(sdBuf, chunk);
    int retries = 0;
    size_t written = 0;
    while (written == 0 && retries < 5) {
      written = client.write(sdBuf, got);
      if (written == 0) { retries++; delay(50); }
    }
    if (written == 0) {
      Serial.printf("Error escribiendo datos (sent %d/%d)\n", sent, fileSize);
      wavFile.close();
      client.stop();
      *response_size = 0;
      return nullptr;
    }
    sent += written;
    delay(1);
  }
  wavFile.close();

  client.print(partFooter);
  client.flush();
  Serial.printf("POST enviado (%d bytes). Esperando...\n", contentLength);

  // Esperar respuesta (60s timeout — Gemini puede tardar)
  unsigned long timeout = millis() + 240000;
  while (!client.available() && millis() < timeout) {
    if (onIdle) onIdle();
    delay(20);
  }

  if (!client.available()) {
    Serial.println("Timeout");
    client.stop();
    *response_size = 0;
    return nullptr;
  }

  // Leer headers
  int contentLen = -1;
  int statusCode = 0;
  bool headersEnd = false;

  while (client.available() && !headersEnd) {
    String line = client.readStringUntil('\n');
    line.trim();
    if (line.startsWith("HTTP/")) statusCode = line.substring(9, 12).toInt();
    if (line.startsWith("content-length") || line.startsWith("Content-Length"))
      contentLen = line.substring(line.indexOf(':') + 2).toInt();
    if (line.length() == 0) headersEnd = true;
  }

  Serial.printf("HTTP %d, len: %d, heap: %d\n", statusCode, contentLen, ESP.getFreeHeap());

  if (statusCode != 200 || contentLen <= 0) {
    client.stop();
    *response_size = 0;
    return nullptr;
  }

  // Guardar MP3 en SD
  File mp3File = SD.open(MP3_FILE_PATH, FILE_WRITE);
  if (!mp3File) {
    Serial.println("Error abriendo SD para escribir");
    client.stop();
    *response_size = 0;
    return nullptr;
  }

  uint8_t buf[512];
  size_t received = 0;
  timeout = millis() + 240000;
  while (received < (size_t)contentLen && millis() < timeout) {
    if (client.available()) {
      size_t toRead = (contentLen - received > 512) ? 512 : (contentLen - received);
      size_t got = client.read(buf, toRead);
      mp3File.write(buf, got);
      received += got;
    } else {
      delay(10);
    }
  }

  mp3File.close();
  client.stop();
  Serial.printf("MP3 guardado en SD: %d bytes\n", received);
  *response_size = received;
  return (uint8_t*)1;  // Puntero no-null para indicar éxito (datos en SD)
}

int check_device_status() {
  HTTPClient http;
  String url = String(BACKEND_URL) + "/api/device/" + String(DEVICE_ID) + "/status";
  http.begin(url);
  http.setTimeout(5000);
  int httpCode = http.GET();

  if (httpCode != 200) {
    http.end();
    return 0;  // waiting
  }

  String payload = http.getString();
  http.end();

  // Simple parse — look for "ready" or "onboarding"
  if (payload.indexOf("\"ready\"") > 0) return 2;
  if (payload.indexOf("\"onboarding\"") > 0) return 1;
  return 0;
}


bool check_notifications(size_t* audio_size) {
  HTTPClient http;
  String url = String(BACKEND_URL) + "/notifications/" + String(DEVICE_ID);
  http.begin(url);
  http.setTimeout(5000);
  int httpCode = http.GET();

  if (httpCode != 200) {
    http.end();
    *audio_size = 0;
    return false;
  }

  int contentLen = http.getSize();
  if (contentLen <= 0) {
    http.end();
    *audio_size = 0;
    return false;
  }

  // Guardar audio en SD
  WiFiClient* stream = http.getStreamPtr();
  File mp3File = SD.open(MP3_FILE_PATH, FILE_WRITE);
  if (!mp3File) {
    http.end();
    *audio_size = 0;
    return false;
  }

  uint8_t buf[512];
  size_t received = 0;
  while (received < (size_t)contentLen) {
    size_t avail = stream->available();
    if (avail) {
      size_t toRead = (avail > 512) ? 512 : avail;
      size_t got = stream->read(buf, toRead);
      mp3File.write(buf, got);
      received += got;
    } else {
      delay(10);
    }
  }

  mp3File.close();
  http.end();
  Serial.printf("Notificación recibida: %d bytes\n", received);
  *audio_size = received;
  return true;
}


void send_emergency(const char* reason) {
  HTTPClient http;
  String url = String(BACKEND_URL) + "/emergency";
  http.begin(url);
  http.addHeader("Content-Type", "application/x-www-form-urlencoded");
  String body = "device_id=" + String(DEVICE_ID) + "&reason=" + String(reason);
  Serial.printf("Emergencia: %s\n", reason);
  http.POST(body);
  http.end();
}
