/** BE FaceCaptureStage 와 같은 순서. POST /api/onboarding/certificate/face/verify 의 captureStage. */
export const FACE_CAPTURE_STAGES = ['FRONT_INITIAL', 'RIGHT', 'LEFT', 'FRONT_FINAL'] as const;

export type FaceCaptureStage = (typeof FACE_CAPTURE_STAGES)[number];

export type FaceGuideFocus = 'front' | 'right' | 'left';

export type FacePoseCopy = {
  stage: FaceCaptureStage;
  label: string;
  title: string;
  guide: string;
  hint: string;
  voice: string;
  focus: FaceGuideFocus;
};

export const FACE_POSE_COPY: Record<FaceCaptureStage, FacePoseCopy> = {
  FRONT_INITIAL: {
    stage: 'FRONT_INITIAL',
    label: '정면',
    title: '정면을 바라봐 주세요',
    guide: '노란 타원 안에 얼굴을 넣고, 양쪽 귀와 턱을 선에 맞춰주세요.',
    hint: '양쪽 귀가 보이게 정면을 봐 주세요',
    voice: '정면을 바라봐 주세요. 노란 타원 안에 얼굴을 넣고, 양쪽 귀와 턱을 선에 맞춰 주세요.',
    focus: 'front',
  },
  RIGHT: {
    stage: 'RIGHT',
    label: '오른쪽',
    title: '오른쪽으로 돌려 주세요',
    guide: '고개를 오른쪽으로 살짝 돌려, 오른쪽 귀가 노란 표시에 보이게 해주세요.',
    hint: '오른쪽 귀가 보이게 고개를 돌려 주세요',
    voice: '고개를 오른쪽으로 살짝 돌려 주세요. 오른쪽 귀가 노란 표시에 보이게 해주세요.',
    focus: 'right',
  },
  LEFT: {
    stage: 'LEFT',
    label: '왼쪽',
    title: '왼쪽으로 돌려 주세요',
    guide: '고개를 왼쪽으로 살짝 돌려, 왼쪽 귀가 노란 표시에 보이게 해주세요.',
    hint: '왼쪽 귀가 보이게 고개를 돌려 주세요',
    voice: '고개를 왼쪽으로 살짝 돌려 주세요. 왼쪽 귀가 노란 표시에 보이게 해주세요.',
    focus: 'left',
  },
  FRONT_FINAL: {
    stage: 'FRONT_FINAL',
    label: '정면',
    title: '다시 정면을 봐 주세요',
    guide: '처음처럼 정면을 보고, 턱선이 아래 선에 닿게 해주세요.',
    hint: '턱선이 아래 선에 닿게 정면을 봐 주세요',
    voice: '다시 정면을 봐 주세요. 턱선이 아래 노란 선에 닿게 맞춰 주세요.',
    focus: 'front',
  },
};

export function nextFaceCaptureStage(stage: FaceCaptureStage): FaceCaptureStage | null {
  const index = FACE_CAPTURE_STAGES.indexOf(stage);
  return FACE_CAPTURE_STAGES[index + 1] ?? null;
}

export function faceCaptureStepNumber(stage: FaceCaptureStage): number {
  return FACE_CAPTURE_STAGES.indexOf(stage) + 1;
}
