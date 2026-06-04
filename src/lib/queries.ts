import { supabase } from './supabase';
import { todayKey } from './date';
import type {
  Comment,
  Entry,
  FeedEntry,
  Message,
  PersonaId,
  Profile,
  Visibility,
} from './types';

/* ----------------------------- 내 일기 ----------------------------- */

export async function getMyEntries(userId: string): Promise<Entry[]> {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', userId)
    .order('entry_date', { ascending: false });
  if (error) throw error;
  return (data as Entry[]) ?? [];
}

/** 오늘 날짜의 일기를 가져오고 없으면 만든다 (페르소나 지정). */
export async function getOrCreateTodayEntry(
  userId: string,
  persona: PersonaId
): Promise<Entry> {
  const date = todayKey();
  const { data: existing } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', userId)
    .eq('entry_date', date)
    .maybeSingle();
  if (existing) return existing as Entry;

  const { data, error } = await supabase
    .from('entries')
    .insert({ user_id: userId, entry_date: date, persona })
    .select('*')
    .single();
  if (error) throw error;
  return data as Entry;
}

export async function updateEntryPersona(entryId: string, persona: PersonaId) {
  const { error } = await supabase
    .from('entries')
    .update({ persona })
    .eq('id', entryId);
  if (error) throw error;
}

export async function setEntryVisibility(entryId: string, visibility: Visibility) {
  const { error } = await supabase
    .from('entries')
    .update({ visibility })
    .eq('id', entryId);
  if (error) throw error;
}

/* ----------------------------- 메시지 ----------------------------- */

export async function getMessages(entryId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('entry_id', entryId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as Message[]) ?? [];
}

/* ----------------------------- 피드 / 탐색 ----------------------------- */

export async function getFeed(): Promise<FeedEntry[]> {
  const { data, error } = await supabase.rpc('get_feed');
  if (error) throw error;
  return (data as FeedEntry[]) ?? [];
}

export async function getExplore(): Promise<FeedEntry[]> {
  const { data, error } = await supabase.rpc('get_explore');
  if (error) throw error;
  return (data as FeedEntry[]) ?? [];
}

export async function getUserEntries(targetId: string): Promise<FeedEntry[]> {
  const { data, error } = await supabase.rpc('get_user_entries', {
    target: targetId,
  });
  if (error) throw error;
  return (data as FeedEntry[]) ?? [];
}

export async function getEntryDetail(entryId: string): Promise<FeedEntry | null> {
  const { data, error } = await supabase.rpc('get_entry_detail', {
    entry: entryId,
  });
  if (error) throw error;
  const rows = data as FeedEntry[];
  return rows?.[0] ?? null;
}

/* ----------------------------- 공감 / 댓글 ----------------------------- */

/** 공감 토글. 새 상태(공감 여부)를 반환. */
export async function toggleReaction(
  entryId: string,
  userId: string
): Promise<boolean> {
  const { data: existing } = await supabase
    .from('reactions')
    .select('id')
    .eq('entry_id', entryId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    await supabase.from('reactions').delete().eq('id', (existing as { id: string }).id);
    return false;
  }
  await supabase
    .from('reactions')
    .insert({ entry_id: entryId, user_id: userId, type: 'like' });
  return true;
}

export async function getComments(entryId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('*, author:profiles(username, display_name, avatar_url)')
    .eq('entry_id', entryId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as Comment[]) ?? [];
}

export async function addComment(
  entryId: string,
  userId: string,
  content: string
) {
  const { error } = await supabase
    .from('comments')
    .insert({ entry_id: entryId, user_id: userId, content });
  if (error) throw error;
}

/* ----------------------------- 팔로우 / 프로필 ----------------------------- */

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  return (data as Profile) ?? null;
}

export async function isFollowing(
  followerId: string,
  followeeId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', followerId)
    .eq('followee_id', followeeId)
    .maybeSingle();
  return Boolean(data);
}

export async function toggleFollow(
  followerId: string,
  followeeId: string
): Promise<boolean> {
  const following = await isFollowing(followerId, followeeId);
  if (following) {
    await supabase
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('followee_id', followeeId);
    return false;
  }
  await supabase
    .from('follows')
    .insert({ follower_id: followerId, followee_id: followeeId });
  return true;
}

/* ----------------------------- 알림 ----------------------------- */

export interface ActivityItem {
  id: string;
  type: 'reaction' | 'comment' | 'follow';
  actor_id: string;
  actor_username: string;
  actor_display_name: string | null;
  actor_avatar_url: string | null;
  entry_id: string | null;
  entry_title: string | null;
  content: string | null;
  created_at: string;
}

export async function getActivity(): Promise<ActivityItem[]> {
  const { data, error } = await supabase.rpc('get_activity');
  if (error) throw error;
  return (data as ActivityItem[]) ?? [];
}

export async function getFollowCounts(
  userId: string
): Promise<{ followers: number; following: number }> {
  const [{ count: followers }, { count: following }] = await Promise.all([
    supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('followee_id', userId),
    supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId),
  ]);
  return { followers: followers ?? 0, following: following ?? 0 };
}
