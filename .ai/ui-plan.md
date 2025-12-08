# Architektura UI dla HealthyMeal

## 1. Przegląd struktury UI

Interfejs użytkownika HealthyMeal został zaprojektowany zgodnie z zasadą **Mobile First**, z wyraźnym rozróżnieniem wzorców nawigacyjnych dla urządzeń mobilnych i desktopowych. Architektura opiera się na **Astro 5** (renderowanie hybrydowe) z wyspami interaktywności **React 19**.

Kluczowe filary UX to:

1.  **Transparetność limitów biznesowych**: Użytkownik zawsze zna swój status wykorzystania dziennego limitu (3 modyfikacje).
2.  **Szybkość dostępu**: Globalny przycisk akcji (FAB/Menu) pozwala na natychmiastowe rozpoczęcie modyfikacji przepisu z dowolnego miejsca.
3.  **Spójność wizualna**: Kod kolorystyczny diet (ramki) ułatwia szybkie skanowanie list.
4.  **Optymistyczne UI i Feedback**: Rozbudowany system powiadomień i stanów ładowania (Skeletons) maskuje opóźnienia sieciowe i czas przetwarzania AI.

## 2. Lista widoków

### 2.1. Landing Page (Publiczny)

- **Ścieżka:** `/`
- **Główny cel:** Konwersja odwiedzającego w zarejestrowanego użytkownika.
- **Kluczowe informacje:** Value Proposition ("Twoja dieta, Twoje zasady"), przyciski Logowania/Rejestracji.
- **Kluczowe komponenty:** Hero Section z tłem "Gourmet" (styl 3\* Michelin), CTA Buttons.
- **UX/Bezpieczeństwo:** Dostępny dla niezalogowanych. Po wykryciu aktywnej sesji automatyczne przekierowanie na Dashboard.

### 2.2. Logowanie / Rejestracja

- **Ścieżka:** `/login`, `/register`
- **Główny cel:** Uwierzytelnienie użytkownika.
- **Kluczowe informacje:** Formularze email/hasło, przycisk Google Auth, linki do odzyskiwania hasła.
- **UX/Bezpieczeństwo:** Walidacja haseł w czasie rzeczywistym. Obsługa błędów autoryzacji (np. błędne hasło).

### 2.3. Onboarding Wizard (Kreator Profilu)

- **Ścieżka:** `/onboarding`
- **Główny cel:** Skonfigurowanie profilu żywieniowego użytkownika (wymagane raz po rejestracji).
- **Kluczowe informacje:** 3 kroki: Wybór Diety -> Wybór Alergenów -> Wybór Nielubianych Produktów.
- **Kluczowe komponenty:** `MultiStepForm`, `SelectionCard` (dla diet), `TagInput` (dla produktów - lista zamknięta), `Stepper` (wskaźnik postępu).
- **UX/Bezpieczeństwo:** Stan formularza przechowywany lokalnie do momentu finalnego zapisu. Brak możliwości pominięcia (Guard).

### 2.4. Dashboard (Główny)

- **Ścieżka:** `/dashboard`
- **Główny cel:** Przeglądanie biblioteki przepisów i inicjowanie nowych modyfikacji.
- **Kluczowe informacje:** Licznik limitu dziennego, lista przepisów, stan pusty (jeśli brak).
- **Kluczowe komponenty:**
  - `WelcomeHeader` (z licznikiem limitu).
  - `StickySearchBar` (z filtrami).
  - `RecipeGrid` (siatka kafelków).
  - `RecipeCard` (z kolorową ramką i ikoną diety).
  - `FloatingActionButton` (FAB) - Mobile tylko.
- **UX/Bezpieczeństwo:** Skeleton Loading przy ładowaniu danych. Infinite Scroll lub przycisk "Załaduj więcej".

### 2.5. Szczegóły Przepisu

- **Ścieżka:** `/recipe/[id]`
- **Główny cel:** Konsumpcja treści przepisu (gotowanie).
- **Kluczowe informacje:** Tytuł, Czas przygotowania, Składniki, Instrukcje, Uwagi od AI.
- **Kluczowe komponenty:**
  - `AiNotesAlert` (żółty box z ostrzeżeniami).
  - `IngredientsList` (czytelna lista).
  - `InstructionsList` (Markdown/Lista kroków).
  - `ActionToolbar` (Kopiuj, Usuń, Edytuj).
  - Mobile: `AccordionSections` (zwijane sekcje).
- **UX/Bezpieczeństwo:** View Transitions (płynne wejście). Potwierdzenie usunięcia (Modal).

### 2.6. Profil Użytkownika

- **Ścieżka:** `/profile`
- **Główny cel:** Edycja preferencji żywieniowych i zarządzanie kontem.
- **Kluczowe informacje:** Aktualna dieta, alergeny, nielubiane, przycisk wylogowania.
- **Kluczowe komponenty:** Re-użyty komponent `OnboardingWizard` w trybie edycji (pre-fill danych).
- **UX/Bezpieczeństwo:** Zmiana diety oznaczy stare przepisy jako "nieaktualne".

## 3. Mapa podróży użytkownika

### Główny Scenariusz: Nowy Użytkownik generuje pierwszy przepis

1.  **Wejście:** Użytkownik trafia na `/`. Klika "Zacznij teraz".
2.  **Rejestracja:** Podaje email/hasło na `/register`. Konto zostaje utworzone.
3.  **Onboarding:**
    - Krok 1: Wybiera dietę "Keto".
    - Krok 2: Zaznacza alergen "Orzeszki".
    - Krok 3: Wybiera z listy "Cebula" jako nielubianą.
    - Zapis: System generuje awatar i zapisuje profil.
4.  **Dashboard:** Użytkownik widzi pusty stan ("Brak przepisów") oraz licznik "3/3".
5.  **Akcja:** Klika przycisk "Generuj" (FAB lub w Menu).
6.  **Formularz (Modal):** Wkleja tekst przepisu "Spaghetti Carbonara".
7.  **Zatwierdzenie:** Klika "Modyfikuj". Pojawia się modal: "Zużyjesz 1 z 3 kredytów". Potwierdza.
8.  **Oczekiwanie:** Widzi ekran z licznikiem (Countdown) i ciekawostką.
9.  **Wynik:** Zostaje przekierowany do widoku `/recipe/[new-id]`. Widzi "Keto Carbonara" (bez makaronu, bez cebuli).
10. **Powrót:** Klika "Wróć" -> Dashboard pokazuje 1 kafelek z fioletową ramką (Keto). Licznik pokazuje "2/3".

## 4. Układ i struktura nawigacji

System wykorzystuje dwie odrębne strategie nawigacyjne:

### 4.1. Desktop (Szerokie ekrany)

- **Top Menu Bar:**
  - Lewa: Logo (kliknięcie -> Dashboard).
  - Prawa:
    - Link "Twoje przepisy" (Dashboard).
    - Przycisk "Generuj" (Primary Action).
    - Awatar użytkownika (Dropdown: Profil, Wyloguj, Tryb Ciemny).
- **Kontekst:** Wyszukiwarka znajduje się w treści strony Dashboardu, nie w pasku nawigacji.

### 4.2. Mobile (Wąskie ekrany)

- **Sidebar (Hamburger Menu):**
  - Nagłówek: Awatar + Nazwa użytkownika.
  - Linki: Dashboard, Profil.
  - Stopka Sidebara: Przełącznik motywu, Linki prawne (Regulamin), Wyloguj.
- **FAB (Floating Action Button):**
  - Umiejscowiony w prawym dolnym rogu (fixed).
  - Obsługuje akcję "Generuj".
  - Zmienia stan wizualny po wyczerpaniu limitu (ikona kłódki/szary).
- **Sticky Search:** Pasek wyszukiwania przykleja się do góry ekranu pod nagłówkiem podczas przewijania listy.

## 5. Kluczowe komponenty

### 5.1. `GenerateOverlay` (Globalny)

Komponent odpowiedzialny za logikę biznesową modyfikacji.

- **Funkcje:** Wklejanie tekstu, walidacja długości (1000 znaków), obsługa limitów, Modal potwierdzenia, Countdown, Error handling.
- **Persystencja:** Zachowuje wpisany tekst w `sessionStorage` lub lokalnym store (Nano Stores) na wypadek przypadkowego zamknięcia.

### 5.2. `RecipeCard`

Wizualna reprezentacja przepisu na liście.

- **Cechy:** Posiada kolorową ramkę (`border-2`) zgodną z dietą przepisu (np. Zielony dla Vege).
- **Content:** Ikona diety, Tytuł, Czas przygotowania, Data (relatywna).
- **Stan:** Obsługa stanu "Nieaktualny" (wyszarzenie).

### 5.3. `StickySearchFilter`

Pasek narzędziowy na Dashboardzie.

- **Funkcje:** Input tekstowy z `debounce` (300ms).
- **Desktop:** Filtry (Dieta, Sortowanie) widoczne obok inputa.
- **Mobile:** Ikona "Lejka" otwierająca Bottom Sheet z filtrami.

### 5.4. `MobileRecipeViewer`

Specjalistyczny widok szczegółów dla mobile.

- **Struktura:** Accordion (Zwijane sekcje).
- **Nawigacja:** Sticky Headers dla sekcji "Składniki" i "Instrukcje" + kotwice (anchors) do szybkiego skoku.
- **Akcje:** Sticky Toolbar lub FAB z akcjami (Kopiuj, Usuń).

### 5.5. `CreditCounter`

Wskaźnik limitu.

- **Prezentacja:** "2/3".
- **Kontekst:** Widoczny w nagłówku Dashboardu oraz w Modalu potwierdzenia generowania.

### 5.6. `SkeletonLoader`

Zestaw placeholderów imitujących układ treści.

- Używany zamiast spinnerów ładowania na liście przepisów i w szczegółach, aby zminimalizować przesunięcia układu (CLS).
