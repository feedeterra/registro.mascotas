-- Bundle: reacciones (cry→sparkle), rate limit de comentarios en historias, largo máx. 280.
-- Reemplaza las migraciones 20260519120000, 20260519130000, 20260519140000 y 20260520120000.

-- ─── Reacciones: 'cry' → 'sparkle' ─────────────────────────────────
update public.story_reactions
set reaction_type = 'sparkle'
where reaction_type = 'cry';

alter table public.story_reactions drop constraint if exists story_reactions_reaction_type_check;

alter table public.story_reactions
  add constraint story_reactions_reaction_type_check
  check (reaction_type in ('heart', 'paw', 'sparkle', 'wow'));

-- ─── Comentarios: hasta 3 por usuario/historia en 30 min; tope por hora ─
create or replace function public.enforce_story_comment_rate_limit()
returns trigger
language plpgsql
as $$
declare
  n_window int;
  n_hour int;
begin
  select count(*)::int into n_window
  from public.story_comments
  where user_id = new.user_id
    and story_id = new.story_id
    and created_at > now() - interval '30 minutes';

  if n_window >= 3 then
    raise exception 'Ya publicaste 3 comentarios en esta historia en los últimos minutos. Probá más tarde.'
      using errcode = 'P0001';
  end if;

  select count(*)::int into n_hour
  from public.story_comments
  where user_id = new.user_id
    and story_id = new.story_id
    and created_at > now() - interval '1 hour';

  if n_hour >= 30 then
    raise exception 'Límite de comentarios en esta historia (probá más tarde).'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists story_comments_rate_limit on public.story_comments;

create trigger story_comments_rate_limit
  before insert on public.story_comments
  for each row execute function public.enforce_story_comment_rate_limit();

-- ─── Comentarios: longitud máx. 280 (NOT VALID: filas viejas largas no rompen) ─
alter table public.story_comments drop constraint if exists story_comments_content_check;

alter table public.story_comments
  add constraint story_comments_content_len_check
  check (char_length(content) between 1 and 280) not valid;
