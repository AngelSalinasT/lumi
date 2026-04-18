#ifndef NETWORK_H
#define NETWORK_H

#include <stdint.h>
#include <stddef.h>

typedef void (*IdleCallback)();

void wifi_connect();
bool check_backend_health();
uint8_t* send_chat_audio(const uint8_t* wav_data, size_t wav_size, size_t* response_size, IdleCallback onIdle = nullptr);
void send_emergency(const char* reason = "boton");

// Setup / pairing
// Returns: 0 = waiting_setup, 1 = onboarding, 2 = ready
int check_device_status();

#endif
