/**
 * 가입 선제적 도움. 화면 진입 음성·무입력 힌트·안내 줄 문구를 단계 번호로 묶는다.
 * 타이머·에스컬레이션은 OnboardingFlow 가 담당한다.
 */

export const ONBOARDING_IDLE_MS = 15000;

export type OnboardingHelpDef = {
  /** 화면 들어오면 읽어 주는 문장. */
  entryVoice: string;
  /** 노란 안내 줄 / 무입력 시 다시 읽어 주는 짧은 힌트. */
  hint: string;
  /**
   * true 면 화면 들어올 때부터 안내 줄을 보여 준다.
   * false 면 잠시 머뭇거린 뒤에만 보여 준다.
   */
  showBar: boolean;
};

export const STEP_HELP: Record<number, OnboardingHelpDef> = {
  0: {
    entryVoice: '가입 안내 화면이에요. 준비, 본인 확인, 국민인증서 만들기 순서로 진행해요.',
    hint: '아래 「가입 시작하기」를 눌러주세요.',
    showBar: false,
  },
  1: {
    entryVoice: '가입 준비 화면이에요. 휴대폰, 신분증, 본인 계좌를 미리 준비해주세요.',
    hint: '세 가지를 준비하셨으면 「준비됐어요」를 눌러주세요.',
    showBar: false,
  },
  2: {
    entryVoice: '인증서 약관 화면이에요. 필수 약관에 동의한 뒤 계속해주세요. 자세한 내용은 전체 보기에서 볼 수 있어요.',
    hint: 'KB국민인증서 약관에 체크한 뒤 계속해주세요.',
    showBar: true,
  },
  3: {
    entryVoice: '이제 문자로 본인인지 확인할게요. 본인 명의 휴대폰이 필요해요.',
    hint: '준비가 됐으면 「본인 확인 시작하기」를 눌러주세요.',
    showBar: false,
  },
  4: {
    entryVoice: '핸드폰 인증 약관 화면이에요. 필수 약관에 동의한 뒤 계속해주세요.',
    hint: '핸드폰 인증 약관에 체크한 뒤 계속해주세요.',
    showBar: true,
  },
  5: {
    entryVoice: '이름 입력 화면이에요. 신분증에 적힌 이름을 똑같이 입력해주세요.',
    hint: '신분증에 적힌 이름을 그대로 입력해주세요.',
    showBar: true,
  },
  6: {
    entryVoice: '이 휴대폰이 고객님 명의인지 확인하는 화면이에요.',
    hint: '본인 명의이면 「네, 제 휴대폰이에요」를 눌러주세요.',
    showBar: false,
  },
  7: {
    entryVoice: '통신사 선택 화면이에요. 지금 쓰는 휴대폰의 통신사를 하나만 골라주세요.',
    hint: '이용 중인 통신사를 하나 선택한 뒤 계속해주세요.',
    showBar: true,
  },
  8: {
    entryVoice: '휴대폰 번호 입력 화면이에요. 본인 명의 번호 열한 자리를 천천히 입력해주세요.',
    hint: '숫자 11자리를 모두 입력한 뒤 인증번호를 받아주세요.',
    showBar: true,
  },
  9: {
    entryVoice:
      '인증번호 입력 화면이에요. 방금 받은 문자에서 숫자 6자리를 확인해주세요. 인증번호는 다른 사람에게 알려주지 마세요.',
    hint: '문자에서 숫자 6자리를 입력해주세요.',
    showBar: true,
  },
  10: {
    entryVoice: '신분증 선택 화면이에요. 주민등록증 또는 운전면허증을 골라주세요.',
    hint: '사용할 신분증을 하나 선택한 뒤 계속해주세요.',
    showBar: true,
  },
  11: {
    entryVoice: '신분증 촬영 화면이에요. 신분증 전체가 네모 안에 들어오도록 놓아주세요.',
    hint: '신분증을 네모 안에 맞춘 뒤 촬영해주세요.',
    showBar: false,
  },
  12: {
    entryVoice: '신분증에서 읽은 정보가 맞는지 확인하는 화면이에요.',
    hint: '이름과 번호가 맞으면 「네, 맞아요」를 눌러주세요.',
    showBar: false,
  },
  13: {
    entryVoice: '얼굴 인증 약관 화면이에요. 동의한 뒤 얼굴을 확인할 수 있어요.',
    hint: '얼굴인증 약관에 체크한 뒤 계속해주세요.',
    showBar: true,
  },
  14: {
    entryVoice: '얼굴 확인 화면이에요. 화면을 정면으로 바라봐주세요. 밝은 곳에서 하면 더 잘 돼요.',
    hint: '정면을 바라보고 「얼굴 찍기」를 눌러주세요.',
    showBar: false,
  },
  15: {
    entryVoice: '계좌 은행 선택 화면이에요. 가입에 사용할 계좌의 은행을 하나 선택해주세요.',
    hint: '계좌가 있는 은행을 하나 선택해주세요.',
    showBar: true,
  },
  16: {
    entryVoice: '계좌번호 입력 화면이에요. 통장이나 카드에 적힌 계좌번호를 순서대로 입력해주세요.',
    hint: '계좌번호를 순서대로 입력해주세요.',
    showBar: true,
  },
  17: {
    entryVoice: '계좌 비밀번호 입력 화면이에요. 계좌를 만들 때 정한 비밀번호 4자리를 입력해주세요.',
    hint: '계좌 비밀번호 4자리를 입력해주세요.',
    showBar: true,
  },
  18: {
    entryVoice: '1원 인증 화면이에요. 통장 입금 내역에서 케이비 뒤에 적힌 숫자 4자리를 입력해주세요.',
    hint: '통장 입금 내역에서 KB 뒤의 숫자 4자리를 입력해주세요.',
    showBar: true,
  },
  19: {
    entryVoice: '간편 비밀번호 화면이에요. 앞으로 쓸 숫자 여섯 자리를 정하고 한 번 더 입력해주세요.',
    hint: '숫자 6자리를 입력해주세요.',
    showBar: true,
  },
  20: {
    entryVoice: '가입이 끝났어요. 다음에 할 일을 선택해주세요.',
    hint: '연습하거나 계좌를 보려면 아래 버튼을 눌러주세요.',
    showBar: false,
  },
};

export function getStepHelp(step: number): OnboardingHelpDef {
  return (
    STEP_HELP[step] ?? {
      entryVoice: '',
      hint: '',
      showBar: false,
    }
  );
}

export function isFullBleedHelpStep(step: number): boolean {
  return step === 11 || step === 14;
}
