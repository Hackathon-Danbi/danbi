import { getLocalCalendarDayIndex, getLocalDateKey } from '../state';

export interface QuizQuestion {
  id: number;
  type: 'ox' | 'choice';
  question: string;
  choices: [string, string];
  correctIndex: 0 | 1;
  explanation: string;
  category: string;
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  // 보이스피싱
  { id: 1, type: 'ox', question: '검찰이나 금융기관이 전화로\n"안전계좌로 돈을 보내라"고\n요구할 수 있다', choices: ['O', 'X'], correctIndex: 1, explanation: '정답은 X예요. 검찰과 금융기관은 절대 전화로 계좌 이체를 요구하지 않아요. 이런 전화는 100% 보이스피싱이에요.', category: '보이스피싱' },
  { id: 2, type: 'ox', question: '출처를 모르는 문자 속 링크를\n클릭해도 괜찮다', choices: ['O', 'X'], correctIndex: 1, explanation: '정답은 X예요. 모르는 링크를 누르면 개인정보가 빠져나가거나 악성 앱이 설치될 수 있어요. 절대 클릭하지 마세요.', category: '스미싱' },
  { id: 3, type: 'choice', question: '모르는 번호로\n"금융감독원 직원"이라고\n전화가 왔을 때는?', choices: ['이야기를 들어본다', '바로 끊고 공식 번호(1332)로 확인한다'], correctIndex: 1, explanation: '정답은 "공식 번호로 확인"이에요. 금융감독원(1332)에 직접 전화해서 확인하세요. 낯선 번호로 기관을 사칭하는 것은 보이스피싱이에요.', category: '보이스피싱' },
  { id: 4, type: 'choice', question: '대출 안내 문자가 왔을 때\n어떻게 하는 것이 좋을까요?', choices: ['금리가 낮으면 링크를 눌러 신청한다', '공식 금융사 앱에서 직접 확인한다'], correctIndex: 1, explanation: '정답은 "공식 앱에서 확인"이에요. 문자 링크로 유도하는 대출 광고는 피싱 사이트이거나 악성 앱 설치로 이어질 수 있어요.', category: '스미싱' },
  // 송금
  { id: 5, type: 'ox', question: '송금 전에 받는 사람의 이름과\n계좌번호를 반드시 확인해야 한다', choices: ['O', 'X'], correctIndex: 0, explanation: '정답은 O예요. 잘못 보내면 돌려받기 어려울 수 있어요. 보내기 전에 꼭 한 번 더 확인하세요.', category: '송금' },
  { id: 6, type: 'choice', question: '이체 실수로 돈을 잘못 보냈을 때\n어떻게 해야 할까요?', choices: ['그냥 기다린다', '바로 은행에 연락해 반환 요청한다'], correctIndex: 1, explanation: '정답은 "은행에 연락"이에요. 즉시 고객센터에 연락해서 착오 송금 반환을 요청하세요. 빠를수록 돌려받을 가능성이 높아요.', category: '송금' },
  { id: 7, type: 'ox', question: '이체는 실행 후 즉시 취소할 수 있다', choices: ['O', 'X'], correctIndex: 1, explanation: '정답은 X예요. 이체는 실행되면 즉시 상대방 계좌로 들어가요. 취소가 아니라 반환 요청만 가능해요.', category: '송금' },
  { id: 8, type: 'ox', question: '낯선 사람이 "대신 이체해 달라"고\n부탁하면 도와줘도 된다', choices: ['O', 'X'], correctIndex: 1, explanation: '정답은 X예요. 타인의 요청으로 이체하면 자신도 모르게 범죄에 연루될 수 있어요. 항상 거절하세요.', category: '송금' },
  // 계좌 관리
  { id: 9, type: 'ox', question: '비밀번호는 메모장에 적어두면\n잊어버리지 않아서 좋다', choices: ['O', 'X'], correctIndex: 1, explanation: '정답은 X예요. 메모장은 분실될 수 있어요. 비밀번호는 머릿속에만 기억하거나, 잊으면 은행에서 재설정하세요.', category: '계좌 관리' },
  { id: 10, type: 'choice', question: '내 계좌로 갑자기 모르는 돈이\n입금됐을 때 어떻게 해야 할까요?', choices: ['그냥 사용한다', '즉시 은행에 문의한다'], correctIndex: 1, explanation: '정답은 "은행에 문의"예요. 착오 송금이거나 피싱 범죄에 이용될 수 있어요. 즉시 은행에 알려주세요.', category: '계좌 관리' },
  { id: 11, type: 'choice', question: '개인정보가 유출됐다고 의심될 때\n가장 먼저 해야 할 일은?', choices: ['계속 지켜본다', '즉시 비밀번호를 변경한다'], correctIndex: 1, explanation: '정답은 "즉시 비밀번호 변경"이에요. 지체 없이 모든 금융 비밀번호를 바꾸고 금융기관에 알리세요.', category: '개인정보 보호' },
  // ATM
  { id: 12, type: 'ox', question: 'ATM에서 비밀번호를 입력할 때\n손으로 가리는 것이 좋다', choices: ['O', 'X'], correctIndex: 0, explanation: '정답은 O예요. 어깨 너머로 비밀번호를 훔쳐보는 피해를 막을 수 있어요. 항상 손으로 가려주세요.', category: 'ATM' },
  { id: 13, type: 'choice', question: 'ATM 옆에서 "수수료 대신 낼게요,\n카드 맡겨주세요"라고 하면?', choices: ['고맙다고 카드를 준다', '정중히 거절하고 자리를 피한다'], correctIndex: 1, explanation: '정답은 "거절"이에요. 카드를 맡기면 개인정보와 돈을 모두 잃을 수 있어요. 낯선 사람의 호의는 거절하세요.', category: 'ATM' },
  // 예금·적금
  { id: 14, type: 'ox', question: '은행 예금보호한도는\n금융회사별 1인당 1억 원이다', choices: ['O', 'X'], correctIndex: 0, explanation: '정답은 O예요. 2025년 9월 1일부터 원금과 이자를 합쳐 금융회사별 1인당 최대 1억 원까지 보호받을 수 있어요.', category: '예금·적금' },
  { id: 15, type: 'choice', question: '매달 조금씩 꾸준히 저축하려면\n어떤 상품이 적합할까요?', choices: ['정기 예금', '정기 적금'], correctIndex: 1, explanation: '정답은 "정기 적금"이에요. 매달 정해진 금액을 납입하는 상품이에요. 목돈이 없어도 조금씩 모을 수 있어요.', category: '예금·적금' },
  { id: 16, type: 'ox', question: '금리가 높을수록 이자를\n더 많이 받는다', choices: ['O', 'X'], correctIndex: 0, explanation: '정답은 O예요. 같은 금액을 같은 기간 맡겨도 금리가 높을수록 이자가 더 많아요. 금리 비교는 필수예요.', category: '금리' },
  // 카드
  { id: 17, type: 'ox', question: '체크카드는 통장 잔액 이상으로\n사용할 수 없다', choices: ['O', 'X'], correctIndex: 0, explanation: '정답은 O예요. 체크카드는 통장에 있는 돈만큼만 쓸 수 있어요. 잔액이 없으면 결제가 거절돼요.', category: '카드 결제' },
  { id: 18, type: 'ox', question: '분실한 카드를 즉시 신고하면\n이후 부정 사용을 막을 수 있다', choices: ['O', 'X'], correctIndex: 0, explanation: '정답은 O예요. 카드를 잃어버리면 바로 카드사 고객센터에 분실 신고를 하세요. 신고 후 부정 사용은 보상받을 수 있어요.', category: '카드 결제' },
  // 자동이체
  { id: 19, type: 'ox', question: '자동이체 날짜에 잔액이 부족하면\n자동으로 이체된다', choices: ['O', 'X'], correctIndex: 1, explanation: '정답은 X예요. 잔액이 부족하면 자동이체가 실패해요. 이체일 전날까지 필요한 금액을 입금해두세요.', category: '자동이체' },
  { id: 20, type: 'ox', question: '공공 와이파이에서 인터넷 뱅킹을\n이용해도 안전하다', choices: ['O', 'X'], correctIndex: 1, explanation: '정답은 X예요. 공공 와이파이는 해킹에 취약해요. 인터넷 뱅킹은 반드시 개인 통신망에서 이용하세요.', category: '개인정보 보호' },
  { id: 21, type: 'choice', question: '지출 한도를 스스로 관리하려면\n어떤 카드가 더 적합할까요?', choices: ['신용카드', '체크카드'], correctIndex: 1, explanation: '정답은 "체크카드"예요. 잔액 이상 쓸 수 없어서 과소비를 예방할 수 있어요.', category: '카드 결제' },
];

export function getTodayString(date: Date = new Date()): string {
  return getLocalDateKey(date);
}

export function getQuizQuestionIndex(date: Date = new Date()): number {
  const dayIndex = getLocalCalendarDayIndex(date);
  return Math.abs(dayIndex) % QUIZ_QUESTIONS.length;
}

export function getTodayQuestion(date: Date = new Date()): QuizQuestion {
  return QUIZ_QUESTIONS[getQuizQuestionIndex(date)];
}

export function getQuizQuestionById(id: number): QuizQuestion | undefined {
  return QUIZ_QUESTIONS.find((question) => question.id === id);
}

export function isQuizAnswerCorrect(
  question: QuizQuestion,
  answeredIndex: number,
): boolean {
  return answeredIndex === question.correctIndex;
}
