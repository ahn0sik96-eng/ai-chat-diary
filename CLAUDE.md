# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Start Expo dev server (opens QR code / simulator picker)
npm run android    # Run on Android emulator
npm run ios        # Run on iOS simulator
npm run web        # Run in browser via Metro
npm run typecheck  # TypeScript check (tsc --noEmit)
npm run lint       # Expo lint
```

There is no test suite yet; `npm run typecheck` is the primary correctness gate.

## Architecture

This is a React Native (Expo SDK 51) app with **Expo Router v3** file-based routing.

### Routing

`app/_layout.tsx` defines a bottom-tab navigator with three visible tabs (`index`, `archive`, `store`) and one hidden route (`chat`). Navigation from the home screen to the chat screen passes `personaId` as a route param (`router.push({ pathname: '/chat', params: { personaId } })`).

### Persona system

`constants/personas.ts` is the source of truth for the four AI personas. Each `Persona` carries its own `accentColor`/`accentLight` (pastel palette) and a `systemPrompt` string fed verbatim to the Claude API. Wherever a persona's colours are needed in UI (Bubble background, PersonaSelector card, CTA button, etc.) they come from the selected persona object — never hardcoded.

### AI integration (`utils/ai.ts`)

Calls Claude's `/v1/messages` REST endpoint directly from the client using `EXPO_PUBLIC_CLAUDE_API_KEY`. The current model is `claude-haiku-4-5-20251001`. The full `messages` history is sent on every turn (no pruning yet). To swap to a server-side proxy, replace the `fetch` call in `sendMessage` and remove the API key env var.

### Supabase integration (`utils/supabase.ts`)

Client is initialised with `AsyncStorage` for session persistence. Requires `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`. The `diary_entries` table must exist with columns `id uuid`, `user_id text`, `persona_id text`, `title text`, `messages jsonb`, `created_at timestamptz`, `updated_at timestamptz`. Copy `.env.example` to `.env.local` to configure.

### Environment variables

All runtime env vars are `EXPO_PUBLIC_*` (bundled at build time by Expo). Keep actual keys in `.env.local` (gitignored). The app degrades gracefully when Supabase is unconfigured (archive shows empty state); it throws an explicit error when the Claude key is missing.

### Design tokens

`constants/theme.ts` exports `Colors`, `Radius`, `Spacing`, and `FontSize`. Use these constants everywhere — no raw hex values or magic numbers in component files. Background is `Colors.background` (`#FFFAF8`), text is `Colors.text` (`#333333`), all interactive surfaces use pastel persona colours.

### Monetisation model

Chat and archive are **fully free**. The Store screen (`app/store.tsx`) sells decorative fonts and sticker packs (`StoreItem.type: 'font' | 'sticker'`). Store items are currently mocked locally; wire them to a `store_items` Supabase table and a payment provider (e.g. RevenueCat) for production.
