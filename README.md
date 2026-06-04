# 마음일기 (AI Chat Diary)

AI 채팅을 기반으로 하루를 일기로 남기고, 예쁘게 꾸미는 모바일 앱.
**컨셉: 인스타그램 + AI 채팅 앱.**

> Expo (React Native) · TypeScript · 로컬 저장(SQLite) · xAI Grok API

## ✨ 핵심 기능 (MVP 구현 완료)

1. **AI 채팅** — 진짜 친구처럼 느껴지는 말투. 5개 페르소나
   - 다정한 친구 🧸 · 정신과 의사 🩺 · 재밌는 친구 🤪 · 멋있는 선배 😎 · 따뜻한 부모님 🌷
   - 페르소나 말투는 `src/config/personas.ts` 에서 직접 다듬을 수 있어요.
2. **일기 요약** — 대화를 사람이 쓴 듯한 일기로. 3가지 스타일
   - 일반 📓 · 감정 💗 · 시적 🌙 (`src/config/diaryStyles.ts`)
   - 요약은 **문장 단위로 분리**되어 꾸미기 캔버스의 개별 요소가 됩니다.
3. **다이어리 꾸미기** — 시그니처 기능
   - 문장/스티커를 **드래그·핀치로 크기조절·회전**, z-순서 정렬, 배경 변경
   - 저장(레이아웃 + 커버 이미지) 및 갤러리로 내보내기

소셜(팔로우·피드)은 추후 추가 예정 — 데이터 계층(`src/data`)이 추상화되어 있어
나중에 Supabase 등으로 교체하기 쉽습니다.

## 🚀 실행 방법

```bash
npm install            # 의존성 설치 (필요 시 --legacy-peer-deps)
npx expo start         # 개발 서버 시작
```

- **Expo Go** 또는 **개발 빌드**에서 실행하세요.
- 제스처/리애니메이티드/뷰샷이 들어가므로 가능하면 개발 빌드(`npx expo run:ios` /
  `npx expo run:android`)에서 확인하는 것을 권장합니다.

### Grok API 키

- 앱 내 **프로필 → Grok API 키** 화면에서 xAI 키(`xai-...`)를 입력하세요.
  키는 기기 보안 저장소(`expo-secure-store`)에만 저장됩니다.
- **키 없이도** 전체 흐름(채팅 → 요약 → 꾸미기 → 저장)을 예시(mock) 응답으로
  테스트할 수 있습니다.
- 키 검증용 빠른 점검:
  ```bash
  curl https://api.x.ai/v1/chat/completions \
    -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
    -d '{"model":"grok-4.3","messages":[{"role":"user","content":"안녕"}]}'
  ```

> ⚠️ **보안:** 현재는 키가 기기에 저장됩니다(개인/테스트용으로 적합). 정식 출시 전에는
> 반드시 서버 프록시(예: Supabase Edge Function)로 키를 숨기도록 변경해야 합니다.

## 🧩 스티커 추가하기

지금은 이모지 스티커로 바로 동작합니다(에셋 불필요).
이미지 스티커를 추가하려면:

1. PNG 파일을 `src/assets/stickers/` 에 넣고
2. `src/assets/stickers/manifest.ts` 에 항목 추가:
   ```ts
   { id: 'my_sticker', type: 'image', category: 'cute', source: require('./my_sticker.png') }
   ```

## 📁 구조

```
app/                      # 화면 (expo-router)
  (tabs)/                 # 하단 탭: 일기(피드)·채팅·프로필
  session/[sessionId]     # 채팅 대화
  diary/summarize/...     # 요약 (스타일 선택 → 생성 → 미리보기)
  diary/decorate/...      # 꾸미기 캔버스 (시그니처)
  diary/[diaryId]         # 일기 보기
  settings/               # API 키 · 페르소나 · 설정
src/
  config/                 # personas, diaryStyles, grok.config  ← 자주 수정
  api/                    # grokClient(스트리밍), chat/summarize 서비스, mock
  data/                   # SQLite + repositories (백엔드 교체 대비 추상화)
  state/                  # zustand 스토어 (settings, decoration)
  components/canvas/      # DiaryCanvas, DraggableElement, StickerTray
  assets/stickers/        # 스티커 매니페스트
  theme/                  # 디자인 토큰
```

## 🛠️ 기술 메모

- **Grok**: `https://api.x.ai/v1` OpenAI 호환, 기본 모델 `grok-4.3`, SSE 스트리밍(`expo/fetch`).
- **요약 파서**: JSON(`{title, mood, sentences[]}`) 우선, 실패 시 문장 경계로 분할하는
  방어적 파서라 잘못된 응답에도 꾸미기 흐름이 끊기지 않습니다.
- **캔버스**: `react-native-gesture-handler` + `react-native-reanimated` 로 60fps 제스처.
