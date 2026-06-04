# 무디 (Moody) — AI 채팅 일기 앱

AI와 **대화하듯** 하루를 기록하면, 그 대화를 바탕으로 AI가 **그날의 일기를 자동으로 요약·생성**해 줍니다.
거기에 인스타그램처럼 친구를 **팔로우**하고 일기를 **공유**할 수 있는 소셜 기능, 그리고 기분에 맞춰 고르는 **AI 페르소나**까지.

- **플랫폼**: React Native (Expo, TypeScript, Expo Router)
- **AI**: Grok (xAI) — Supabase Edge Function 을 통해 호출 (API 키는 서버에만 보관)
- **백엔드**: Supabase (Auth + Postgres + Edge Functions, Row Level Security)
- **디자인**: 다크 + 글래스모피즘, 커스텀 라인 아이콘(이모지 미사용), 인스타그램식 5탭 IA

> 주 타깃: 10·20대. 감성적이고 세련된 무드를 1순위로 설계했습니다.

---

## 주요 기능

| 영역 | 내용 |
| --- | --- |
| 일기 작성 | 선택한 AI 페르소나와 채팅 → "완성" 시 제목/요약/감정 자동 생성 |
| AI 페르소나 | 다정한 단짝 · 감성 시인 · 텐션 응원단 · 차분한 상담사 · 츤데레 · 든든한 멘토 |
| 소셜 | 팔로우, 공개/팔로워 공유, 공감(하트), 댓글, 피드/탐색 |
| 프라이버시 | 일기는 **기본 비공개**. 대화 원문은 **항상 비공개**, 공유 시 요약만 노출 |

---

## 빠른 시작 (앱 실행)

```bash
npm install
cp .env.example .env   # 값 채우기 (아래 참고)
npx expo start         # Expo Go 앱으로 QR 스캔 / npx expo start --web 으로 웹 미리보기
```

`.env` 에는 **공개 키**만 넣습니다:

```
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

> `.env` 가 비어 있으면 앱은 크래시 대신 "설정이 필요해요" 안내 화면을 보여줍니다.

---

## Supabase 셋업

1. **프로젝트 생성** — [supabase.com](https://supabase.com) 에서 새 프로젝트를 만들고
   `Project Settings → API` 에서 `URL`, `anon key` 를 복사해 `.env` 에 넣습니다.

2. **CLI 연결 & 마이그레이션**
   ```bash
   npm i -g supabase
   supabase login
   supabase link --project-ref <project-ref>
   supabase db push        # supabase/migrations/0001_init.sql 적용
   ```
   테이블·RLS·트리거와 피드용 RPC(`get_feed`, `get_explore`, `get_user_entries`,
   `get_entry_detail`, `get_activity`)가 생성됩니다.

3. **Edge Function 배포 & 시크릿 설정** (Grok 키는 여기에만!)
   ```bash
   supabase functions deploy chat summarize
   supabase secrets set GROK_API_KEY=xai-xxxxxxxx
   supabase secrets set GROK_MODEL=grok-3        # 선택, 기본값 grok-3
   ```

4. **이메일 인증** — 개발 중에는 `Authentication → Providers → Email` 에서
   "Confirm email" 을 꺼두면 가입 즉시 로그인할 수 있어 테스트가 편합니다.

---

## 프로젝트 구조

```
app/                      # 화면 (Expo Router)
  (auth)/                 # 로그인 / 회원가입
  (app)/
    (tabs)/               # 피드 · 탐색 · 알림 · 프로필 (가운데 '글쓰기' 버튼)
    chat.tsx              # AI 채팅 → 일기 작성
    entry/[id].tsx        # 일기 상세 (공개범위·공감·댓글)
    user/[id].tsx         # 다른 사용자 프로필 + 팔로우
    personas.tsx          # 페르소나 선택
    settings.tsx
src/
  components/             # GlassCard, FeedCard, ChatBubble, TabBar ...
  data/                   # personas.ts, moods.ts
  hooks/useAuth.tsx
  lib/                    # supabase, api(Edge Function), queries, types, date
  theme/                  # 다크 글래스모피즘 토큰
supabase/
  migrations/0001_init.sql
  functions/chat, functions/summarize, functions/_shared
```

---

## 검증

```bash
npm run typecheck          # 타입 체크
npx expo start --web       # 웹에서 화면/플로우 스모크 확인
```

기기에서의 전체 흐름(가입 → 페르소나 선택 → 채팅 → 일기 완성 → 공개 전환 →
다른 계정에서 피드/공감/댓글/팔로우)은 Supabase 셋업 후 Expo Go 로 확인하세요.

---

## 다음 단계 (아이디어)

- 푸시 알림(expo-notifications), 검색, 일기 내보내기
- 커스텀 페르소나 만들기, 감정 통계/캘린더 뷰
- 신고/차단 등 커뮤니티 안전 장치
