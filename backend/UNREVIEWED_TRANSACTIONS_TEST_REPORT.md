# 미확인 거래 API 명세 검증 결과

검증일: 2026-09-09 (Asia/Seoul)
명세: https://app.notion.com/p/API-3d14d80e394a801ba0dcff8cf393501d
범위: 앞선 작업 대상인 ‘미확인 거래’ 카테고리의 GET API 4개. 다른 카테고리는 이번 명세 대조 범위에 포함하지 않았다.

## API별 결과

| API | 명세 대조 결과 | 인증 주입 MockMvc | 실제 HTTP (인증 없음) |
| --- | --- | --- | --- |
| /api/v1/unreviewed-transactions/summary | 예시 전체 JSON 일치: 7일, 4건 | 200 | 401 |
| /api/v1/accounts/unreviewed-transaction-counts | 예시 전체 JSON 일치: 생활비 2건, 연금 1건, 저축 1건 | 200 | 401 |
| /api/v1/accounts/{accountId}/unreviewed-transactions | 필드·값 일치, 배열 순서는 예시와 다름 | 200 | 401 |
| /api/v1/unreviewed-transactions/summary/audio | 미구현: 명세의 summaryText/audioUrl/durationSeconds 응답 없음 | 미검증 | 404 |

## 검증 방법과 한계

- H2 + Spring Boot + MockMvc에서 Principal 사용자 ID를 주입했다. 2026-09-09 한국 날짜로 고정하고 명세 예시 데이터를 저장했다. DB 생성 ID만 실제 ID로 치환했다.
- 추가 테스트 3개는 응답 전체 JSON을 STRICT 비교한다. 누락·추가 필드, 값, 배열 순서를 검증하며 Content-Type도 확인한다. 거래 목록의 기대 순서는 현재 구현의 최신순으로 지정했으므로 명세 예시의 배열 순서와 완전히 같다는 의미는 아니다.
- API 통합 테스트 7개와 저장소 테스트 2개, 총 9개 통과(실패·오류·건너뜀 0).
- 기존 테스트로 빈 결과, 오늘 거래, 한국 날짜 경계, 본인 거래 집계, 확인된 거래 제외, 정렬, 금액 절댓값, nullable paymentMethod, 마스킹, 조회 후 상태 유지, 400/401/404를 검증했다.
- 실제 MySQL은 ddl-auto=validate, 별도 18080 포트로 실행했다. 스키마 검증과 서버 기동 성공. 인증 없이 4개 경로를 curl로 호출했다. MySQL에서 인증된 200 응답까지 검증한 것은 아니다.

## 명세와 조율할 부분

1. 음성 요약 API는 미구현이다. 조회 API 테스트 통과를 전체 4개 API 구현 완료로 볼 수 없다.
2. 목록 예시는 9월 2일 → 9월 3일 순서지만 구현은 9월 3일 → 9월 2일이다. 명세에 정렬 기준이 명시되지 않아 최신순으로 유지했다.
3. 명세 Status는 200/400만 기재하지만 구현은 인증 누락 401, 타인·없는 계좌 404도 반환한다. 요약·계좌별 건수 API의 400 발생 조건과 오류 응답 본문은 명세에 없다.
4. 명세 reviewStatus 옵션은 PENDING/REVIEWED, 내부 엔티티는 PENDING/KNOWN/UNKNOWN이다. 이 조회 API는 PENDING만 반환하므로 현재 응답은 명세 옵션 안에 들어간다. 확인 처리 API와 공통 ENUM을 정리할 필요가 있다.
5. 명세 Integer 집계 필드는 Java long으로 구현되어 있다. 예시의 JSON 정수는 일치하지만 32비트 범위 제한은 적용하지 않는다.
6. 요약 설명의 ‘최근 일정 기간’과 ‘화면 표시 문구’는 기간 조건이나 응답 필드 정의가 없다. 현재는 전체 PENDING을 집계하며 명세 Response 표의 두 필드만 반환한다.
7. 실제 로그인 연동이 없어 일반 HTTP로 조회하면 401이다. 인증을 우회하도록 제품 코드를 변경하지 않았다.

## 재실행

backend 디렉터리에서:

```sh
./gradlew test --tests com.danbi.transaction.UnreviewedTransactionIntegrationTest --tests com.danbi.transaction.TransactionRepositoryTest --rerun-tasks
```

## 실제 MockMvc 응답

아래 ID는 테스트 DB에서 생성된 값이다.

```json
{
  "unreviewedDays": 7,
  "unreviewedCount": 4
}
```

```json
{
  "accountId": 7,
  "accountName": "생활비 통장",
  "bankName": "KB국민은행",
  "accountNumberLast4": "3456",
  "unreviewedCount": 2,
  "transactions": [
    {
      "transactionId": 11,
      "occurredAt": "2026-09-03T18:40:00",
      "description": "백화점 결제",
      "transactionType": "WITHDRAWAL",
      "paymentMethod": "CHECK_CARD",
      "amount": 620000,
      "reviewStatus": "PENDING"
    },
    {
      "transactionId": 10,
      "occurredAt": "2026-09-02T14:10:00",
      "description": "전자제품 매장",
      "transactionType": "WITHDRAWAL",
      "paymentMethod": "CHECK_CARD",
      "amount": 780000,
      "reviewStatus": "PENDING"
    }
  ]
}
```

```json
{
  "unreviewedDays": 7,
  "accounts": [
    {
      "accountId": 12,
      "accountName": "생활비 통장",
      "bankName": "KB국민은행",
      "accountNumberLast4": "3456",
      "unreviewedCount": 2
    },
    {
      "accountId": 13,
      "accountName": "연금 통장",
      "bankName": "KB국민은행",
      "accountNumberLast4": "7821",
      "unreviewedCount": 1
    },
    {
      "accountId": 14,
      "accountName": "저축 통장",
      "bankName": "우리은행",
      "accountNumberLast4": "1190",
      "unreviewedCount": 1
    }
  ]
}
```
