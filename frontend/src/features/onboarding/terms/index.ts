import { ELECTRONIC_DOCUMENT_TERMS_BODY } from './electronicDocumentBody';
import { FACE_AUTH_TERMS_BODY } from './faceAuthBody';
import { KB_CERTIFICATE_TERMS_BODY } from './kbCertificateBody';
import { PHONE_AUTH_TERMS_BODY } from './phoneAuthBody';

export type TermId =
  | 'marketing'
  | 'phone-auth'
  | 'kb-certificate'
  | 'face-auth'
  | 'electronic-document';

export type TermDocument = {
  id: TermId;
  title: string;
  /** 시니어가 먼저 읽는 쉬운 설명. 전문은 body. */
  summary: string;
  body: string;
};

const MARKETING_BODY = `혜택 및 이벤트 안내 동의 (선택)

새로운 혜택, 이벤트, 서비스 소식을 안내받기 위한 선택 동의입니다.

수집·이용 목적
- 상품·서비스 안내, 이벤트 정보 제공

수집 항목
- 이름, 휴대폰 번호

보유 기간
- 동의 철회 또는 회원 탈퇴 시까지

동의하지 않아도 가입과 기본 서비스는 이용할 수 있습니다.
`;

export const TERMS: Record<TermId, TermDocument> = {
  marketing: {
    id: 'marketing',
    title: '혜택 및 이벤트 안내',
    summary:
      '새로운 혜택과 이벤트 소식을 받아보기 위한 선택 동의입니다. 동의하지 않아도 가입과 기본 서비스는 그대로 이용할 수 있어요.',
    body: MARKETING_BODY,
  },
  'phone-auth': {
    id: 'phone-auth',
    title: '핸드폰 인증 약관',
    summary:
      '현재 사용하는 휴대폰이 본인 명의인지 확인하기 위한 약관입니다. 입력한 정보는 본인확인, 인증번호 발송과 부정 이용 방지에 사용됩니다.',
    body: PHONE_AUTH_TERMS_BODY,
  },
  'kb-certificate': {
    id: 'kb-certificate',
    title: 'KB국민인증서 약관',
    summary:
      'KB국민인증서를 발급받아 로그인, 본인확인과 전자서명에 이용하기 위한 약관입니다. 입력한 정보는 인증서 발급과 이용·관리에 사용됩니다.',
    body: KB_CERTIFICATE_TERMS_BODY,
  },
  'face-auth': {
    id: 'face-auth',
    title: '얼굴인증 약관',
    summary:
      '신분증 사진과 현재 얼굴을 비교해 본인인지 확인하기 위한 동의입니다. 얼굴 특징정보는 본인확인이 끝나면 바로 삭제됩니다.',
    body: FACE_AUTH_TERMS_BODY,
  },
  'electronic-document': {
    id: 'electronic-document',
    title: '전자문서 전체 약관동의',
    summary:
      '안내문과 고지서를 KB스타뱅킹에서 받아보는 선택 서비스입니다. 필요하지 않다면 동의하지 않아도 기본 가입에는 영향이 없습니다.',
    body: ELECTRONIC_DOCUMENT_TERMS_BODY,
  },
};

export function getTerm(id: TermId): TermDocument {
  return TERMS[id];
}
