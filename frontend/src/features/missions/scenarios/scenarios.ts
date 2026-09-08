import type { RiskScenario } from './types';
import type { RiskScenarioId } from '../types';

export const RISK_SCENARIOS: readonly RiskScenario[] = [
  {
    id: 'prosecutor-scam',
    title: '검찰 사칭 전화',
    replayTitle: '검찰 사칭 전화',
    contactType: 'call',
    contactName: '서울중앙지검',
    contactAddress: '02-XXX-XXXX',
    dialogueSteps: [
      { id: 'p1', speaker: 'scammer', text: '서울중앙지검 수사관입니다. 본인 확인 때문에 연락드렸습니다.', tts: true },
      { id: 'p2', speaker: 'scammer', text: '선생님 명의의 계좌가 금융사기 사건에 이용됐습니다.', tts: true },
      { id: 'p3', speaker: 'scammer', text: '지금 협조하지 않으면 계좌가 모두 정지될 수 있습니다.', tts: true },
      { id: 'p4', speaker: 'scammer', text: '수사 중인 내용이니 가족이나 은행 직원에게는 말하지 마세요.', tts: true },
      { id: 'p5', speaker: 'scammer', text: '예금이 안전한지 확인하려면 지금 알려드리는 계좌로 옮겨야 합니다.', tts: true },
      { id: 'p6', speaker: 'scammer', text: '시간이 없습니다. 바로 50만원을 보내세요.', tts: true },
    ],
    transferRequest: {
      recipientName: '김정훈',
      bank: '단비연습은행',
      account: '101234567890',
      amount: 500_000,
    },
    riskSignals: [
      '검찰이라고 신분을 밝혔어요.',
      '계좌가 범죄에 이용됐다고 겁을 줬어요.',
      '다른 사람에게 말하지 말라고 했어요.',
      '돈을 다른 계좌로 옮기라고 했어요.',
    ],
    learningMessage: '수사기관은 전화로 돈을 옮기라고 요구하지 않아요.',
  },
  {
    id: 'family-impersonation',
    title: '가족 사칭 메시지',
    replayTitle: '가족 사칭 메시지',
    contactType: 'message',
    contactName: '알 수 없는 번호',
    contactAddress: '010-XXXX-XXXX',
    dialogueSteps: [
      { id: 'f1', speaker: 'scammer', text: '엄마 나야. 휴대폰이 고장나서 다른 번호로 연락했어.' },
      { id: 'f2', speaker: 'scammer', text: '지금 급하게 결제해야 하는 게 있는데 내 폰으로는 안 돼.' },
      { id: 'f3', speaker: 'scammer', text: '친구 계좌로 50만원만 먼저 보내줄 수 있어?' },
      { id: 'f4', speaker: 'scammer', text: '지금 바로 해야 해. 전화는 고장나서 받을 수 없어.' },
    ],
    transferRequest: {
      recipientName: '박서준',
      bank: '단비연습은행',
      account: '202345678901',
      amount: 500_000,
    },
    riskSignals: [
      '낯선 번호로 가족인 척했어요.',
      '휴대폰이 고장나 통화할 수 없다고 했어요.',
      '아주 급한 일이라며 서둘렀어요.',
      '가족이 아닌 사람의 계좌를 알려줬어요.',
    ],
    learningMessage: '가족이라고 해도 원래 알고 있던 번호로 직접 확인하세요.',
  },
  {
    id: 'loan-scam',
    title: '대출 사기 전화',
    replayTitle: '대출 사기 전화',
    contactType: 'call',
    contactName: '금융상담센터',
    contactAddress: '070-XXX-XXXX',
    dialogueSteps: [
      { id: 'l1', speaker: 'scammer', text: '고객님께 연 2퍼센트 저금리 대출이 승인되어 연락드렸습니다.', tts: true },
      { id: 'l2', speaker: 'scammer', text: '다만 기존 대출을 오늘 먼저 상환하셔야 합니다.', tts: true },
      { id: 'l3', speaker: 'scammer', text: '지금 처리하지 않으면 이 혜택은 바로 사라집니다.', tts: true },
      { id: 'l4', speaker: 'scammer', text: '상환 전용 계좌를 알려드릴 테니 다른 곳에 문의하지 마세요.', tts: true },
      { id: 'l5', speaker: 'scammer', text: '우선 30만원을 입금하면 새 대출이 실행됩니다.', tts: true },
    ],
    transferRequest: {
      recipientName: '이상환',
      bank: '단비연습은행',
      account: '303456789012',
      amount: 300_000,
    },
    riskSignals: [
      '먼저 돈을 보내야 대출된다고 했어요.',
      '낮은 금리로 바꿔준다고 유혹했어요.',
      '혜택이 곧 사라진다며 재촉했어요.',
      '개인 명의 계좌로 입금을 요구했어요.',
    ],
    learningMessage: '정상 금융회사는 대출을 위해 먼저 돈을 보내라고 하지 않아요.',
  },
  {
    id: 'refund-scam',
    title: '환불 사기 메시지',
    replayTitle: '환불 사기 메시지',
    contactType: 'message',
    contactName: '온라인몰 고객센터',
    contactAddress: '발신번호 표시제한',
    dialogueSteps: [
      { id: 'r1', speaker: 'scammer', text: '고객센터입니다. 주문하신 상품의 환불 처리에 오류가 생겼습니다.' },
      { id: 'r2', speaker: 'scammer', text: '환불금이 고객님께 두 번 입금된 것으로 확인됩니다.' },
      { id: 'r3', speaker: 'scammer', text: '오늘 안에 돌려주지 않으면 연체 비용이 생길 수 있습니다.' },
      { id: 'r4', speaker: 'scammer', text: '지금 보내드리는 계좌로 20만원을 돌려주세요.' },
    ],
    transferRequest: {
      recipientName: '최환불',
      bank: '단비연습은행',
      account: '404567890123',
      amount: 200_000,
    },
    riskSignals: [
      '갑자기 환불 오류가 생겼다고 했어요.',
      '입금 내역을 직접 확인할 시간을 주지 않았어요.',
      '비용이 생긴다며 불안하게 했어요.',
      '고객센터가 개인 계좌로 송금을 요구했어요.',
    ],
    learningMessage: '환불 문제는 앱의 주문 내역과 공식 고객센터 번호로 확인하세요.',
  },
];

export const SCENARIO_BY_ID = Object.fromEntries(
  RISK_SCENARIOS.map((scenario) => [scenario.id, scenario]),
) as Record<RiskScenarioId, RiskScenario>;
