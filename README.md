# Lumi · AI 일기장 (모바일 앱)

AI와 대화하며 하루를 기록하는 **iOS / Android 네이티브 앱**. 가볍게 채팅하다
보면 어느새 하루가 한 편의 일기로 정리됩니다.

> 모던 & 세련된 다크 테마 · 글래스모피즘 UI · 그라데이션 액센트

## ✨ 주요 기능

- **AI 채팅 일기 작성** (`오늘 쓰기`) — Lumi와 대화하면 감정을 자동으로
  추론하고, 대화 내용을 제목·요약·태그가 있는 일기로 정리합니다.
- **홈 대시보드** — 시간대별 인사말, 오늘의 기록, 연속 기록(스트릭),
  이번 달 통계, 감정의 흐름, 최근 일기.
- **일기장** — 제목·내용·태그 검색 및 감정별 필터.
- **달력** — 월별 캘린더에 하루하루의 감정을 시각화.
- **일기 상세** — 정리된 일기와 함께 Lumi와 나눈 대화 다시 보기 / 삭제.

데이터는 기기 내 `AsyncStorage`에 저장되며, AI 응답은 오프라인 목(mock)
엔진으로 동작해 별도의 API 키 없이 바로 실행됩니다.

## 🛠 기술 스택

- **Expo SDK 56** · **React Native 0.85** · **React 19**
- **expo-router** (파일 기반 라우팅) · React Compiler
- **TypeScript**
- `expo-linear-gradient` (그라데이션) · `expo-blur` (글래스 탭바)
- `@expo/vector-icons` (Ionicons) · `@react-native-async-storage/async-storage`

## 🚀 실행하기

```bash
npm install
npx expo start          # QR 코드 → Expo Go 또는 개발 빌드로 열기
```

플랫폼별 실행:

```bash
npm run ios       # iOS 시뮬레이터 (macOS)
npm run android   # Android 에뮬레이터
npm run web       # 브라우저 미리보기 (react-native-web)
```

품질 검사:

```bash
npx tsc --noEmit   # 타입 체크
npm run lint       # ESLint (expo)
```

## 📁 구조

```
src/
  app/                       # expo-router 라우트
    _layout.tsx              # 루트 Stack + DiaryProvider + SafeArea
    (tabs)/_layout.tsx       # 커스텀 글래스 탭바
    (tabs)/index.tsx         # 홈 대시보드
    (tabs)/write.tsx         # AI 채팅 일기 작성
    (tabs)/entries.tsx       # 일기 목록 (검색·필터)
    (tabs)/calendar.tsx      # 월별 달력
    entry/[id].tsx           # 일기 상세
  components/
    tab-bar.tsx              # 플로팅 글래스 하단 탭바
    entry-card.tsx           # 일기 카드
    chat-bubble.tsx          # 채팅 버블 · 타이핑 인디케이터
    mood-badge.tsx           # 감정 배지 · 타일
    gradient.tsx             # 그라데이션 버튼 · 브랜드 마크
    screen.tsx               # 배경(앰비언트 글로우) 래퍼
    glass.tsx                # 글래스 서피스
  lib/
    store.tsx                # AsyncStorage 기반 일기 저장소 (Context)
    ai.ts                    # 오프라인 목 AI (응답·감정 추론·요약)
    moods.ts                 # 감정 정의
    mockData.ts              # 시드 일기
    types.ts · utils.ts      # 타입 · 날짜/유틸 헬퍼
  theme.ts                   # 디자인 토큰 (색·간격·반경·그라데이션)
```
