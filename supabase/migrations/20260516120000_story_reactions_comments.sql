-- Reacciones y comentarios en historias de adopción (public.success_stories).
-- user_id apunta a public.profiles(id), alineado con RLS (auth.uid()) y embeds en el cliente.

create table public.story_reactions (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.success_stories (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  reaction_type text not null check (reaction_type in ('heart', 'paw', 'cry', 'wow')),
  created_at timestamptz default now(),
  unique (story_id, user_id, reaction_type)
);

alter table public.story_reactions enable row level security;

create policy "reactions_select" on public.story_reactions for select using (true);

create policy "reactions_insert" on public.story_reactions for insert
  with check (auth.uid() = user_id);

create policy "reactions_delete" on public.story_reactions for delete
  using (auth.uid() = user_id);

create index story_reactions_story_id_idx on public.story_reactions (story_id);

-- Comentarios en historias

create table public.story_comments (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.success_stories (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  content text not null check (char_length(content) between 1 and 500),
  created_at timestamptz default now()
);

alter table public.story_comments enable row level security;

create policy "comments_select" on public.story_comments for select using (true);

create policy "comments_insert" on public.story_comments for insert
  with check (auth.uid() = user_id);

create policy "comments_delete" on public.story_comments for delete
  using (auth.uid() = user_id);

create index story_comments_story_created_idx on public.story_comments (story_id, created_at desc);
