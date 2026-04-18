#ifndef AUDIO_H
#define AUDIO_H

#include <stdint.h>
#include <stddef.h>

void audio_init();
uint8_t* audio_record(size_t* out_size);
void audio_play_mp3(const uint8_t* data, size_t size);

#endif
