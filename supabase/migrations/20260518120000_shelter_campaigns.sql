-- Colectas / campañas de donación por refugio.
-- Progreso por estado (sin montos automáticos): draft | active | completed.
-- Urgencia permite ordenar/filtrar (1=baja, 2=media, 3=alta).

create table if not exists public.shelter_campaigns (
  id uuid primary key default gen_random_uuid(),
  shelter_id uuid not null references public.shelters(id) on delete cascade,

  status text not null default 'draft' check (status in ('draft', 'active', 'completed')),
  urgency int not null default 2 check (urgency between 1 and 3),

  title text not null check (char_length(title) between 3 and 80),
  description text not null check (char_length(description) between 10 and 800),

  image_mode text not null default 'custom' check (image_mode in ('custom', 'pet')),
  image_url text,
  image_position text default '50% 50%',

  pet_id uuid references public.pets(id) on delete set null,

  use_shelter_accounts boolean not null default true,
  transfer_accounts_override jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_shelter_campaigns_shelter_status on public.shelter_campaigns(shelter_id, status);
create index if not exists idx_shelter_campaigns_status_urgency on public.shelter_campaigns(status, urgency desc, updated_at desc);

alter table public.shelter_campaigns enable row level security;

-- Público: solo campañas activas
drop policy if exists "campaigns_public_select" on public.shelter_campaigns;
create policy "campaigns_public_select" on public.shelter_campaigns
  for select
  using (status = 'active');

-- Dueño/admin del refugio: CRUD completo
drop policy if exists "campaigns_owner_all" on public.shelter_campaigns;
create policy "campaigns_owner_all" on public.shelter_campaigns
  for all
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and (
          p.is_admin = true
          or (p.shelter_id = shelter_campaigns.shelter_id and p.shelter_role = 'owner')
        )
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and (
          p.is_admin = true
          or (p.shelter_id = shelter_campaigns.shelter_id and p.shelter_role = 'owner')
        )
    )
  );

