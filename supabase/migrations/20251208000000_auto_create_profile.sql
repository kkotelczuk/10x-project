-- Funkcja obsługująca tworzenie nowego użytkownika
-- Poprawka: dodano 'set search_path = public' dla bezpieczeństwa (security definer)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (
    id,
    display_name,
    terms_accepted_at,
    privacy_accepted_at
  )
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    -- Zakładamy, że utworzenie konta oznacza akceptację (wymuszone przez UI)
    now(),
    now()
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Trigger wywołujący funkcję po wstawieniu wiersza do auth.users
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
