# API 연결 대기 가이드

현재 앱은 기존 mock/로컬 상태만 사용하며 네트워크 요청을 보내지 않는다.
Notion `API 명세서`의 56개 엔드포인트는 다음 세 파일에 준비되어 있다.

- `contracts.ts`: 명세의 요청/응답 타입과 ENUM
- `endpoints.ts`: HTTP method와 URL 원문
- `requests.ts`: 도메인별 요청 함수(현재 feature에서 import하지 않음)

## 백엔드 완료 후 연결 순서

1. `.env`에 `EXPO_PUBLIC_API_BASE_URL`을 설정한다.
2. `index.ts`의 `API 연결 대기` export 주석을 해제한다.
3. 아래 교체 지점에서 mock 반환을 API 응답으로 바꾼다.
4. 토큰 저장 방식이 확정되면 `/api/users/me` 호출에 access token을 전달한다.

```ts
// API 연결 대기: 예시. 백엔드 완료 후 주석 해제
// import { transactionsApi } from '@/api';
// const response = await transactionsApi.getAll({ accountId, month });
// setTransactions(response.transactions);
```

## 화면별 교체 지점

- 가입/인증: `features/onboarding/hooks/useOnboardingState.ts`
- 송금/안심확인: `features/main/transfer/TransferFlow.tsx`
- 거래내역: `features/main/TransactionContext.tsx`
- 예적금: `features/main/savings/SavingsFlow.tsx`
- 금융 연습/오늘의 활동: `features/missions/MissionMode.tsx`
- 음성 질의: `features/main/transfer/TransferFlow.tsx`, `lib/speech/*`
- 선제적 도움: `features/onboarding/help/useScreenHelp.ts`, `features/main/proactiveHelp.ts`

## 명세에서 백엔드 확정이 필요한 항목

- `PATCH /transactions/{transactionId}/review`: URL/param은 단건 `reviewStatus` 방식인데,
  상세 본문의 요청 예시는 `/api/transactions/mark-read`와 `accountId`, `transactionIds`를 사용한다.
  `ReviewTransactionRequest`에 두 후보를 보존했으며 백엔드 확정 후 하나로 좁혀야 한다.
- `GET /help/agent-availability`: 응답 필드 표와 예시가 비어 있다.
  현재 `AgentAvailabilityResponse`는 `Record<string, unknown>`이며 명세 보완 후 구체화해야 한다.
- `/onboarding/terms*`를 포함한 일부 URL에는 `/api` prefix가 없고 다른 가입 URL에는 있다.
  `endpoints.ts`는 명세 원문을 그대로 보존했다.
- `POST /transfer/execute`의 속성 설명에는 `riskAcknowledged`가 있으나 요청 예시에는 없다.
  계약에서는 선택값으로 두었고 백엔드 확정 후 필수 여부를 맞춰야 한다.
- KB국민 계좌는 명세상 `ACCOUNT_PASSWORD`, 타행은 `ONE_WON` 인증이다. 현재 프로토타입의
  계좌 인증 화면은 기존 흐름을 보존하므로 실제 연결 시 `verificationMethod`에 따라 분기해야 한다.
