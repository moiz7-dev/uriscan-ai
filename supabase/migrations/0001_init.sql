-- UriScan_AI initial schema
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New query → paste → Run)

-- ============================================================================
-- profiles: one row per Supabase auth user. Holds the Pro entitlement.
-- ============================================================================

create table if not exists public.profiles (
  user_id uuid primary key references auth.users on delete cascade,
  email text,
  display_name text,

  -- Pro entitlement. Only the service role can write these (enforced by trigger below).
  is_pro boolean not null default false,
  pro_purchased_at timestamptz,
  pro_store text,
  pro_sku text,
  pro_txn_ref text,
  pro_purchase_token text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- RLS: users see and update only their own row.
-- ============================================================================

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- INSERT happens via the trigger on auth.users below — no direct INSERT policy
-- because the trigger uses a definer-rights function to bypass RLS for that one path.

-- ============================================================================
-- Trigger: protect entitlement columns from client writes.
-- Only the service_role JWT (used by Edge Functions) can change is_pro etc.
-- ============================================================================

create or replace function public.profiles_protect_entitlement_columns()
returns trigger
language plpgsql
security invoker
as $$
begin
  -- Service role bypasses this guard.
  if (current_setting('request.jwt.claims', true)::jsonb->>'role') = 'service_role' then
    new.updated_at := now();
    return new;
  end if;

  -- Force entitlement columns back to their previous values for non-service callers.
  new.is_pro := old.is_pro;
  new.pro_purchased_at := old.pro_purchased_at;
  new.pro_store := old.pro_store;
  new.pro_sku := old.pro_sku;
  new.pro_txn_ref := old.pro_txn_ref;
  new.pro_purchase_token := old.pro_purchase_token;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_protect_entitlement on public.profiles;
create trigger profiles_protect_entitlement
  before update on public.profiles
  for each row
  execute function public.profiles_protect_entitlement_columns();

-- ============================================================================
-- Trigger: auto-create a profile row whenever a new auth user signs up.
-- security definer so it can insert past RLS.
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'full_name',
      split_part(coalesce(new.email, ''), '@', 1)
    )
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- Backfill: create profile rows for any users that already exist.
-- Safe to re-run.
-- ============================================================================

insert into public.profiles (user_id, email, display_name)
select
  u.id,
  u.email,
  coalesce(
    u.raw_user_meta_data->>'name',
    u.raw_user_meta_data->>'full_name',
    split_part(coalesce(u.email, ''), '@', 1)
  )
from auth.users u
left join public.profiles p on p.user_id = u.id
where p.user_id is null;
