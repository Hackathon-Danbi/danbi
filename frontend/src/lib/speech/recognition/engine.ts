/**
 * 기본(TypeScript 해석용 + web/native 이외 플랫폼) STT 엔진.
 * Metro 는 실제 실행 시 engine.web.ts / engine.native.ts 를 우선 사용한다.
 * 여기서는 네이티브와 동일한 "미지원" 스텁을 둔다.
 */
import type { RecognitionEngine } from './types';

export const recognitionEngine: RecognitionEngine = {
  supported: false,
  create: () => null,
};
