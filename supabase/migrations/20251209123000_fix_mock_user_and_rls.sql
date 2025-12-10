-- 1. Ensure the correct mock user exists (ID ending in fdf7)
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000', '5f53673d-626f-4f11-8638-b1e65407fdf7', 'authenticated', 'authenticated', 'mock@example.com', '$2a$10$mockpasswordhash', now(), '{"full_name": "Mock User"}', now(), now()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, display_name, terms_accepted_at, privacy_accepted_at)
VALUES ('5f53673d-626f-4f11-8638-b1e65407fdf7', 'Mock User', now(), now())
ON CONFLICT (id) DO NOTHING;

-- 2. Open up RLS for this specific Mock User so Anon client can Read/Write it
-- PROFILES
create policy "Mock: Select Profile" on public.profiles
for select using (id = '5f53673d-626f-4f11-8638-b1e65407fdf7');

create policy "Mock: Update Profile" on public.profiles
for update using (id = '5f53673d-626f-4f11-8638-b1e65407fdf7');

create policy "Mock: Insert Profile" on public.profiles
for insert with check (id = '5f53673d-626f-4f11-8638-b1e65407fdf7');

-- ALLERGENS
create policy "Mock: Select Allergens" on public.profile_allergens
for select using (profile_id = '5f53673d-626f-4f11-8638-b1e65407fdf7');

create policy "Mock: Insert Allergens" on public.profile_allergens
for insert with check (profile_id = '5f53673d-626f-4f11-8638-b1e65407fdf7');

create policy "Mock: Delete Allergens" on public.profile_allergens
for delete using (profile_id = '5f53673d-626f-4f11-8638-b1e65407fdf7');

-- DISLIKES
create policy "Mock: Select Dislikes" on public.profile_dislikes
for select using (profile_id = '5f53673d-626f-4f11-8638-b1e65407fdf7');

create policy "Mock: Insert Dislikes" on public.profile_dislikes
for insert with check (profile_id = '5f53673d-626f-4f11-8638-b1e65407fdf7');

create policy "Mock: Delete Dislikes" on public.profile_dislikes
for delete using (profile_id = '5f53673d-626f-4f11-8638-b1e65407fdf7');
