# 미확인 거래 API

명세: https://app.notion.com/p/API-3d14d80e394a801ba0dcff8cf393501d

김혜빈 담당 GET API 3개를 구현한다.

| 경로 | 응답 |
| --- | --- |
| `/api/v1/unreviewed-transactions/summary` | `unreviewedDays`, `unreviewedCount` |
| `/api/v1/accounts/unreviewed-transaction-counts` | `unreviewedDays`, `accounts` |
| `/api/v1/accounts/{accountId}/unreviewed-transactions` | 계좌 표시 정보, `unreviewedCount`, `transactions` |

인증 모듈이 검증된 양의 사용자 ID를 `Principal.name`으로 제공해야 한다. 기존 예적금 API와 같은 규약이다. 현재 저장소에는 실제 로그인 인증 연결이 없으므로 인증 연결 전 일반 HTTP 호출은 401을 반환한다. 요청 헤더나 쿼리의 사용자 ID로 인증을 대체하지 않는다.

## 조회 규칙

- 미확인은 기존 `ReviewStatus.PENDING`이다. `KNOWN`, `UNKNOWN`은 집계 및 목록에서 제외한다. 기존 확인 처리 API는 그대로 사용한다.
- 명세에 기간 입력이나 고정 조회 기간이 없어 전체 미확인 거래를 조회한다.
- `unreviewedDays`는 가장 오래된 미확인 거래의 날짜부터 한국 시간 오늘까지의 날짜 차이다. 거래가 없거나 오늘 거래만 있으면 0이다. 미래 거래 데이터가 있는 경우에도 음수가 되지 않는다.
- 통장별 목록에는 사용자의 모든 계좌를 계좌 ID 오름차순으로 반환하며 미확인 거래가 없는 통장은 0건으로 표시한다.
- 거래 목록은 발생 시각 내림차순, 같은 시각이면 거래 ID 내림차순이다. 조회는 확인 상태를 바꾸지 않는다.
- 계좌번호는 숫자 중 끝 4자리만 응답한다. 거래 금액은 절댓값이다.
- 잘못된 계좌 ID는 400, 인증 누락/잘못된 인증 주체는 401, 존재하지 않거나 다른 사용자 소유인 계좌는 404다.

## 저장 필드

`accounts.bank_name`과 nullable `transactions.payment_method`가 추가된다. 현재 개발 설정의 Hibernate `ddl-auto=update`에서 생성된다. 운영 환경에서는 해당 컬럼을 배포 전 별도 마이그레이션해야 한다.

은행명이 없는 기존 계좌는 `은행 정보 없음`으로 표시한다. 실제 은행명은 계좌 데이터 입력 시 `bankName`에 저장해야 한다. 거래 수단은 `CHECK_CARD`, `TRANSFER`, `AUTO_TRANSFER`이며 기존 거래의 미상 값은 null이다.

담당자가 지정되지 않은 요약 음성 API는 이 작업 범위에 포함하지 않는다.

## 검증

```bash
./gradlew test --tests com.danbi.transaction.UnreviewedTransactionIntegrationTest --tests com.danbi.transaction.TransactionRepositoryTest
```

통합 테스트는 실제 H2 DB와 MockMvc로 소유자별 집계, 한국 날짜 경계, 빈 결과, 정렬, 금액/거래 수단 직렬화, 계좌번호 마스킹, 인증 및 계좌 접근 오류를 검증한다.
