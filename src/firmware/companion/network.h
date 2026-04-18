#ifndef NETWORK_H
#define NETWORK_H

#include <stdint.h>
#include <stddef.h>

void wifi_connect();
bool check_backend_health();
uint8_t* send_chat_audio(const uint8_t* wav_data, size_t wav_size, size_t* response_size);
void send_emergency();

#endif
