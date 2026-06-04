-- ============================================================================
--  무디 (Moody) — AI 채팅 일기 앱 초기 스키마
--  테이블 + RLS + 트리거 + 피드/알림 RPC
-- ============================================================================

-- ----------------------------------------------------------------------------
--  profiles : auth.users 와 1:1
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  username        text unique not null,
  display_name    text,
  avatar_url      text,
  bio             text,
  default_persona text not null default 'bestie',
  created_at      timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
--  entries : 하루 한 개의 일기
-- ----------------------------------------------------------------------------
create table if not exists public.entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  entry_date  date not null,
  title       text,
  summary     text,
  mood        text,
  persona     text not null default 'bestie',
  status      text not null default 'draft' check (status in ('draft', 'done')),
  visibility  text not null default 'private' check (visibility in ('private', 'followers', 'public')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, entry_date)
);
create index if not exists entries_user_idx on public.entries (user_id, entry_date desc);
create index if not exists entries_feed_idx on public.entries (visibility, status, created_at desc);

-- ----------------------------------------------------------------------------
--  messages : 대화 원문 (항상 비공개 — 작성자만 조회)
-- ----------------------------------------------------------------------------
create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  entry_id   uuid not null references public.entries (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  role       text not null check (role in ('user', 'assistant', 'system')),
  content    text not null,
  created_at timestamptz not null default now()
);
create index if not exists messages_entry_idx on public.messages (entry_id, created_at);

-- ----------------------------------------------------------------------------
--  follows / reactions / comments
-- ----------------------------------------------------------------------------
create table if not exists public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  followee_id uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

create table if not exists public.reactions (
  id         uuid primary key default gen_random_uuid(),
  entry_id   uuid not null references public.entries (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  type       text not null default 'like',
  created_at timestamptz not null default now(),
  unique (entry_id, user_id, type)
);

create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  entry_id   uuid not null references public.entries (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  content    text not null,
  created_at timestamptz not null default now()
);
create index if not exists comments_entry_idx on public.comments (entry_id, created_at);

-- ----------------------------------------------------------------------------
--  트리거: 신규 가입 시 profiles 자동 생성 + entries.updated_at 갱신
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  uname text;
begin
  uname := coalesce(
    nullif(new.raw_user_meta_data ->> 'username', ''),
    'user_' || substr(new.id::text, 1, 8)
  );
  -- username 충돌 시 짧은 접미사 부여
  if exists (select 1 from public.profiles where username = uname) then
    uname := uname || '_' || substr(new.id::text, 1, 4);
  end if;

  insert into public.profiles (id, username, display_name)
  values (new.id, uname, uname)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists entries_touch_updated on public.entries;
create trigger entries_touch_updated
  before update on public.entries
  for each row execute function public.touch_updated_at();

-- ============================================================================
--  RLS
-- ============================================================================
alter table public.profiles  enable row level security;
alter table public.entries   enable row level security;
alter table public.messages  enable row level security;
alter table public.follows   enable row level security;
alter table public.reactions enable row level security;
alter table public.comments  enable row level security;

-- profiles : 누구나(로그인) 조회, 본인만 수정
create policy "profiles_select" on public.profiles
  for select to authenticated using (true);
create policy "profiles_insert" on public.profiles
  for insert to authenticated with check (id = auth.uid());
create policy "profiles_update" on public.profiles
  for update to authenticated using (id = auth.uid());

-- entries : 본인 전체 / 공개 / 팔로워 공개는 팔로워에게
create policy "entries_select" on public.entries
  for select to authenticated using (
    user_id = auth.uid()
    or visibility = 'public'
    or (
      visibility = 'followers'
      and exists (
        select 1 from public.follows f
        where f.follower_id = auth.uid() and f.followee_id = entries.user_id
      )
    )
  );
create policy "entries_insert" on public.entries
  for insert to authenticated with check (user_id = auth.uid());
create policy "entries_update" on public.entries
  for update to authenticated using (user_id = auth.uid());
create policy "entries_delete" on public.entries
  for delete to authenticated using (user_id = auth.uid());

-- messages : 작성자 본인만 (대화 원문 비공개)
create policy "messages_select" on public.messages
  for select to authenticated using (user_id = auth.uid());
create policy "messages_insert" on public.messages
  for insert to authenticated with check (user_id = auth.uid());

-- follows : 조회 공개, 본인 관계만 생성/삭제
create policy "follows_select" on public.follows
  for select to authenticated using (true);
create policy "follows_insert" on public.follows
  for insert to authenticated with check (follower_id = auth.uid());
create policy "follows_delete" on public.follows
  for delete to authenticated using (follower_id = auth.uid());

-- reactions : 조회 공개, 본인 것만 생성/삭제
create policy "reactions_select" on public.reactions
  for select to authenticated using (true);
create policy "reactions_insert" on public.reactions
  for insert to authenticated with check (user_id = auth.uid());
create policy "reactions_delete" on public.reactions
  for delete to authenticated using (user_id = auth.uid());

-- comments : 조회 공개, 본인 것만 생성/수정/삭제
create policy "comments_select" on public.comments
  for select to authenticated using (true);
create policy "comments_insert" on public.comments
  for insert to authenticated with check (user_id = auth.uid());
create policy "comments_update" on public.comments
  for update to authenticated using (user_id = auth.uid());
create policy "comments_delete" on public.comments
  for delete to authenticated using (user_id = auth.uid());

-- ============================================================================
--  RPC : 피드 / 탐색 / 프로필 / 상세 / 알림
--  (SECURITY DEFINER — 집계를 위해 RLS 우회하되 가시성 규칙을 명시적으로 적용)
-- ============================================================================
-- 공통 반환 형태를 재사용하기 위한 매크로 대신 각 함수에서 동일 컬럼을 정의한다.

create or replace function public.get_feed()
returns table (
  id uuid, user_id uuid, entry_date date, title text, summary text,
  mood text, persona text, status text, visibility text,
  created_at timestamptz, updated_at timestamptz,
  author jsonb, reaction_count bigint, comment_count bigint, reacted boolean
)
language sql security definer set search_path = public as $$
  select e.id, e.user_id, e.entry_date, e.title, e.summary, e.mood, e.persona,
         e.status, e.visibility, e.created_at, e.updated_at,
         jsonb_build_object('username', p.username, 'display_name', p.display_name, 'avatar_url', p.avatar_url),
         (select count(*) from public.reactions r where r.entry_id = e.id),
         (select count(*) from public.comments c where c.entry_id = e.id),
         exists (select 1 from public.reactions r where r.entry_id = e.id and r.user_id = auth.uid())
  from public.entries e
  join public.profiles p on p.id = e.user_id
  where e.status = 'done'
    and e.user_id <> auth.uid()
    and e.visibility in ('public', 'followers')
    and e.user_id in (select followee_id from public.follows where follower_id = auth.uid())
  order by e.created_at desc
  limit 100;
$$;

create or replace function public.get_explore()
returns table (
  id uuid, user_id uuid, entry_date date, title text, summary text,
  mood text, persona text, status text, visibility text,
  created_at timestamptz, updated_at timestamptz,
  author jsonb, reaction_count bigint, comment_count bigint, reacted boolean
)
language sql security definer set search_path = public as $$
  select e.id, e.user_id, e.entry_date, e.title, e.summary, e.mood, e.persona,
         e.status, e.visibility, e.created_at, e.updated_at,
         jsonb_build_object('username', p.username, 'display_name', p.display_name, 'avatar_url', p.avatar_url),
         (select count(*) from public.reactions r where r.entry_id = e.id),
         (select count(*) from public.comments c where c.entry_id = e.id),
         exists (select 1 from public.reactions r where r.entry_id = e.id and r.user_id = auth.uid())
  from public.entries e
  join public.profiles p on p.id = e.user_id
  where e.status = 'done' and e.visibility = 'public'
  order by e.created_at desc
  limit 100;
$$;

create or replace function public.get_user_entries(target uuid)
returns table (
  id uuid, user_id uuid, entry_date date, title text, summary text,
  mood text, persona text, status text, visibility text,
  created_at timestamptz, updated_at timestamptz,
  author jsonb, reaction_count bigint, comment_count bigint, reacted boolean
)
language sql security definer set search_path = public as $$
  select e.id, e.user_id, e.entry_date, e.title, e.summary, e.mood, e.persona,
         e.status, e.visibility, e.created_at, e.updated_at,
         jsonb_build_object('username', p.username, 'display_name', p.display_name, 'avatar_url', p.avatar_url),
         (select count(*) from public.reactions r where r.entry_id = e.id),
         (select count(*) from public.comments c where c.entry_id = e.id),
         exists (select 1 from public.reactions r where r.entry_id = e.id and r.user_id = auth.uid())
  from public.entries e
  join public.profiles p on p.id = e.user_id
  where e.user_id = target
    and e.status = 'done'
    and (
      target = auth.uid()
      or e.visibility = 'public'
      or (e.visibility = 'followers'
          and exists (select 1 from public.follows f
                      where f.follower_id = auth.uid() and f.followee_id = target))
    )
  order by e.entry_date desc
  limit 200;
$$;

create or replace function public.get_entry_detail(entry uuid)
returns table (
  id uuid, user_id uuid, entry_date date, title text, summary text,
  mood text, persona text, status text, visibility text,
  created_at timestamptz, updated_at timestamptz,
  author jsonb, reaction_count bigint, comment_count bigint, reacted boolean
)
language sql security definer set search_path = public as $$
  select e.id, e.user_id, e.entry_date, e.title, e.summary, e.mood, e.persona,
         e.status, e.visibility, e.created_at, e.updated_at,
         jsonb_build_object('username', p.username, 'display_name', p.display_name, 'avatar_url', p.avatar_url),
         (select count(*) from public.reactions r where r.entry_id = e.id),
         (select count(*) from public.comments c where c.entry_id = e.id),
         exists (select 1 from public.reactions r where r.entry_id = e.id and r.user_id = auth.uid())
  from public.entries e
  join public.profiles p on p.id = e.user_id
  where e.id = entry
    and (
      e.user_id = auth.uid()
      or e.visibility = 'public'
      or (e.visibility = 'followers'
          and exists (select 1 from public.follows f
                      where f.follower_id = auth.uid() and f.followee_id = e.user_id))
    );
$$;

create or replace function public.get_activity()
returns table (
  id uuid, type text, actor_id uuid, actor_username text,
  actor_display_name text, actor_avatar_url text,
  entry_id uuid, entry_title text, content text, created_at timestamptz
)
language sql security definer set search_path = public as $$
  select r.id, 'reaction', r.user_id, p.username, p.display_name, p.avatar_url,
         e.id, e.title, null::text, r.created_at
  from public.reactions r
  join public.entries e on e.id = r.entry_id
  join public.profiles p on p.id = r.user_id
  where e.user_id = auth.uid() and r.user_id <> auth.uid()
  union all
  select c.id, 'comment', c.user_id, p.username, p.display_name, p.avatar_url,
         e.id, e.title, c.content, c.created_at
  from public.comments c
  join public.entries e on e.id = c.entry_id
  join public.profiles p on p.id = c.user_id
  where e.user_id = auth.uid() and c.user_id <> auth.uid()
  union all
  select f.follower_id, 'follow', f.follower_id, p.username, p.display_name, p.avatar_url,
         null::uuid, null::text, null::text, f.created_at
  from public.follows f
  join public.profiles p on p.id = f.follower_id
  where f.followee_id = auth.uid()
  order by created_at desc
  limit 100;
$$;

grant execute on function
  public.get_feed(), public.get_explore(), public.get_user_entries(uuid),
  public.get_entry_detail(uuid), public.get_activity()
to authenticated;
