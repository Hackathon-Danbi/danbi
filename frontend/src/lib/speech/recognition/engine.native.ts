import type { RecognitionEngine } from './types';

type Subscription = { remove: () => void };

/**
 * iOS/Android 네이티브 STT. 모듈은 사용자가 마이크를 누른 뒤 지연 로드한다.
 * 따라서 네이티브 모듈이 없는 Expo Go에서도 앱 부팅은 유지되고, 해당 동작만 오류로
 * 처리된다. 실제 인식은 config plugin이 포함된 development/release build에서 동작한다.
 */
export const recognitionEngine: RecognitionEngine = {
  supported: true,
  create: (opts) => {
    let active = true;
    let subscriptions: Subscription[] = [];
    let abortNative: (() => void) | null = null;

    const cleanup = () => {
      subscriptions.forEach((subscription) => subscription.remove());
      subscriptions = [];
      abortNative = null;
    };

    const failBeforeStart = (kind: 'permission' | 'other') => {
      if (!active) return;
      cleanup();
      opts.onError(kind);
      opts.onEnd();
    };

    return {
      start: () => {
        void (async () => {
          try {
            const { ExpoSpeechRecognitionModule } = await import('expo-speech-recognition');
            if (!active) return;
            if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) {
              failBeforeStart('other');
              return;
            }

            const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
            if (!active) return;
            if (!permission.granted) {
              failBeforeStart('permission');
              return;
            }

            subscriptions = [
              ExpoSpeechRecognitionModule.addListener('result', (event) => {
                if (!active) return;
                const transcript = event.results[0]?.transcript?.trim() ?? '';
                if (!transcript) return;
                if (event.isFinal) opts.onFinal(transcript);
                else opts.onPartial(transcript);
              }),
              ExpoSpeechRecognitionModule.addListener('nomatch', () => {
                if (active) opts.onError('nomatch');
              }),
              ExpoSpeechRecognitionModule.addListener('error', (event) => {
                if (!active || event.error === 'aborted') return;
                const kind = event.error === 'not-allowed'
                  ? 'permission'
                  : event.error === 'no-speech' || event.error === 'speech-timeout'
                    ? 'nomatch'
                    : 'other';
                opts.onError(kind);
              }),
              ExpoSpeechRecognitionModule.addListener('end', () => {
                if (!active) return;
                cleanup();
                opts.onEnd();
              }),
            ];
            abortNative = () => ExpoSpeechRecognitionModule.abort();
            ExpoSpeechRecognitionModule.start({
              lang: opts.lang,
              interimResults: true,
              continuous: false,
              contextualStrings: ['송금', '만원', '원', '김민수', '이영희'],
            });
          } catch {
            failBeforeStart('other');
          }
        })();
      },
      abort: () => {
        if (!active) return;
        active = false;
        const abort = abortNative;
        cleanup();
        try {
          abort?.();
        } catch {
          /* 이미 종료된 네이티브 세션은 무시한다. */
        }
      },
    };
  },
};
