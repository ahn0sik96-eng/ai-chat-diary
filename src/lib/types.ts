export type Visibility = 'private' | 'followers' | 'public';
export type EntryStatus = 'draft' | 'done';
export type MessageRole = 'user' | 'assistant' | 'system';

/** AI 페르소나 식별자 (src/data/personas.ts 와 동기화). */
export type PersonaId =
  | 'bestie'
  | 'poet'
  | 'cheer'
  | 'calm'
  | 'tsun'
  | 'mentor';

/** 감정 태그 (요약 시 AI 가 이 중 하나로 분류). */
export type Mood =
  | 'joy'
  | 'calm'
  | 'sad'
  | 'anxious'
  | 'angry'
  | 'tired'
  | 'love'
  | 'grateful';

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  default_persona: PersonaId;
  created_at: string;
}

export interface Entry {
  id: string;
  user_id: string;
  entry_date: string; // YYYY-MM-DD
  title: string | null;
  summary: string | null;
  mood: Mood | null;
  persona: PersonaId;
  status: EntryStatus;
  visibility: Visibility;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  entry_id: string;
  user_id: string;
  role: MessageRole;
  content: string;
  created_at: string;
}

export interface Comment {
  id: string;
  entry_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author?: Pick<Profile, 'username' | 'display_name' | 'avatar_url'>;
}

/** 피드/상세에 쓰이는 일기 + 작성자 + 집계 정보. */
export interface FeedEntry extends Entry {
  author: Pick<Profile, 'username' | 'display_name' | 'avatar_url'>;
  reaction_count: number;
  comment_count: number;
  reacted: boolean;
}
