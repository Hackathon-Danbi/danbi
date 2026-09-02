/**
 * danbi_jj 의 `window.speechSynthesis` + `SpeechSynthesisUtterance` 를 expo-speech 로 대체.
 * 웹 / iOS / Android / Expo Go 모두 지원.
 */
import * as Speech from 'expo-speech';

/** 원본 utterance.rate 값들(0.82~0.88)의 대표값. 시니어 대상이라 느리게. */
const DEFAULT_RATE = 0.88;
const LANGUAGE = 'ko-KR';

export type SpeakOptions = {
  rate?: number;
  onDone?: () => void;
  /**
   * true(기본): 재생 중이던 안내를 끊고 새로 읽는다(원본 speechSynthesis.cancel + speak).
   * false: 큐에 추가한다(원본 useCaptureGuidance 의 순차 재생 정책용).
   */
  flush?: boolean;
};

export function speak(text: string, options: SpeakOptions = {}): void {
  const normalized = text.replace(/\s*\n\s*/g, ' ').trim();
  if (!normalized) return;
  if (options.flush ?? true) Speech.stop();
  Speech.speak(normalized, {
    language: LANGUAGE,
    rate: options.rate ?? DEFAULT_RATE,
    onDone: options.onDone,
    onStopped: options.onDone,
    onError: options.onDone,
  });
}

/** 현재/대기 중인 모든 안내 중지. 화면 언마운트 cleanup 에서 호출. */
export function stop(): void {
  Speech.stop();
}

export function isSpeakingAsync(): Promise<boolean> {
  return Speech.isSpeakingAsync();
}
