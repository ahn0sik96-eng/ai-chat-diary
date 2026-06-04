# Lumi · AI 일기장

AI와 대화하며 하루를 기록하는 일기 앱. 가볍게 채팅하다 보면 어느새 하루가
한 편의 일기로 정리됩니다.

> 모던 & 세련된 다크 테마 · 글래스모피즘 UI · 완전 반응형

## ✨ 주요 기능

- **AI 채팅 일기 작성** (`/write`) — Lumi와 대화하면 자동으로 감정을
  추론하고, 대화 내용을 제목·요약·태그가 있는 일기로 정리합니다.
- **홈 대시보드** (`/`) — 시간대별 인사말, 오늘의 기록, 연속 기록(스트릭),
  이번 달 통계, 감정의 흐름, 최근 일기를 한눈에.
- **일기장** (`/entries`) — 제목·내용·태그 검색 및 감정별 필터.
- **달력** (`/calendar`) — 월별 캘린더에 하루하루의 감정을 시각화.
- **일기 상세** (`/entries/[id]`) — 정리된 일기와 함께 나눈 대화 다시 보기.

데이터는 브라우저 `localStorage`에 저장되며, AI 응답은 오프라인 목(mock)
엔진으로 동작해 별도의 API 키가 필요 없습니다.

## 🛠 기술 스택

- **Next.js 16** (App Router) + **React 19**
- **TypeScript**
- **Tailwind CSS v4** — 커스텀 디자인 토큰 & 글래스/그라데이션 유틸리티
- 폰트: Geist Sans/Mono, Fraunces (디스플레이)

## 🚀 시작하기

```bash
npm install
npm run dev      # http://localhost:3000
```

```bash
npm run build && npm run start   # 프로덕션
```

## 📁 구조

```
app/
  layout.tsx            # 루트 레이아웃 · 폰트 · DiaryProvider · AppShell
  page.tsx              # 홈 대시보드
  write/page.tsx        # AI 채팅 일기 작성
  entries/page.tsx      # 일기 목록 (검색·필터)
  entries/[id]/page.tsx # 일기 상세
  calendar/page.tsx     # 월별 달력
  globals.css           # 디자인 토큰 · 글래스/그라데이션 유틸리티
components/
  app-shell.tsx         # 사이드바 + 모바일 하단 탭 내비게이션
  entry-card.tsx        # 일기 카드
  chat-bubble.tsx       # 채팅 버블 · 타이핑 인디케이터
  mood-badge.tsx        # 감정 배지
  icons.tsx             # 인라인 SVG 아이콘
lib/
  store.tsx             # localStorage 기반 일기 저장소 (React Context)
  ai.ts                 # 오프라인 목 AI (응답·감정 추론·요약)
  moods.ts              # 감정 정의
  mockData.ts           # 시드 일기
  types.ts · utils.ts   # 타입 · 날짜/유틸 헬퍼
```
