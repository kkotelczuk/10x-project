# Plan Testów Projektu 10x-project (AI Recipe Generator)

## 1. Wprowadzenie i cele testowania
Celem niniejszego planu jest zapewnienie wysokiej jakości aplikacji webowej służącej do generowania spersonalizowanych przepisów kulinarnych przy użyciu AI. Głównym założeniem jest weryfikacja poprawności działania kluczowych funkcjonalności (Auth, Onboarding, Generowanie AI), bezpieczeństwa danych użytkowników oraz stabilności integracji z zewnętrznymi serwisami (Supabase, OpenRouter).

Szczególny nacisk kładziemy na:
*   Poprawność logiczną i bezpieczeństwo generowanych treści (przepisów).
*   Płynność procesu onboardingu użytkownika.
*   Odporność aplikacji na błędy API stron trzecich.

## 2. Zakres testów

### W zakresie (In-Scope):
*   **Frontend (Astro/React):** Wszystkie strony, formularze, interaktywne komponenty UI (Shadcn), nawigacja, responsywność (RWD).
*   **Backend (Astro API):** Endpointy w `src/pages/api/`, obsługa sesji, komunikacja z Supabase.
*   **Logika Biznesowa:** Serwisy w `src/lib/services/` (Recipe, Diet, Profile), algorytmy doboru diety.
*   **Integracja AI:** Obsługa zapytań do OpenRouter, parsowanie odpowiedzi JSON, obsługa limitów kredytów.
*   **Baza Danych:** Operacje CRUD, poprawność zapisu preferencji użytkownika.

### Poza zakresem (Out-of-Scope):
*   Testy obciążeniowe infrastruktury OpenRouter (zewnętrzny dostawca).
*   Testy penetracyjne samej platformy Supabase (polegamy na ich zabezpieczeniach, testujemy tylko naszą konfigurację RLS).

## 3. Typy testów do przeprowadzenia

| Typ testu | Opis | Narzędzia sugerowane |
| :--- | :--- | :--- |
| **Unit Tests (Jednostkowe)** | Testowanie izolowanych funkcji, hooków (`useUserContext`, `useRecipes`) i serwisów (`allergen.service.ts`). | **Vitest** + React Testing Library |
| **Integration Tests (Integracyjne)** | Weryfikacja współpracy API Astro z Supabase oraz przepływu danych w formularzach React. | **Vitest** |
| **E2E Tests (End-to-End)** | Pełne ścieżki użytkownika: Rejestracja -> Onboarding -> Wygenerowanie przepisu. | **Playwright** lub Cypress |
| **AI Output Verification** | Weryfikacja struktury JSON zwracanej przez AI oraz "Sanity Check" (czy przepis ma sens). | Skrypty automatyczne + Manual Review |
| **UI/UX & RWD** | Sprawdzenie wyglądu na mobile/desktop, działanie komponentów Shadcn. | Manualne + Playwright (Visual comparisons) |

## 4. Scenariusze testowe dla kluczowych funkcjonalności

### A. Uwierzytelnianie i Profil (Priorytet: Wysoki)
*   **TC-AUTH-01:** Rejestracja nowego użytkownika (email/hasło) – weryfikacja zapisu w Supabase.
*   **TC-AUTH-02:** Logowanie przez Google OAuth (Happy path).
*   **TC-AUTH-03:** Próba logowania z błędnym hasłem (Walidacja błędów).
*   **TC-AUTH-04:** Reset hasła – pełny przepływ (żądanie linku -> zmiana hasła).
*   **TC-AUTH-05:** Wylogowanie i weryfikacja wyczyszczenia sesji/ciasteczek.

### B. Onboarding i Preferencje (Priorytet: Krytyczny)
*   **TC-ONB-01:** Przejście przez Wizard (Kroki 1-4) i poprawny zapis stanu w bazie.
*   **TC-ONB-02:** Walidacja wyboru diet (czy można wybrać sprzeczne diety?).
*   **TC-ONB-03:** Obsługa listy alergenów i nielubianych składników (dodawanie/usuwanie tagów).
*   **TC-ONB-04:** Przerwanie onboardingu i powrót – czy stan jest zachowany (jeśli dotyczy)?

### C. Generowanie Przepisów z AI (Priorytet: Krytyczny)
*   **TC-GEN-01:** Wygenerowanie przepisu z poprawnymi parametrami (Credits > 0).
*   **TC-GEN-02:** Weryfikacja, czy wygenerowany przepis uwzględnia zdefiniowane w profilu alergeny (BEZPIECZEŃSTWO).
*   **TC-GEN-03:** Próba generowania przy braku kredytów (Credits = 0) – weryfikacja blokady UI.
*   **TC-GEN-04:** Obsługa błędu API OpenRouter (np. timeout, 500) – czy wyświetla się przyjazny komunikat ("Graceful degradation").
*   **TC-GEN-05:** Poprawność parsowania odpowiedzi JSON z AI do komponentu `RecipeCard`.

### D. Dashboard i Zarządzanie (Priorytet: Średni)
*   **TC-DASH-01:** Wyświetlanie listy przepisów (Pagination/Infinite scroll jeśli jest).
*   **TC-DASH-02:** Filtrowanie po typie posiłku (śniadanie, obiad) i sortowanie po dacie.
*   **TC-DASH-03:** Usuwanie przepisu – weryfikacja usunięcia z UI i bazy.

## 5. Środowisko testowe

*   **Lokalne (Localhost):**
    *   Baza danych: Lokalna instancja Supabase (Docker) lub projekt dev w chmurze.
    *   Env: `.env.local` z kluczami testowymi.
*   **Staging (Preview):**
    *   Wdrożenie (np. Vercel/Netlify) z podpiętą bazą testową Supabase.
    *   Służy do testów E2E i manualnej weryfikacji przez zespół (UAT).
*   **Produkcja:**
    *   Tylko testy dymne (Smoke Tests) po wdrożeniu.

## 6. Narzędzia do testowania

1.  **Vitest**: Główny runner do testów jednostkowych i integracyjnych (natywne wsparcie dla Vite/Astro).
2.  **React Testing Library**: Do testowania komponentów React (`AuthForm`, `OnboardingWizard`) w izolacji.
3.  **Playwright**: Do testów E2E (obsługuje nowoczesne przeglądarki, świetnie radzi sobie z asynchronicznością).
4.  **Supabase CLI**: Do lokalnego uruchamiania bazy danych i testowania polityk bezpieczeństwa.
5.  **Postman / Insomnia**: Do ręcznego testowania endpointów API (`/api/generate`, `/api/auth/*`).

## 7. Harmonogram testów

*   **Faza 1 (Development):** Testy jednostkowe pisane na bieżąco przez deweloperów (TDD lub równolegle z kodem). Review kodu wymusza pokrycie testami serwisów (`src/lib/services`).
*   **Faza 2 (Pre-release):** Uruchomienie pełnego zestawu testów E2E na środowisku Staging. Manualne testy eksploracyjne "Recipe Quality Check" (sprawdzenie jakości przepisów).
*   **Faza 3 (Release):** Smoke tests na produkcji (Logowanie + wyświetlenie Dashboardu).

## 8. Kryteria akceptacji testów (Definition of Done)

*   Brak błędów krytycznych (Blocker/Critical) uniemożliwiających główne ścieżki (Login -> Generate).
*   Pokrycie kodu testami jednostkowymi (Code Coverage) dla `src/lib/services` minimum 80%.
*   Wszystkie testy E2E przechodzą na środowisku Staging (Pass rate 100%).
*   Czas ładowania głównego dashboardu < 2s (Lighthouse Performance > 80).
*   Brak znanych błędów bezpieczeństwa (np. możliwość podglądu przepisów innego użytkownika).

## 9. Role i odpowiedzialności

*   **QA Engineer:** Tworzenie scenariuszy E2E, konfiguracja środowiska testowego (Playwright), testy manualne/eksploracyjne, weryfikacja jakości AI.
*   **Backend/Frontend Developer:** Pisanie testów jednostkowych (Vitest), utrzymanie spójności typów TS, poprawki błędów zgłoszonych przez QA.
*   **Product Owner:** Akceptacja jakości generowanych przepisów (Business Value Verification).

## 10. Procedury raportowania błędów

Błędy należy zgłaszać w systemie śledzenia zadań (np. GitHub Issues/Jira) według szablonu:
1.  **Tytuł:** Krótki opis problemu [Tagi: Frontend/API/AI].
2.  **Środowisko:** (Lokalne/Staging/Prod, przeglądarka, wersja OS).
3.  **Kroki do reprodukcji:** Dokładna lista kroków.
4.  **Oczekiwany rezultat:** Co powinno się stać.
5.  **Rzeczywisty rezultat:** Co się stało (screenshoty, logi z konsoli, treść błędu).
6.  **Priorytet:** (Blocker/High/Medium/Low).
