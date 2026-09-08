# 단비

시니어를 위한 AI 금융 동반자 — "막히는 순간, 먼저 찾아오는 도움"

2026 KB IT's Your Life 해커톤 출품작 (팀 단비지기)

## 구조

모노레포입니다.

```
danbi/
├─ frontend/      # React Native + TypeScript
├─ backend/       # Spring Boot (Java)
├─ .cursor/rules/ # Cursor AI가 항상 참고하는 프로젝트 컨텍스트
├─ docker-compose.yml   # 로컬 MySQL
└─ README.md
```

## 브랜치 전략

```
main   ← 배포/시연 가능한 상태만
 └─ dev ← 팀 통합 브랜치, 여기서 매일 작업 합침
     ├─ fe-dev   (프론트 작업)
     └─ be-dev   (백엔드 작업)
```

- `main`, `dev`는 직접 push 금지 — PR로만 병합
- 브랜치명: `feature/fe-<기능>`, `feature/be-<기능>` (예: `feature/fe-voice-query`, `feature/be-transfer-api`)
- PR은 `dev`를 대상으로, 최소 1명 리뷰 후 머지
- 시연 직전에만 `dev → main` PR

## 로컬 개발 시작

필요 환경: Java 21, Node 18+, Docker Desktop (MySQL).

```bash
# 1. MySQL 실행 (프로젝트 루트)
docker compose up -d

# 2. 백엔드
cd backend
./gradlew bootRun
# http://localhost:8080/api/health → {"status":"ok","service":"danbi"}

# 3. 프론트
cd frontend
npm install
npx expo start
```

백엔드 DB 계정은 `docker-compose.yml`과 동일합니다 (`danbi` / `danbi_local_pw`, DB `danbi`, 포트 3306).

## AI Agent 개발

API 키 발급, 대화 세션 토큰, OpenAI Responses·Embeddings·음성 API,
프롬프트와 RAG, 패키지 구조 및 실행 예시는
[Agent 구현 가이드](backend/AGENTS_IMPLEMENTATION.md)를 참고하세요.
Agent API는 기본 비활성화이며, 활성화해도 모의 금융 데이터만 사용합니다.
