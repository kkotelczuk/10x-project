# Plan implementacji widoku Logowanie/Rejestracja + Nawigacja

## 1. Przegląd
Widok obejmuje autoryzację użytkownika (logowanie, rejestracja, reset hasła) oraz brakujące komponenty nawigacyjne dla desktop i mobile. Celem jest szybki dostęp do aplikacji, jasne komunikaty błędów i spójna nawigacja z akcją „Generuj”.

## 2. Routing widoku
- `/login` – formularz logowania + Google Auth + link „Zapomniałem hasła”.
- `/register` – formularz rejestracji + Google Auth + zgody regulamin/RODO.
- (opcjonalnie) `/reset-password` – ekran ustawienia nowego hasła po linku z emaila (jeśli wymagany przez flow Supabase).

## 3. Struktura komponentów
- `Layout.astro`
  - `TopNavBar` (desktop)
  - `MobileNav` (hamburger + sidebar)
  - `MobileFab` (akcja Generuj)
- `AuthPageLayout` (Astro wrapper)
  - `AuthCard`
    - `AuthForm` (tryb `login` | `register`)
      - `EmailField`
      - `PasswordField`
      - `PasswordStrengthMeter`
      - `TermsCheckbox` (tylko rejestracja)
      - `SubmitButton`
    - `GoogleAuthButton`
    - `AuthLinks` (reset hasła, przełącz tryb)
    - `AuthErrors`
  - `ResetPasswordModal` lub osobna strona `/reset-password`

## 4. Szczegóły komponentów
### `TopNavBar`
- Opis komponentu: Górny pasek nawigacyjny dla desktopu z logo, linkami i akcją „Generuj”.
- Główne elementy: `header`, `nav`, link logo, link „Twoje przepisy”, button primary, `AvatarMenu`.
- Obsługiwane interakcje: klik logo -> dashboard, klik „Generuj” -> `/generate`, menu użytkownika -> profil/wyloguj/zmiana motywu.
- Obsługiwana walidacja: brak.
- Typy: `NavUserViewModel`, `NavLink`.
- Propsy: `user`, `onLogout`, `onThemeToggle`, `isUsageLimitReached`.

### `MobileNav`
- Opis komponentu: Hamburger menu z sidebarą na mobile.
- Główne elementy: `button` hamburger, `Sheet/Drawer` z nagłówkiem (avatar + nazwa), linki i stopka.
- Obsługiwane interakcje: otwórz/zamknij menu, przejście do Dashboard/Profil, wyloguj, przełącz motyw.
- Obsługiwana walidacja: brak.
- Typy: `NavUserViewModel`, `NavLink`.
- Propsy: `user`, `onLogout`, `onThemeToggle`.

### `MobileFab`
- Opis komponentu: Floating Action Button dla akcji „Generuj”.
- Główne elementy: `button` fixed bottom-right, ikona (generator / kłódka).
- Obsługiwane interakcje: klik -> `/generate` (gdy limit niewyczerpany).
- Obsługiwana walidacja: zablokowany, gdy `isUsageLimitReached`.
- Typy: `UsageQuotaViewModel`.
- Propsy: `usage`, `onClick`.

### `AuthPageLayout`
- Opis komponentu: Wspólny layout dla `/login` i `/register` (centered card, logo, tło).
- Główne elementy: `main`, kontener treści, `AuthCard`.
- Obsługiwane interakcje: brak.
- Obsługiwana walidacja: brak.
- Typy: brak.
- Propsy: `title`, `subtitle`, `children`.

### `AuthCard`
- Opis komponentu: Karta z formularzem, przyciskami OAuth i linkami.
- Główne elementy: `section`, `AuthForm`, `GoogleAuthButton`, `AuthLinks`.
- Obsługiwane interakcje: przekierowania do `/login`/`/register`.
- Obsługiwana walidacja: brak.
- Typy: `AuthFormMode`.
- Propsy: `mode`, `onSubmit`, `onGoogleAuth`, `onResetPassword`.

### `AuthForm`
- Opis komponentu: Formularz login/rejestracja z walidacją w czasie rzeczywistym.
- Główne elementy: `form`, pola `email`, `password`, opcjonalny `TermsCheckbox`, `SubmitButton`.
- Obsługiwane interakcje: `onChange`, `onBlur`, submit.
- Obsługiwana walidacja:
  - email: format RFC, required
  - password: min długość + siła hasła (co najmniej 1 cyfra, 1 litera, 1 znak specjalny)
  - terms: required w trybie `register`
- Typy: `AuthFormState`, `AuthFormErrors`, `PasswordStrength`.
- Propsy: `mode`, `state`, `errors`, `onChange`, `onSubmit`, `isSubmitting`.

### `GoogleAuthButton`
- Opis komponentu: Przycisk logowania przez Google.
- Główne elementy: `button`, ikona Google.
- Obsługiwane interakcje: klik -> `signInWithOAuth`.
- Obsługiwana walidacja: brak.
- Typy: brak.
- Propsy: `onClick`, `isLoading`.

### `AuthLinks`
- Opis komponentu: Linki „Zapomniałem hasła” i przełączanie login/register.
- Główne elementy: linki `a`.
- Obsługiwane interakcje: klik -> otwarcie modala resetu lub nawigacja do `/register`/`/login`.
- Obsługiwana walidacja: brak.
- Typy: `AuthFormMode`.
- Propsy: `mode`, `onResetPassword`.

### `ResetPasswordModal` / `ResetPasswordPage`
- Opis komponentu: Formularz wysyłki linku resetującego lub ustawienia nowego hasła.
- Główne elementy: `form`, pole `email`, `SubmitButton`, `Alert`.
- Obsługiwane interakcje: submit.
- Obsługiwana walidacja: email required + format.
- Typy: `ResetPasswordState`, `AuthError`.
- Propsy: `onSubmit`, `isSubmitting`, `status`.

## 5. Typy
- `AuthFormMode = "login" | "register"`
- `AuthFormState`
  - `email: string`
  - `password: string`
  - `termsAccepted: boolean`
- `AuthFormErrors`
  - `email?: string`
  - `password?: string`
  - `termsAccepted?: string`
  - `form?: string`
- `PasswordStrength`
  - `score: 0 | 1 | 2 | 3 | 4`
  - `label: "słabe" | "średnie" | "mocne"`
  - `requirements: { minLength: boolean; hasNumber: boolean; hasSpecial: boolean }`
- `NavUserViewModel`
  - `displayName: string | null`
  - `avatarUrl?: string | null`
- `UsageQuotaViewModel`
  - `remaining: number`
  - `limit: number`
  - `isLimitReached: boolean`
- `ResetPasswordState`
  - `email: string`
  - `status: "idle" | "success" | "error"`
- `AuthError`
  - `code?: string`
  - `message: string`

## 6. Zarządzanie stanem
- Lokalny stan formularzy w `AuthForm` (React useState).
- `usePasswordStrength(password)` – oblicza siłę hasła w czasie rzeczywistym.
- `useAuthActions()` – wrapper na Supabase Auth (logowanie, rejestracja, Google, reset).
- `useUserContext()` – pobiera dane użytkownika do nawigacji (np. z Supabase session + profil).
- `useUsageQuota()` – do ustalenia stanu FAB (jeśli jest dostępne w API/ctx).

## 7. Integracja API
- Supabase Auth:
  - `signUp({ email, password, options: { data, emailRedirectTo } })`
  - `signInWithPassword({ email, password })`
  - `signInWithOAuth({ provider: "google" })`
  - `resetPasswordForEmail(email, { redirectTo })`
  - `updateUser({ password })` (dla `/reset-password`)
  - `signOut()`
- Akcje frontendowe:
  - Po `signUp` -> przekierowanie do onboardingu (np. `/onboarding`)
  - Po `signIn` -> `/dashboard`
  - Po Google OAuth -> zależnie od istnienia profilu: onboarding lub dashboard
- Typy żądania/odpowiedzi:
  - `AuthFormState` -> Supabase Auth request
  - `AuthError` mapowany z `error` Supabase

## 8. Interakcje użytkownika
- Użytkownik wpisuje email/hasło -> walidacja w czasie rzeczywistym.
- Klik „Zaloguj” -> logowanie, loader na przycisku, error toast przy błędzie.
- Klik „Zarejestruj” -> sprawdzenie zgód, rejestracja, przekierowanie.
- Klik „Zaloguj z Google” -> OAuth, po powrocie przekierowanie wg profilu.
- Klik „Zapomniałem hasła” -> modal/strona resetu i komunikat sukcesu.
- Klik logo/top linki/fab -> nawigacja do odpowiednich widoków.
- Menu użytkownika -> profil / wyloguj / przełącz motyw.

## 9. Warunki i walidacja
- Email: wymagany, poprawny format, walidacja onChange/onBlur.
- Hasło: wymagane, min 8 znaków, min 1 cyfra, min 1 znak specjalny (real-time).
- Regulamin/RODO: checkbox wymagany w rejestracji.
- Formularz submit dostępny tylko gdy walidacja OK.
- FAB zablokowany gdy `usage.remaining === 0`.
- Google Auth dostępny na login i register.

## 10. Obsługa błędów
- Błędne dane logowania -> komunikat inline + toast.
- Rejestracja: email już istnieje -> komunikat i sugestia logowania.
- Błąd sieci -> toast „Spróbuj ponownie”.
- Brak zgód -> komunikat pod checkboxem.
- OAuth przerwany -> toast „Logowanie przerwane”.
- Reset hasła: nieistniejący email -> komunikat neutralny (nie ujawnia istnienia konta).
- Brak profilu po logowaniu -> przekierowanie do onboardingu.

## 11. Kroki implementacji
1. Utworzyć strony `src/pages/login.astro` i `src/pages/register.astro` z `AuthPageLayout`.
2. Dodać komponenty auth w `src/components/auth/*` (AuthForm, GoogleAuthButton, AuthLinks, ResetPassword).
3. Dodać custom hooki `src/components/hooks/useAuthActions.ts` i `usePasswordStrength.ts`.
4. Zaimplementować `TopNavBar`, `MobileNav`, `MobileFab` w `src/components/navigation/*`.
5. Podpiąć komponenty nawigacji w `src/layouts/Layout.astro`.
6. Zapewnić routing i przekierowania po login/rejestracji (Astro routing).
7. Wpiąć obsługę Supabase Auth i mapowanie błędów.
8. Dodać walidację formularzy oraz komunikaty błędów i sukcesu (np. `sonner`).
9. Przetestować flow: logowanie, rejestracja, reset hasła, Google OAuth, wylogowanie.
10. Sprawdzić RWD: desktop (TopNavBar) i mobile (MobileNav + FAB).
