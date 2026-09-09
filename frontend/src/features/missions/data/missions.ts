export type MissionId =
  | 'guided-transfer'
  | 'voice-transfer'
  | 'solo-transfer'
  | 'review-transfer'
  | 'phishing-cases'
  | 'phishing-prevention'
  | 'phishing-simulation';

export type MissionType = 'transfer' | 'phishing-learn' | 'phishing-sim';

export interface Mission {
  id: MissionId;
  group: string;
  icon: string;
  title: string;
  description: string;
  points: number;
  type: MissionType;
}

// MVP 점수 배분(총 100점): 차근차근 20 · 말로 25 · 혼자 30 · 송금 전 확인 25.
// 위험 상황(phishing-*) 미션은 MVP 화면에서 숨기므로 0점으로 두되, 확장 대비 목록에는 남긴다.
export const MISSIONS: Mission[] = [
  {
    id: 'guided-transfer',
    group: '혼자 송금하기',
    icon: '🌱',
    title: '차근차근 따라하기',
    description: '처음이라면 단비와 하나씩 해봐요.',
    points: 20,
    type: 'transfer',
  },
  {
    id: 'voice-transfer',
    group: '혼자 송금하기',
    icon: '🎤',
    title: '말로 송금해보기',
    description: '받는 사람과 금액을 말해서 보내봐요.',
    points: 25,
    type: 'transfer',
  },
  {
    id: 'solo-transfer',
    group: '혼자 송금하기',
    icon: '💪',
    title: '혼자 송금해보기',
    description: '안내 없이 실제처럼 해봐요.',
    points: 30,
    type: 'transfer',
  },
  {
    id: 'review-transfer',
    group: '혼자 송금하기',
    icon: '◉',
    title: '송금 전 확인하기',
    description: '보내기 전에 이름·계좌·금액을 다시 확인해요.',
    points: 25,
    type: 'transfer',
  },
  {
    id: 'phishing-cases',
    group: '보이스피싱에서 내 돈 지키기',
    icon: '⚠',
    title: '최신 보이스피싱 사례 알아보기',
    description: '실제로 일어난 사례를 함께 살펴봐요',
    points: 0,
    type: 'phishing-learn',
  },
  {
    id: 'phishing-prevention',
    group: '보이스피싱에서 내 돈 지키기',
    icon: '◈',
    title: '보이스피싱 예방법 익히기',
    description: '피해를 막는 간단한 방법을 배워요',
    points: 0,
    type: 'phishing-learn',
  },
  {
    id: 'phishing-simulation',
    group: '보이스피싱에서 내 돈 지키기',
    icon: '◐',
    title: '의심스러운 전화 상황 경험하기',
    description: '실제 상황처럼 연습해 보고 대처해요',
    points: 0,
    type: 'phishing-sim',
  },
];

export const MISSION_GROUPS = [...new Set(MISSIONS.map((m) => m.group))];

export const MAX_SCORE = MISSIONS.reduce((sum, m) => sum + m.points, 0);
