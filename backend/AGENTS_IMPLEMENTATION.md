# 단비 Agent 구현 가이드

이 문서는 실제 저장소에 추가된 Java 21 / Spring Boot 4 구현의 실행 안내다.
별도 Python 서버나 Agent 프레임워크 없이 기존 백엔드 안에서 실행한다.

현재 범위는 **로컬 개발용 모의 금융 Agent API**다. 실제 계좌 조회, 송금 실행,
본인인증 및 약관 동의 처리는 연결하지 않았다. 기존 `/api/transfer/execute`를 호출하는 경로도 없다.
응답의 `demo: true`와 화면의 모의 안내를 프런트에서 유지한다.

## 1. API 키와 세션 토큰의 차이

| 항목 | 발급 주체 | 저장 위치 | 용도 |
|---|---|---|---|
| OpenAI API 키 | 개발자가 OpenAI 대시보드에서 발급 | 백엔드 환경변수/배포 시크릿 | OpenAI API 인증 |
| 단비 데모 세션 토큰 | `POST /api/agents/sessions` | 클라이언트 메모리 | 한 대화의 상태 접근 |
| 사용자 로그인 토큰 | 향후 단비 인증 시스템 | 앱의 보안 저장소 | 실제 사용자/계좌 권한 확인 |

대화용 데모 토큰은 로그인 인증을 대신하지 않는다. 아무 사용자나 생성할 수 있으므로
공개 서비스에 그대로 배포하면 안 된다. Agent API는 기본적으로 꺼져 있다.
이 구현은 STT → Responses → TTS 체인이라 브라우저 Realtime 임시 토큰 발급은 필요 없다.

### OpenAI 키 발급

1. [OpenAI Platform](https://platform.openai.com/)에 로그인하고 프로젝트를 선택/생성한다.
2. 프로젝트의 [API Keys](https://platform.openai.com/api-keys)에서 서버용 Secret Key를 만든다.
3. 프로젝트의 API 사용 결제 설정, 사용 한도, 선택한 모델 접근 가능 여부를 확인한다.
4. 키는 로컬 환경변수 또는 배포 시크릿 저장소에 넣는다. 채팅, Git, 앱 번들에 넣지 않는다.
5. 노출되면 해당 키를 폐기하고 새 키로 교체한다.

키 발급은 사용자의 계정에서 해야 하며 이 작업에서 실제 키를 생성하거나 수집하지 않았다.
모델 토큰(입출력 사용량 단위)은 API 인증 키와 다른 개념이다.

참고: [공식 Quickstart](https://developers.openai.com/api/docs/quickstart)

## 2. 사용하는 OpenAI API

| 처리 | REST endpoint | 기본 모델 | 코드 |
|---|---|---|---|
| 발화 정리·라우팅·근거 기반 쉬운 설명 | `POST /v1/responses` | `gpt-5.6-terra` | `OpenAiGateway.structured` |
| 문서·질문 벡터 생성 | `POST /v1/embeddings` | `text-embedding-3-small` | `OpenAiGateway.embed` |
| 녹음 파일 인식 | `POST /v1/audio/transcriptions` | `gpt-transcribe` | `OpenAiGateway.transcribe` |
| 안내 문장 음성 생성 | `POST /v1/audio/speech` | `gpt-4o-mini-tts` | `OpenAiGateway.speech` |

모델 이름은 환경변수로 변경할 수 있다. 변경 시 구조화된 출력 또는 해당 음성 API 지원 여부를 확인한다.
REST를 Java `HttpClient`로 호출하여 요청 본문을 읽기 쉽게 유지했다.
Responses API는 `store:false`, `text.format.type:json_schema`, `strict:true`를 사용한다.
완료되지 않은 응답, refusal, 잘못된 JSON, 429/상위 API 오류를 성공으로 반환하지 않는다.
`store:false`가 제공자 측 모든 로그의 무보관을 뜻하는 것은 아니다.

문서:
- [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [Embeddings](https://developers.openai.com/api/docs/guides/embeddings)
- [STT](https://developers.openai.com/api/docs/guides/speech-to-text)
- [TTS](https://developers.openai.com/api/docs/guides/text-to-speech)

## 3. 패키지 구조

```text
backend/
├── .env.example
├── AGENTS_IMPLEMENTATION.md
├── src/main/java/com/danbi/domain/agent/
│   ├── config/       # AgentConfig, AgentProperties: 환경변수 바인딩
│   ├── controller/   # AgentController, AgentExceptionHandler: HTTP 입출력
│   ├── model/        # AgentModels, AgentOutcome, AgentException: 데이터 계약
│   ├── llm/          # AiGateway, OpenAiGateway, Prompts, Schemas
│   ├── rag/          # KnowledgeStore: 분할·임베딩·검색
│   ├── tools/        # DemoBankTools: 고정 모의 계좌·수취인·거래
│   └── service/
│       ├── AgentSessions.java       # 세션 토큰, 만료, 대화 상태
│       ├── Orchestrator.java        # 요청 분류, Agent 선택, 처리 순서
│       ├── VoiceAgent.java          # STT/TTS, 파일 검증
│       ├── FinanceAgent.java        # 조회, 송금 초안, 상품 설명
│       ├── SignupAgent.java         # 현재 단계와 검색 근거로 안내
│       ├── PracticeCoachAgent.java  # 연습 시작, 기록 기반 피드백
│       └── EasyLanguageAgent.java   # 근거 기반 쉬운 말 생성·출처 검사
├── src/main/resources/agent/
│   ├── prompts/      # router, signup, finance, coach, easy-language.txt
│   └── knowledge/demo.json         # 출처·버전이 있는 개발용 예시 자료
└── src/test/java/com/danbi/domain/agent/
    ├── service/      # 대화 상태, 수정·취소, 근거 검증
    ├── rag/          # 검색 범위, 임계값, 청크 분할
    └── llm/          # 로컬 HTTP 서버를 통한 OpenAI 요청/응답 계약
```

## 4. 로컬 실행

프로젝트 루트에서 MySQL을 실행한다.

```bash
docker compose up -d
cd backend
cp .env.example .env
```

`.env`의 `OPENAI_API_KEY=`에 발급받은 키를 넣는다. `.env`는 Git에서 제외된다.
Spring Boot는 `.env`를 자동으로 읽지 않으므로, 직접 작성한 로컬 파일을 현재 셸에 로드한다.

```bash
set -a
source .env
set +a
./gradlew bootRun --args='--server.address=127.0.0.1'
```

또는 IDE 실행 환경변수에 `.env.example`의 항목들을 직접 등록한다.
추가 의존성은 없고 기존 Java/Gradle 의존성을 사용한다.
`DANBI_AGENT_ENABLED=true`를 지정해야 데모 세션이 생성된다.
OpenAI API 비용은 실제 요청 시 발생하며, 첫 RAG 질문에는 예시 문서 전체의 임베딩 비용도 포함된다.

## 5. 세션 발급과 대화

```bash
curl -X POST http://localhost:8080/api/agents/sessions
```

예시 응답:

```json
{"token":"서버가_생성한_랜덤값","expiresInSeconds":1800,"demo":true}
```

이 토큰은 32바이트 난수이며 30분 후 만료된다. 서버 재시작 시에도 사라진다.
다음 예제의 `DANBI_SESSION_TOKEN`에 응답의 토큰을 저장한다.

```bash
export DANBI_SESSION_TOKEN='응답의 token 값'

curl http://localhost:8080/api/agents/chat \
  -H "Authorization: Bearer $DANBI_SESSION_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"text":"민수에게 돈 보내줘"}'

curl http://localhost:8080/api/agents/chat \
  -H "Authorization: Bearer $DANBI_SESSION_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"text":"삼만 원"}'
```

두 번째 응답은 `screen.type=transfer_confirmation`이며 금액, 수취인, 마스킹 계좌를 포함한다.
텍스트와 금액 안내는 검증된 값에서 템플릿으로 생성한다. 실제 송금은 일어나지 않는다.

추가 대화 예:
- `잔액 알려줘` → 고정 모의 잔액 150,000원.
- `지난주 거래내역 보여줘` → 서울 시간 기준 날짜 범위 및 모의 내역.
- `아니 이만 원으로 바꿔줘` → 기존 송금 금액 수정.
- `취소해` → 입력 중인 수취인·금액 제거.
- `영희에게 삼만 원` → 동명이인 재질문. `김영희` 또는 `박영희`로 구분.
- `가입할 때 선택 동의가 뭐야?` → 예시 약관 검색과 출처 반환.
- `예금과 적금의 차이는 뭐야?` → 예시 상품 문서 검색.
- `송금 연습 시작` → 별도 연습 플래그와 모의 입력 시나리오.
- `연습 피드백 알려줘` → 현재 세션의 오류·수정 횟수에 근거한 피드백.

신규 세션마다 입력 상태와 연습 집계는 분리된다. 동일 세션 요청은 직렬 처리한다.
클라이언트도 응답 `version`이 이미 표시한 버전보다 작으면 화면을 갱신하지 않는다.
`OTHER` 및 모호한 요청은 성공이나 실행으로 해석하지 않는다.

## 6. 음성 입력과 출력

```bash
curl http://localhost:8080/api/agents/voice/chat \
  -H "Authorization: Bearer $DANBI_SESSION_TOKEN" \
  -F 'file=@input.m4a'
```

`transcript`에는 STT 원문, `reply`에는 텍스트 대화와 동일한 결과가 들어 있다.
원문을 임의로 문장 교정해 덮어쓰지 않고 라우터가 이름·금액·의도를 별도로 추출한다.
빈 음성, 10MB 초과, 지원되지 않는 확장자는 거절한다. 파일 내용의 최종 디코딩 검증은 STT 제공자가 수행한다.
마이크 녹음/권한 요청/재생은 React Native 프런트엔드에서 별도로 연결한다.

최신 `reply.version` 또는 텍스트 응답의 `version`으로 음성을 요청한다.

```bash
curl http://localhost:8080/api/agents/voice/speech \
  -H "Authorization: Bearer $DANBI_SESSION_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"version":2}' \
  --output answer.mp3
```

임의 문장을 TTS API에 전달할 수 없으며 서버의 최신 최종 안내만 읽는다.
오래된 버전은 409를 반환한다. 앱에서 응답 상태/Content-Type을 확인한 뒤 재생한다.
앱에는 AI 생성 음성임을 알리는 문구를 제공한다.

세션 종료:

```bash
curl -X DELETE http://localhost:8080/api/agents/sessions/current \
  -H "Authorization: Bearer $DANBI_SESSION_TOKEN"
```

## 7. 프롬프팅 설계

`router.txt`는 역할, 허용 intent, null 규칙, 금액 수정, 취소, 상대 날짜, 예시를 정의한다.
사용자의 질문은 시스템 프롬프트 문자열에 이어 붙이지 않고 별도의 user JSON 데이터로 전달한다.
서버 상태도 함께 제공하므로 `민수에게 보내줘` 다음의 `삼만 원`을 같은 흐름으로 해석한다.

```text
고정 system 지침
  + user JSON {text, task, recipient, amount, lastQuestion, today}
  → strict JSON schema 결과
  → Java enum·범위·수취인 검증
  → 허용된 업무 서비스 호출
```

`signup/finance/coach.txt`는 각 역할의 근거 사용 규칙을 정한다.
`easy-language.txt`는 최종 설명 호출에 합성되는 공통 정책이다.
쉬운 말 Agent를 별도 LLM 호출로 항상 추가하지 않아 지연을 줄인다.
금융 금액·상태 안내는 LLM 재서술 없이 코드 템플릿으로 생성한다.

프롬프트의 안전 규칙만으로 권한을 통제하지 않는다. `DemoBankTools`에는 실제 송금 메서드가 없으며,
모델이 반환한 임의 함수명이나 클래스명을 reflection/eval로 실행하지 않는다.

## 8. RAG 동작과 자료 교체

```text
버전 관리된 demo.json
→ 문단 분할 (최대 600자 / 긴 문단 80자 중첩)
→ Embeddings API 문서 벡터 생성
→ 메모리에 완성된 인덱스 보관

질문
→ 질문 임베딩
→ signup/product 범위 필터
→ 코사인 유사도 검색, 최소 점수 이상 상위 3개
→ 근거 문서 + 역할 프롬프트로 Responses 호출
→ 지원 여부/출처 id 검사
→ 답변 + 제목/버전/원문 발췌 반환
```

`RAG_MIN_SCORE=0.35`는 시작값이며 한국어 평가 데이터로 보정해야 한다. 유사도는 사실의 신뢰 확률이 아니다.
검색 결과가 없으면 생성 호출을 하지 않는다. 모델이 근거 부족이라고 판단하거나
전달되지 않은 출처를 반환하면 답변 대신 자료 부족 안내를 반환한다.
출처 id 검사는 문장 전체의 사실성 보장을 의미하지 않는다.

자료 형식:

```json
{
  "id": "unique-document-id",
  "domain": "signup",
  "title": "검토된 문서 제목",
  "version": "2026-09-v1",
  "reference": "관리자가 확인한 원문 위치",
  "text": "해당 버전의 원문 내용"
}
```

개발용 예시를 수정하려면 `src/main/resources/agent/knowledge/demo.json`을 수정하고 서버를 재시작한다.
최초 질문에서 다시 인덱싱한다. 고객 잔액·거래내역·인증번호는 지식 문서에 넣지 않는다.
현재는 소규모 문서용 인메모리 벡터 검색이며 영속 벡터 DB, PDF 파서, 관리자 업로드 API는 없다.
문서가 커지면 배치 임베딩, 문서 해시/모델별 캐시, 승인·시행일 필터, 벡터 DB를 추가한다.

## 9. 테스트와 실제 서비스 연결 지점

```bash
./gradlew test
```

테스트는 API 키 없이 mock 또는 로컬 가짜 HTTP 서버를 사용한다. 실제 OpenAI 호출 비용이 발생하지 않는다.
계약 테스트는 HTTP 요청 형식과 응답 파싱을 검증하며 라이브 모델의 접근 가능성/한국어 품질을 검증하지 않는다.

현재 제한 및 다음 연결 지점:
- `DemoBankTools`: 실제 인증된 사용자 컨텍스트를 사용하는 기존 계좌/거래 조회 서비스로 교체.
- `SignupAgent`: 현재 예시 세션의 NAME_INPUT 상태를 안내. 실제 단계 이동/동의/인증은 기존
  `OnboardingSessionService`와 사용자 소유권 검증을 연결해야 한다.
- `PracticeCoachAgent`: 현재 세션의 수취인/금액 오류와 금액 수정만 집계. 장기 학습 기록과 단계별
  클릭/체류 시간은 기존 help 이벤트 또는 연습 이벤트 저장소로 확장.
- `AgentSessions`: 공개 환경에서는 실사용자 로그인, 사용자별 접근 통제, 사용량 제한,
  영속/공유 세션 저장소를 연결. 지금은 최대 500개 세션의 로컬 데모용 메모리 저장소.
- 송금 확인 이후 실제 실행은 별도 거래 인증·내용 고정·중복 실행 방지 흐름으로 구현.
- 프런트엔드 화면/녹음/재생 연결은 이 변경에 포함하지 않았다.

MCP 프로토콜 서버는 이 구현에 포함하지 않았다. 지금은 Java 도구를 직접 호출한다.
MCP가 필요하면 동일한 조회/초안 도구 인터페이스를 MCP 서버로 노출하되
인증과 권한 검사는 반드시 서버에서 유지한다.

라이브 검증은 로컬에 키를 설정한 뒤 잔액/수정/취소/근거 질문과 음성 파일로 수행한다.
정확도 평가는 소음·동명이인·금액 수정·부정 표현·근거 없는 질문을 포함하고,
모델이나 프롬프트 변경 후 같은 평가 세트로 비교한다.
