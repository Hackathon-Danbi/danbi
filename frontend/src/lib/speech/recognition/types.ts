/**
 * 음성 인식(STT) 엔진 레이어.
 *
 * 플랫폼별 구현을 이 인터페이스 뒤로 숨긴다:
 *  - index.web.ts    : Web Speech API (`window.SpeechRecognition`) — 실제 인식
 *  - engine.native.ts: expo-speech-recognition 기반 실제 인식
 *
 * 상위 훅(lib/speech/useSpeechRecognition)이 `supported` / `create()` 결과를
 * 보고 fallback(예시 문장) 처리 여부를 결정한다.
 */

export type RecognitionErrorKind = 'permission' | 'nomatch' | 'other';

export interface RecognitionCallbacks {
  lang: string;
  /** 중간(비확정) 인식 결과 */
  onPartial: (transcript: string) => void;
  /** 최종(확정) 인식 결과 */
  onFinal: (transcript: string) => void;
  onError: (kind: RecognitionErrorKind) => void;
  /** 인식 세션 종료(성공/실패 무관) */
  onEnd: () => void;
}

export interface RecognitionSession {
  start: () => void;
  abort: () => void;
}

export interface RecognitionEngine {
  /** 이 플랫폼에서 실시간 음성 인식을 쓸 수 있는지 */
  supported: boolean;
  /** 세션 생성. 미지원이면 null. */
  create: (opts: RecognitionCallbacks) => RecognitionSession | null;
}
