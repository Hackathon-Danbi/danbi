/**
 * 웹 STT — Web Speech API (`window.SpeechRecognition` / `webkitSpeechRecognition`).
 * danbi_jj/app/features/practice/hooks/useSpeechRecognition.ts 의 브라우저 로직을 이관.
 */
import type { RecognitionCallbacks, RecognitionEngine, RecognitionSession } from './types';

interface RecognitionAlternativeLike {
  transcript: string;
}
interface RecognitionResultLike {
  0: RecognitionAlternativeLike;
  isFinal?: boolean;
}
interface RecognitionEventLike {
  results: ArrayLike<RecognitionResultLike>;
}
interface RecognitionErrorLike {
  error?: string;
}
interface RecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  abort: () => void;
  onresult: ((event: RecognitionEventLike) => void) | null;
  onerror: ((event: RecognitionErrorLike) => void) | null;
  onend: (() => void) | null;
}
type RecognitionConstructor = new () => RecognitionLike;

function getConstructor(): RecognitionConstructor | undefined {
  if (typeof window === 'undefined') return undefined;
  const w = window as typeof window & {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

const Constructor = getConstructor();

export const recognitionEngine: RecognitionEngine = {
  supported: !!Constructor,

  create(opts: RecognitionCallbacks): RecognitionSession | null {
    if (!Constructor) return null;

    const recognition = new Constructor();
    recognition.lang = opts.lang;
    recognition.continuous = false;
    recognition.interimResults = true;

    let latest = '';
    let done = false;

    recognition.onresult = (event) => {
      const heard = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? '')
        .join(' ')
        .trim();
      latest = heard;
      opts.onPartial(heard);
      const last = event.results[event.results.length - 1];
      if (last?.isFinal && heard) {
        done = true;
        opts.onFinal(heard);
      }
    };

    recognition.onerror = (event) => {
      if (done) return;
      done = true;
      const denied = event.error === 'not-allowed' || event.error === 'service-not-allowed';
      opts.onError(denied ? 'permission' : event.error === 'no-speech' ? 'nomatch' : 'other');
    };

    recognition.onend = () => {
      if (!done) {
        done = true;
        if (latest) opts.onFinal(latest);
        else opts.onError('nomatch');
      }
      opts.onEnd();
    };

    return {
      start: () => {
        try {
          recognition.start();
        } catch {
          if (!done) {
            done = true;
            opts.onError('other');
            opts.onEnd();
          }
        }
      },
      abort: () => {
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
        try {
          recognition.abort();
        } catch {
          /* 무시 */
        }
      },
    };
  },
};
