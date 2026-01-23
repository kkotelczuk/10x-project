# Specyfikacja architektury: rejestracja, logowanie, reset hasla

Zakres: US-001, US-002, US-003, US-004 (bezpieczenstwo) z PRD oraz stack z `tech-stack.md`.
Cel: opisac architekture bez implementacji, zgodnie z obecnym dzialaniem aplikacji.

## 1. Architektura interfejsu uzytkownika

### 1.1 Strony i layouty (Astro)

- `src/pages/login.astro`, `src/pages/register.astro`, `src/pages/reset-password.astro`
  - Dedykowane strony auth (US-004).
  - Korzystaja z `AuthPageLayout.astro` oraz ustawienia `showNavigation={false}` w `Layout.astro`, aby nie wyswietlac nawigacji w trybie auth.
  - SSR (Astro output: "server") do wstepnej weryfikacji sesji i ewentualnych redirectow.
- `src/pages/index.astro`
  - Publiczny landing; zawiera CTA do logowania/rejestracji i opis funkcji.
  - Dostepny bez logowania (US-004).
- `src/pages/dashboard.astro`, `src/pages/generate.astro`, `src/pages/profile.astro`, `src/pages/recipe/[id].astro`
  - Strony wymagajace zalogowania; gdy brak sesji, redirect na `/login` z query `next=...`.

### 1.2 Komponenty UI (React)

**Istniejace komponenty do rozszerzenia:**
- `src/components/auth/AuthForm.tsx`
  - Obsloga trybu `login` i `register` (email/haslo, potwierdzenie hasla w rejestracji).
  - Integracja z `useAuthActions` (docelowo Supabase Auth).
- `src/components/auth/PasswordStrengthMeter.tsx`
  - Walidacja sily hasla (US-001).
- `src/components/auth/AuthLinks.tsx`
  - Linki: "Masz konto? Zaloguj", "Nie masz konta? Zarejestruj", "Zapomniales hasla?".
- `src/components/auth/ResetPasswordDialog.tsx` i `ResetPasswordPage.tsx`
  - Obsluga wysylki maila i ustawienia nowego hasla po wejsciu w link.
- `src/components/navigation/TopNavBar.tsx`, `MobileNav.tsx`
  - Przycisk logowania w prawym gornym rogu (US-004).
  - Przycisk wylogowania w prawym gornym rogu (US-004).

**Nowe lub rozszerzone elementy:**
- `AuthForm` dodaje checkbox zgody na regulamin i polityke prywatnosci (US-001).
- `AuthCard`/`AuthPageLayout` zawiera informacje o RODO/cookies, ale bez duplikacji na stronach.
- `TopNavBar`/`MobileNav` rozroznia stan "zalogowany/niezalogowany" na podstawie sesji.

### 1.3 Rozdzielenie odpowiedzialnosci (Astro vs React)

- **Astro (server-side):**
  - Pobieranie i weryfikacja sesji na starcie requestu (middleware).
  - Redirecty chronionych stron.
  - Serwowanie stron auth z minimalnym SSR (bez session data na klienta).
- **React (client-side):**
  - Formularze auth, walidacja lokalna, wyswietlanie bledow.
  - Interakcje: submit, stany loading, inline errors, toast.
  - Trigger API dla auth (Astro endpoints lub bezposrednio Supabase client, zalezne od typu akcji).

### 1.4 Walidacje i komunikaty bledow

- Rejestracja:
  - Email: wymagany, poprawny format.
  - Haslo: wymagane, min. 8 znakow, zroznicowanie (litery + cyfry), wskazanie sily.
  - Potwierdzenie hasla: musi byc identyczne.
  - Zgody: wymagane zaznaczenie (US-001).
  - Bledy Supabase mapowane na przyjazne komunikaty (np. "Email jest juz zajety").
- Logowanie:
  - Email + haslo wymagane.
  - Bledy logowania: "Nieprawidlowy email lub haslo" (US-002).
- Reset hasla:
  - Email wymagany.
  - Po wysylce: komunikat "Sprawdz skrzynke".
  - Ustawienie nowego hasla: walidacja sily i potwierdzenia.

### 1.5 Najwazniejsze scenariusze

1) Rejestracja -> onboarding:
   - Udana rejestracja -> redirect do `/onboarding`.
   - Potwierdzenie email jest opcjonalne i nie blokuje dalszych krokow.
2) Logowanie -> dashboard:
   - Udane logowanie -> `/dashboard`.
3) Zapomniane haslo:
   - Wyslanie linku -> wejscie w link -> ustawienie nowego hasla -> przekierowanie do `/login`.
4) Uzytkownik niezalogowany:
   - Dostep do landing i stron auth.
   - Wejscie na chroniona strone -> redirect do `/login?next=...`.
5) Wylogowanie:
   - Przycisk w prawym gornym rogu (US-004) -> usuniecie sesji -> redirect do `/login`.

## 2. Logika backendowa

### 2.1 Struktura endpointow (Astro API)

Endpointy pod `src/pages/api/auth/` (JSON, POST):

- `POST /api/auth/register`
  - Body: `{ email, password, acceptTerms }`
  - Wynik: utworzenie uzytkownika w Supabase + opcjonalna inicjalizacja profilu.
- `POST /api/auth/login`
  - Body: `{ email, password }`
  - Wynik: utworzenie sesji i ustawienie cookies.
- `POST /api/auth/logout`
  - Body: `{}` (opcjonalnie)
  - Wynik: usuniecie sesji/cookies.
- `POST /api/auth/reset`
  - Body: `{ email }`
  - Wynik: wyslanie linku resetujacego.
- `POST /api/auth/update-password`
  - Body: `{ password }` (wymaga aktywnego recovery flow)
  - Wynik: ustawienie nowego hasla.
- `GET /api/auth/session`
  - Body: brak
  - Wynik: zwrot minimalnych danych o sesji (isAuthenticated, user displayName).

Powyzsze endpointy odpowiadaja na potrzeby UI i pozwalaja na kontrolowane zarzadzanie cookies oraz bezpieczne zwracanie bledow.

### 2.2 Modele danych

Uzytkownicy: Supabase Auth (tabela `auth.users`).
Profil uzytkownika: tabela `public.profiles` (extends auth.users), zawierajaca:

- `id` (UUID, PK/FK do auth.users)
- `diet_id` (FK do `public.diets`)
- `display_name` (opcjonalnie)
- `terms_accepted_at`, `privacy_accepted_at` (wymagane)
- `created_at`, `updated_at`

Preferencje powiazane:
- `public.profile_allergens` (relacja wiele do wielu z `public.allergens`)
- `public.profile_dislikes` (relacja wiele do wielu z `public.ingredients`)

Uwaga: profil jest tworzony podczas rejestracji (wraz z zapisaniem akceptacji regulaminu i polityki prywatnosci). Onboarding uzupelnia diet_id oraz relacje alergenow i dislikes po pierwszym logowaniu.

### 2.3 Walidacja danych wejsciowych

- Kazdy endpoint waliduje body:
  - wymagane pola, format email, polityka hasla, zgodnosc hasel, akceptacja regulaminu.
- Walidacja jest po stronie serwera niezaleznie od walidacji w UI.
- Bledy zwracane w spojnyn formacie:
  - `{ code, message, field? }`

### 2.4 Obsluga wyjatkow

- Supabase errors mapowane na czytelne komunikaty UI.
- Bledy nieznane logowane (server logs) i zwracane jako "Wystapil blad serwera".
- Brak wyciekow szczegolow technicznych w odpowiedziach dla klienta.

### 2.5 Renderowanie server-side i middleware

Astro jest skonfigurowane w `output: "server"` (SSR). Wymagane aktualizacje:

- `src/middleware/index.ts` rozszerza logike:
  - czytanie access tokenu z cookies Supabase (nie tylko `Authorization`).
  - ustawienie `context.locals.user` oraz `context.locals.session`.
- Strony chronione (`/dashboard`, `/generate`, `/profile`, `/recipe/[id]`) weryfikuja `locals.user` i robia redirect, gdy brak sesji.
- Strony auth (`/login`, `/register`, `/reset-password`) przekierowuja zalogowanego uzytkownika na `/dashboard`.

## 3. System autentykacji (Supabase Auth + Astro)

### 3.1 Zasady

- Tylko email/haslo (PRD US-004 zabrania logowania zewnetrznego).
- Brak Google OAuth w UI, mimo mozliwosci w stacku.
- Sesja przechowywana w cookies i dostepna dla SSR.
- Uzytkownik moze korzystac z publicznych obszarow bez logowania (US-004).

### 3.2 Integracja z Supabase

- Klient Supabase w `src/db/supabase.client.ts`:
  - do klienta w UI (tylko bezpieczne operacje).
  - do serwera w endpointach (zarzadzanie sesja i cookies).
- `useAuthActions` i `useUserContext`:
  - Zastapienie mock storage danymi z Supabase session.
  - Aktualizacja stanu auth na podstawie `supabase.auth.onAuthStateChange`.

### 3.3 Przeplywy auth

- Rejestracja:
  - `signUp` -> Supabase -> opcjonalna weryfikacja email (nie blokuje dalszych krokow).
  - Po sukcesie: redirect do `/onboarding`.
- Logowanie:
  - `signInWithPassword` -> Supabase -> zapis cookies -> redirect do `/dashboard`.
- Wylogowanie:
  - `signOut` -> Supabase -> czyszczenie cookies -> redirect do `/login`.
- Reset hasla:
  - `resetPasswordForEmail` -> Supabase wysyla link.
  - `updatePassword` -> Supabase ustawia nowe haslo.

## 4. Kontrakty miedzy UI i backendem

Przyklad ogolnego formatu odpowiedzi:

- Sukces: `{ ok: true, data: { ... } }`
- Blad: `{ ok: false, error: { code, message, field? } }`

To pozwala na spójna obsluge bledow w komponentach UI.

## 5. Zgodnosc z istniejacym dzialaniem

- Nie naruszamy obecnej nawigacji i layoutow, jedynie rozdzielamy tryb auth i non-auth przez `showNavigation`.
- Utrzymujemy istniejace strony i komponenty, rozszerzajac je o realne Supabase Auth zamiast mockow.
- Zapewniamy brak zewnetrznych providerow logowania w UI.
- Zgodnosc z SSR i middleware oparta o obecny `astro.config.mjs`.
