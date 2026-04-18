#ifndef AUDIO_H
#define AUDIO_H

#include <stdint.h>
#include <stddef.h>

typedef void (*PlaybackCallback)();

void audio_init();
void audio_start_recording();
uint8_t* audio_stop_recording(size_t* out_size);
void audio_play_mp3(const uint8_t* data, size_t size, PlaybackCallback onChunk = nullptr);
bool audio_is_playing();

#endif
