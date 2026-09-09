import { Platform } from 'react-native';

import type { RecordedAudio } from './contracts';

export async function appendRecordedAudio(
  formData: FormData,
  audio: RecordedAudio,
): Promise<void> {
  if (Platform.OS === 'web') {
    const response = await fetch(audio.uri);
    const blob = await response.blob();
    formData.append('audio', blob, audio.name);
    return;
  }

  formData.append('audio', {
    uri: audio.uri,
    name: audio.name,
    type: audio.mimeType,
  } as unknown as Blob);
}
