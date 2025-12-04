/*
  # Initial Schema for HealthyMeal Application

  1.  **Lookup Tables**: `diets`, `allergens`, `ingredients`
  2.  **Main Tables**: `profiles`, `recipes`, `generation_logs`
  3.  **Junction Tables**: `profile_allergens`, `profile_dislikes`
  4.  **Security**: RLS enabled on all tables with granular policies.
  5.  **Automation**: Triggers for recipe invalidation on preference changes.
*/

-- 0. Extensions & Configuration

create schema if not exists extensions;
grant usage on schema extensions to public;

-- Enable unaccent extension to handle accents (e.g. 'mąka' -> 'maka')
create extension if not exists unaccent schema extensions;

-- Create a custom 'polish' text search configuration
-- Standard Postgres images often lack the full Polish dictionary files.
-- This configuration uses 'unaccent' + 'simple' to allow accent-insensitive searching
-- without requiring external dictionary files.
drop text search configuration if exists public.polish;
create text search configuration public.polish ( copy = simple );
alter text search configuration public.polish
  alter mapping for hword, hword_part, word
  with extensions.unaccent, simple;

-- 1. Lookup Tables

-- Diets table
create table public.diets (
  id text primary key,
  name text not null,
  allowed_foods text[] default '{}'::text[],
  forbidden_foods text[] default '{}'::text[],
  macros jsonb default '{}'::jsonb
);

-- Allergens table
create table public.allergens (
  id text primary key,
  name text not null
);

-- Ingredients table (for dislikes/exclusions)
create table public.ingredients (
  id text primary key,
  name text not null,
  category text not null,
  variants text[] default '{}'::text[],
  is_visible boolean default true
);

-- 2. Main Tables

-- Profiles table (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  diet_id text references public.diets(id) on delete set null,
  display_name text,
  terms_accepted_at timestamptz not null,
  privacy_accepted_at timestamptz not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Junction table for Profile <-> Allergens
create table public.profile_allergens (
  profile_id uuid references public.profiles(id) on delete cascade,
  allergen_id text references public.allergens(id) on delete restrict,
  primary key (profile_id, allergen_id)
);

-- Junction table for Profile <-> Disliked Ingredients
create table public.profile_dislikes (
  profile_id uuid references public.profiles(id) on delete cascade,
  ingredient_id text references public.ingredients(id) on delete restrict,
  primary key (profile_id, ingredient_id)
);

-- Recipes table
create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  ingredients jsonb not null,
  instructions jsonb not null,
  diet_label text not null,
  prep_time_minutes integer,
  calories integer,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Generation logs table
create table public.generation_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  success boolean not null,
  error_message text,
  created_at timestamptz default now()
);

-- 3. Row Level Security (RLS)

alter table public.diets enable row level security;
alter table public.allergens enable row level security;
alter table public.ingredients enable row level security;
alter table public.profiles enable row level security;
alter table public.profile_allergens enable row level security;
alter table public.profile_dislikes enable row level security;
alter table public.recipes enable row level security;
alter table public.generation_logs enable row level security;

-- Policies for Lookup Tables (Read: Authenticated & Anon, Write: Service Role only)
create policy "Allow read access for all users" on public.diets for select using (true);
create policy "Allow read access for all users" on public.allergens for select using (true);
create policy "Allow read access for all users" on public.ingredients for select using (true);

-- Policies for Profiles
create policy "Users can view own profile" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "Users can update own profile" on public.profiles for update to authenticated using ((select auth.uid()) = id);
create policy "Users can insert own profile" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);

-- Policies for Profile Allergens
create policy "Users can view own allergens" on public.profile_allergens for select to authenticated using (profile_id = (select auth.uid()));
create policy "Users can insert own allergens" on public.profile_allergens for insert to authenticated with check (profile_id = (select auth.uid()));
create policy "Users can delete own allergens" on public.profile_allergens for delete to authenticated using (profile_id = (select auth.uid()));

-- Policies for Profile Dislikes
create policy "Users can view own dislikes" on public.profile_dislikes for select to authenticated using (profile_id = (select auth.uid()));
create policy "Users can insert own dislikes" on public.profile_dislikes for insert to authenticated with check (profile_id = (select auth.uid()));
create policy "Users can delete own dislikes" on public.profile_dislikes for delete to authenticated using (profile_id = (select auth.uid()));

-- Policies for Recipes
create policy "Users can view own recipes" on public.recipes for select to authenticated using (user_id = (select auth.uid()));
create policy "Users can insert own recipes" on public.recipes for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Users can update own recipes" on public.recipes for update to authenticated using (user_id = (select auth.uid()));
create policy "Users can delete own recipes" on public.recipes for delete to authenticated using (user_id = (select auth.uid()));

-- Policies for Generation Logs
create policy "Users can view own logs" on public.generation_logs for select to authenticated using (user_id = (select auth.uid()));
create policy "Users can insert own logs" on public.generation_logs for insert to authenticated with check (user_id = (select auth.uid()));

-- 4. Indexes

create index profiles_diet_id_idx on public.profiles (diet_id);
create index profile_allergens_profile_id_idx on public.profile_allergens (profile_id);
create index profile_dislikes_profile_id_idx on public.profile_dislikes (profile_id);

-- Full text search index for recipes title (Polish)
create index recipes_title_search_idx on public.recipes using gin (to_tsvector('public.polish', title));
-- GIN index for recipes ingredients jsonb
create index recipes_ingredients_gin_idx on public.recipes using gin (ingredients);
-- B-Tree for dashboard filtering
create index recipes_user_id_is_active_idx on public.recipes (user_id, is_active);

-- 5. Triggers for Invalidation

create or replace function public.handle_preference_change()
returns trigger as $$
declare
  target_user_id uuid;
begin
  if (TG_TABLE_NAME = 'profiles') then
    target_user_id := new.id;
    -- Only invalidate if diet_id changed
    if (old.diet_id is distinct from new.diet_id) then
       update public.recipes set is_active = false where user_id = target_user_id and is_active = true;
    end if;
  elsif (TG_TABLE_NAME = 'profile_allergens' or TG_TABLE_NAME = 'profile_dislikes') then
    -- For INSERT, NEW exists. For DELETE, OLD exists.
    if (TG_OP = 'DELETE') then
      target_user_id := old.profile_id;
    else
      target_user_id := new.profile_id;
    end if;
    update public.recipes set is_active = false where user_id = target_user_id and is_active = true;
  end if;
  
  return null;
end;
$$ language plpgsql security definer set search_path = public;

-- Trigger on profiles update
create trigger on_profile_update
after update on public.profiles
for each row
execute function public.handle_preference_change();

-- Trigger on profile_allergens changes
create trigger on_allergen_change
after insert or delete on public.profile_allergens
for each row
execute function public.handle_preference_change();

-- Trigger on profile_dislikes changes
create trigger on_dislike_change
after insert or delete on public.profile_dislikes
for each row
execute function public.handle_preference_change();

