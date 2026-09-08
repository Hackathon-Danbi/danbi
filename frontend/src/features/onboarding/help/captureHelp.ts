import { useCallback, useEffect, useRef, useState } from 'react';

import { ONBOARDING_IDLE_MS } from './onboardingHelp';

/** 촬영 화면 선제 도움 문구. 카메라 위 안내 줄 대신 버튼 강조·음성·시트에 쓴다. */
export const ID_CAPTURE_HELP = {
  entry: '신분증을 노란 네모 안에 맞춘 뒤, 아래 촬영하기를 눌러주세요.',
  idle: '아래 「촬영하기」를 눌러주세요.',
  reviewIdle: '글자가 선명하면 「네, 잘 보여요」를 눌러주세요.',
  permission: '카메라를 켜야 신분증을 찍을 수 있어요. 아래 버튼을 눌러주세요.',
  permissionBlocked: '설정에서 단비의 카메라 권한을 켜야 촬영할 수 있어요.',
  captureFail: '사진을 찍지 못했어요. 아래 「촬영하기」를 다시 눌러주세요.',
  openCoach: '촬영이 어려우시면 단비가 하나씩 알려드릴게요.',
};

export const FACE_CAPTURE_HELP = {
  entry: '화면을 정면으로 바라보고 「얼굴 찍기」를 눌러주세요.',
  idle: '아래 「얼굴 찍기」를 눌러주세요.',
  retryIdle: '아래 「다시 찍을게요」를 눌러주세요.',
  successIdle: '확인이 끝났어요. 「계좌 확인으로 갈게요」를 눌러주세요.',
  permission: '카메라를 켜야 얼굴을 찍을 수 있어요. 아래 버튼을 눌러주세요.',
  permissionBlocked: '설정에서 단비의 카메라 권한을 켜야 촬영할 수 있어요.',
  captureFail: '얼굴을 찍지 못했어요. 아래 「얼굴 찍기」를 다시 눌러주세요.',
  openCoach: '밝은 곳, 마스크, 거리를 확인해 주세요. 단비가 도와드릴게요.',
};

export type FaceHelpKind = 'light' | 'cover' | 'distance' | 'full';

export const FACE_COACH_STEPS: Record<FaceHelpKind, string[]> = {
  light: [
    '창문을 등지고 서거나, 불을 켜 주세요.',
    '얼굴에 그림자가 없는지 봐 주세요.',
    '좋아요. 아래 얼굴 찍기를 눌러주세요.',
  ],
  cover: [
    '모자나 선글라스를 벗어 주세요.',
    '마스크가 있으면 코와 입이 보이게 내려 주세요.',
    '좋아요. 정면을 보고 찍어 주세요.',
  ],
  distance: [
    '휴대폰을 눈높이로 들어 주세요.',
    '얼굴이 화면에 다 들어오게 조금 멀리 해 주세요.',
    '좋아요. 아래 얼굴 찍기를 눌러주세요.',
  ],
  full: [
    '밝은 곳에서 화면을 정면으로 봐 주세요.',
    '얼굴이 화면에 크게 보이게 해 주세요.',
    '좋아요. 아래 얼굴 찍기를 눌러주세요.',
  ],
};

export const FACE_HELP_OPTIONS: [FaceHelpKind, string][] = [
  ['light', '어둡거나 그림자가 있어요'],
  ['cover', '모자·마스크·안경을 쓰고 있어요'],
  ['distance', '얼굴이 너무 가깝거나 멀어요'],
  ['full', '처음부터 도움받기'],
];

/**
 * 촬영 화면 무조작 단계.
 * 1: 버튼 강조, 2: 도움 시트, 3: 상담 에스컬레이션.
 */
export function useStagedIdle(active: boolean) {
  const [stage, setStage] = useState(0);
  const [tick, setTick] = useState(0);
  const activeRef = useRef(active);
  activeRef.current = active;

  const bump = useCallback(() => {
    setStage(0);
    setTick((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!active || stage >= 3) {
      if (!active) setStage(0);
      return;
    }
    const timer = setTimeout(() => {
      if (!activeRef.current) return;
      setStage((current) => Math.min(current + 1, 3));
    }, ONBOARDING_IDLE_MS);
    return () => clearTimeout(timer);
  }, [active, stage, tick]);

  return { stage, bump };
}
