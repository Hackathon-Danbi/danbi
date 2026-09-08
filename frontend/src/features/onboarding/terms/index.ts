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
    body: MARKETING_BODY,
  },
  'phone-auth': {
    id: 'phone-auth',
    title: '핸드폰 인증 약관',
    body: PHONE_AUTH_TERMS_BODY,
  },
  'kb-certificate': {
    id: 'kb-certificate',
    title: 'KB국민인증서 약관',
    body: KB_CERTIFICATE_TERMS_BODY,
  },
  'face-auth': {
    id: 'face-auth',
    title: '얼굴인증 약관',
    body: FACE_AUTH_TERMS_BODY,
  },
  'electronic-document': {
    id: 'electronic-document',
    title: '전자문서 전체 약관동의',
    body: ELECTRONIC_DOCUMENT_TERMS_BODY,
  },
};

export function getTerm(id: TermId): TermDocument {
  return TERMS[id];
}
