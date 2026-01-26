-- Ensure the mock user exists in auth.users
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at
)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    '5f53673d-626f-4f11-8638-b1e65407fdf6',
    'authenticated',
    'authenticated',
    'mock@example.com',
    '$2a$10$mockpasswordhash', 
    now(),
    '{"full_name": "Mock User"}',
    now(),
    now()
)
ON CONFLICT (id) DO NOTHING;

-- The trigger on auth.users should create the profile, but we ensure it exists explicitly
INSERT INTO public.profiles (id, display_name, terms_accepted_at, privacy_accepted_at)
VALUES (
    '5f53673d-626f-4f11-8638-b1e65407fdf6',
    'Mock User',
    now(),
    now()
)
ON CONFLICT (id) DO NOTHING;

-- Seed some test data
INSERT INTO public.allergens (id, name)
VALUES ('orzeszki-ziemne', 'Orzeszki ziemne (arachidowe)')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profile_allergens (profile_id, allergen_id)
VALUES ('5f53673d-626f-4f11-8638-b1e65407fdf6', 'orzeszki-ziemne')
ON CONFLICT DO NOTHING;
