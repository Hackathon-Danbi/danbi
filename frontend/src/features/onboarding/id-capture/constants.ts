import type { IdCaptureStatus } from './types';

/**
 * 상태별 화면 문구 / 음성 안내.
 * 분석 결과(IdCaptureStatus)만 바뀌면 화면·TTS 정책은 그대로 재사용됩니다.
 */
export const CAPTURE_GUIDANCE: Record<IdCaptureStatus, { screen: string; tts: string }> = {
  TOO_CLOSE: {
    screen: '휴대폰을 조금 멀리해주세요.',
    tts: '휴대폰을 조금 멀리해주세요.',
  },
  TOO_FAR: {
    screen: '신분증에 조금 더 가까이해주세요.',
    tts: '신분증에 조금 더 가까이해주세요.',
  },
  CROPPED: {
    screen: '신분증 전체가 보이게 해주세요.',
    tts: '신분증 전체가 보이게 해주세요.',
  },
  BLURRY: {
    screen: '잠시 움직이지 말고 기다려주세요.',
    tts: '휴대폰을 두 손으로 잡고 잠시 움직이지 말아주세요.',
  },
  GLARE: {
    screen: '빛이 반사되고 있어요.\n휴대폰을 살짝 기울여주세요.',
    tts: '빛이 반사되고 있어요. 휴대폰을 살짝 기울여주세요.',
  },
  GOOD_POSITION: {
    screen: '좋아요. 그대로 잠시만 기다려주세요.',
    tts: '좋아요. 그대로 잠시만 기다려주세요.',
  },
  CAPTURED: {
    screen: '잘 찍혔어요!',
    tts: '잘 찍혔어요.',
  },
};
