# 단비 (Danbi) — 시니어 은행 연습 앱 (Expo)

시니어 사용자를 위한 은행 업무 연습 프로토타입입니다. 큰 글씨 · 음성 안내 ·
"한 화면 한 행동" 원칙으로 계좌 개설(온보딩), 송금, 거래내역, 예·적금 조회,
금융 미션(O/X 퀴즈 · 보이스피싱 학습 · 송금 연습)을 실제와 비슷한 흐름으로 체험합니다.

이 디렉터리(`frontend/`)는 원본 웹 구현(`danbi_jj/`, Next.js)을
**Expo SDK 57 / expo-router / React Native** 로 이식한 것입니다. UI/UX, 시니어용
큰 글씨·여백·색상, 화면 흐름과 상태 머신을 최대한 그대로 유지했습니다.

---

## 설치

```bash
npm install
```

Pretendard OTF는 `assets/fonts/` 에 포함되어 있습니다. 런타임 로드에 실패하면
시스템 한글 폰트로 fallback 합니다. 재배포 조건은 `assets/fonts/OFL.txt`에 있습니다.

## 실행

```bash
npx expo start          # 개발 서버 (QR / 플랫폼 선택)
npx expo start --web     # 웹 (STT 실제 동작, Chrome/Edge 권장)
npx expo start --ios     # iOS 시뮬레이터
npx expo start --android # Android 에뮬레이터
npx expo run:ios          # 네이티브 STT가 포함된 iOS development build
npx expo run:android      # 네이티브 STT가 포함된 Android development build
```

`npm run web` / `npm run ios` / `npm run android` 스크립트도 동일하게 동작합니다.

## API 연결

Notion API 명세 중 홈 음성 질의, 나의 금융 독립/OX 퀴즈, 송금 연습 전체,
예·적금 조회, STT/TTS를 연결했습니다. `.env.example`을 복사해 로컬 환경 파일을
만들고 백엔드 주소를 지정하세요.

```bash
cp .env.example .env.local
# EXPO_PUBLIC_API_BASE_URL=http://localhost:8080
npx expo start --clear
```

- 설정값에는 `/api`를 붙이지 않습니다. 각 서비스가 `/api/...` 경로를 사용합니다.
- 실제 휴대폰에서는 `localhost` 대신 개발 PC의 LAN IP를 사용합니다.
- 환경 변수가 없으면 기존 로컬 연습 데이터와 기기 STT/TTS로 동작합니다.
- `EXPO_PUBLIC_API_TIMEOUT_MS`(기본 5000)로 요청 타임아웃을 조정할 수 있습니다.

### 서버 장애 시 동작

주소가 설정돼 있어도 API 호출은 "필수"가 아니라 "부가 향상"입니다. 실패·타임아웃 시
각 화면은 로컬/목 데이터로 이어서 동작합니다.

- **타임아웃**: 응답이 없으면 기본 5초 후 끊고 로컬 경로로 진입합니다.
- **서킷 브레이커**: 연속 3회 실패하면 약 15초간 API 호출을 건너뛰고 곧장 로컬로
  안내합니다(성공 1회 시 복구). 죽은 백엔드에 화면마다 타임아웃을 반복하지 않습니다.
- **응답 형식 방어**: 200이지만 명세와 다른 응답은 오류로 처리해 폴백이 받습니다.
- **홈 STT**: 기기 STT가 되는 환경에서는 기기 STT가 주 경로이고 서버 STT는 성공 시
  결과를 보정합니다(웹). 서버가 죽어도 인식 자체는 됩니다.
- **송금 연습**: 서버 전송은 점수 동기화용이라 실패해도 연습은 완료됩니다.
- 명세의 서버 구현 상태가 아직 `구현 전`인 API도 위 폴백으로 자연스럽게 로컬 동작합니다.

## 검증

```bash
npx tsc --noEmit    # 타입 오류 0
npm run lint        # Expo 57 ESLint + React Compiler 규칙
npm test            # 핵심 진입·거래·미션 도메인 회귀 테스트
npx expo-doctor     # 환경 점검
```

---

## 주요 라우트

expo-router 파일 기반 라우팅. 하위 흐름(송금·거래내역·예적금·미션·연습)은
별도 라우트가 아니라 **한 라우트 내부의 상태 머신**으로 구현되어 있습니다.

| 경로 | 화면 | 설명 |
|---|---|---|
| `/` (`src/app/index.tsx`) | 진입 게이트 | 폰트·저장소 hydrate 후 이동 경로 결정 |
| `/welcome` | 모드 선택 | 단비모드 / 기본 화면 선택 → `danbi.display-mode` 저장 |
| `/join` | 온보딩 | 계좌 개설 전체(약관 → 본인확인 OTP → 국민인증서 → 신분증 촬영 → 얼굴인증 → 1원 인증 → PIN 설정)를 하나의 내부 상태 머신으로 진행 |
| `/(app)/home` | 홈 | 계좌 요약, 빠른 메뉴, 미확인 거래 게이트 |
| `/(app)/transfer` | 송금 | `TransferFlow` 내부 상태 머신 (음성/직접 입력 → 받는 사람 → 은행 → 계좌 → 금액 → 확인 → PIN → 완료) + 선제적 도움 |
| `/(app)/history` | 거래내역 | `HistoryFlow` (월별 목록, 확인 결과 저장, 미래 월 차단) |
| `/(app)/accounts` | 예·적금 | `SavingsFlow` (상품 목록 → 상세 → 납입 내역) |
| `/(app)/practice` | 금융 미션 | `MissionMode` (허브 → O/X 퀴즈 · 보이스피싱 학습/시뮬 · 송금 연습 `PracticeMode`) |

진입 규칙 (`/`):

| 저장소 상태 | 이동 |
|---|---|
| `danbi.display-mode` 없음 | `/welcome` |
| 모드 있음 + 온보딩 미완료 | `/join` |
| 온보딩 완료 | `/(app)/home` |

---

## 폴더 구조

```
src/
  app/                     expo-router 라우트 (_layout, index, welcome, join, (app)/*)
  components/
    ui/                    AppText, Screen, Button, ProgressBar, Sheet, Keypad 등 공통 UI
    anim/                  ScreenIn, WaveBars, MicWaveRings, PulseHighlight (reanimated)
    icons/                 CloudMascot 등 react-native-svg 아이콘
  features/
    onboarding/            계좌 개설 흐름 (screens, components, hooks, help, id-capture)
    main/                  홈 · 송금 · 거래내역 · 예적금 (transfer, history, savings, imports)
    missions/              금융 미션 (hub, phishing, data) + PracticeMode 진입
    practice/              송금 연습 모드 (screens, components, hooks, data)
    shared/                여러 기능이 공유하는 목데이터
  lib/
    storage.ts             AsyncStorage 래퍼 + usePersistentState (hydrated 플래그)
    useAndroidBack.ts      Android 하드웨어 back 을 내부 상태 머신이 먼저 소비
    speech/
      tts.ts               expo-speech 기반 음성 안내 (speak / stop, 큐 모드 지원)
      recognition/          STT 엔진 레이어 (아래 참조)
  api/                     선택 API 계약 타입, 경로, 공통 fetch 클라이언트, 서비스
  theme/
    tokens.ts, fonts.ts   색상·간격·반경 토큰, 폰트 패밀리 resolver
  global.css               웹 전용 @font-face
assets/fonts/              Pretendard-{Regular,Medium,SemiBold,Bold,Black}.otf
```

---

## STT (음성 인식) — 플랫폼 차이

API 주소가 설정되면 `expo-audio`로 음성을 녹음해 서버 STT로 전송합니다. 주소가
없을 때는 기존 엔진 레이어(`src/lib/speech/recognition/`)를 사용합니다.

| 파일 | 대상 | 동작 |
|---|---|---|
| `engine.web.ts` | 웹 | `window.SpeechRecognition` / `webkitSpeechRecognition` 래핑 (실제 인식) |
| `engine.native.ts` | iOS / Android | `expo-speech-recognition` 기반 실제 인식 + 런타임 권한 처리 |
| `engine.ts` | 그 외 / 타입 해석 | 미지원 스텁 |

Metro 가 실행 플랫폼에 맞는 `.web` / `.native` 파일을 자동 선택합니다
(`import { recognitionEngine } from '@/lib/speech/recognition'`).

- **웹 STT 는 Chrome / Edge 에서 가장 안정적입니다.** Safari·Firefox 는 Web Speech
  API 지원이 제한적이거나 없습니다.
- **네이티브 STT는 development/release build가 필요합니다.** config plugin이
  마이크·음성 인식 권한 설명과 Android 음성 서비스 조회 설정을 빌드 시 추가합니다.
  Expo Go에는 해당 네이티브 모듈이 없으므로 마이크 동작은 오류 안내로 전환됩니다.

## fallbackTranscript 정책 (연습 모드 전용)

음성 인식이 불가능하거나 실패했을 때, **연습 모드(`PracticeMode`)에서만** 예시
문장(또는 미션 목 transcript)을 대신 사용해 흐름을 계속 진행합니다.

- 적용 위치: `src/lib/speech/useSpeechRecognition.ts` 의
  `fallbackTranscript` 옵션. 이 훅은 `PracticeVoiceScreen` 에서만 사용합니다.
- 발동 조건: `!supported` / `create() === null` / `onError` / 무음 `onEnd` /
  인식 실패 → `fallbackTranscript` 가 있으면 약 1.2초 뒤 `finish(fallbackTranscript)`.
- fallback 으로 채워진 값도 **실제 파서**(`voiceTransfer.ts`)를 그대로 거칩니다.
  예시 문장 탭도 하드코딩 없이 파서를 통과합니다. 실제 송금 데이터로 취급하지 않습니다.

**메인 송금(`TransferFlow`)은 fallbackTranscript 를 절대 사용하지 않습니다.**
`TransferFlow` 는 `useSpeechRecognition` 훅을 거치지 않고 `recognitionEngine.create()`
를 직접 호출하며, 인식 실패 시 자동 입력 없이 다음만 안내합니다:

> "음성을 잘 듣지 못했어요. 다시 말씀해주세요." + [다시 말하기] + [직접 입력]

두 정책은 코드 수준에서 분리되어 있습니다.

---

## 저장소 키 (AsyncStorage)

| 키 | 값 | 용도 |
|---|---|---|
| `danbi.display-mode` | `'danbi'` \| `'standard'` | 표시 모드 선택 |
| `danbi.onboarding.completed` | `'true'` | 온보딩(계좌 개설) 완료 |
| `danbi.onboarding.draft` | 안전한 체크포인트(JSON) | 온보딩 중단 후 재개. 이름·전화번호·OTP·계좌 인증번호·PIN은 저장하지 않음 |
| `danbi.signup-complete` | (legacy, 읽기 전용) | 존재하면 `onboarding.completed` 로 승격 |
| `danbi.missions.completed` | `MissionId[]` (JSON) | 완료한 미션 목록 |
| `danbi.daily.practice` | `Record<날짜, MissionId>` (JSON) | 날짜별 오늘의 연습 완료 기록 |
| `danbi.quiz.record` | `Record<날짜, { qId, answeredIndex }>` (JSON) | 날짜별 O/X 퀴즈 응답 (같은 날 재획득 불가) |
| `danbi.transactions.reviews` | `Record<거래 ID, 'known' \| 'unknown'>` (JSON) | 미확인 거래 확인 결과 |

- hydrate 완료 전에는 화면을 렌더하지 않아(스플래시 유지 / `{null}` 게이트)
  잘못된 "완료" 상태가 깜빡이지 않습니다.
- 온보딩 도중 앱이 종료되어도 안전한 체크포인트부터 재개합니다. 민감 입력이 필요한
  인증 경계를 건너뛰지 않으며, 완료 후 임시 체크포인트는 삭제합니다.

## 폰트 fallback

`src/theme/fonts.ts` 가 weight 별로 단일 `fontFamily` 값을 반환합니다.

1. **Pretendard** (`assets/fonts/*.otf`, `expo-font` `useFonts` 로 로드, OFL 1.1)
2. 시스템 기본 한글 폰트 (`undefined`)

`Font.isLoaded()` 결과에 따라 실제 로드된 패밀리명만 사용하므로, 런타임 폰트 로드가
실패하면 시스템 글꼴을 사용합니다. OTF 파일 자체는 앱 번들에 포함되어야 합니다.

---

## 테스트용 입력값

온보딩(`/join`):

| 단계 | 값 |
|---|---|
| 휴대폰 본인확인 OTP | `381529` |
| 1원 인증 코드 | `4821` |
| PIN | 6자리 자유 입력 → 동일하게 재입력 |

송금(`/(app)/transfer`):

- 홈 → 돈 보내기 → 받는 사람 → 은행 → 계좌번호(8자리 이상) → 금액 → 송금 전 확인
  → 비밀번호 4자리 → 완료
- 확인 지점: 신규 계좌 경고, 100만원 이상 경고(`largeAmountThreshold = 1,000,000`),
  통화 중 송금 경고, 보이스피싱 경고, 입금자명 변경
- 송금 연습 PIN: 서버 연동용 고정 번호 `1234`

선제적 도움(송금 화면): 약 20초 무입력 → 관련 영역 하이라이트 → 음성 안내 →
상담원 연결 제안. 상담원 연결은 평일 09–18시(`isWithinBusinessHours`) 여부로 분기.

---

## 알려진 한계

- **기기 내 네이티브 STT는 Expo Go에서 미지원** — API 주소가 없는 iOS/Android 음성
  인식은 config plugin이 포함된 development/release build에서 시험해야 합니다.
- **웹 브라우저 STT 호환성** — Chrome / Edge 권장. Safari·Firefox 는 Web Speech
  API 미지원 또는 부분 지원이라 인식이 안 되거나 불안정할 수 있습니다.
- **fallbackTranscript 는 연습 모드에서만** 사용합니다. 메인 `TransferFlow` 는
  절대 사용하지 않습니다.
- 원본의 일부 Figma export / CSS 애니메이션 요소는 `react-native-svg` ·
  `react-native-reanimated` 로 **시각적으로 근사 처리**했습니다(픽셀 퍼펙트가 아닌
  구성·정보 구조·가독성 우선).
- 신분증 촬영 · 얼굴 인증은 원본과 동일하게 **목(mock)** 입니다(`expo-camera` 미사용).
