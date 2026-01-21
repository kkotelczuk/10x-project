# Plan implementacji widoku Profil Uzytkownika

## 1. Przeglad
Widok profilu umozliwia edycje preferencji zywieniowych i zarzadzanie kontem. Uzywa ponownie kreatora onboardingu w trybie edycji z prefill danych profilu oraz udostepnia przycisk wylogowania. Zmiana diety skutkuje oznaczeniem starych przepisow jako nieaktualnych.

## 2. Routing widoku
Sciezka: `/profile` (nowa strona Astro: `src/pages/profile.astro`).

## 3. Struktura komponentow
- `ProfilePage` (Astro)
- `ProfileView` (React, kontener logiki)
- `ProfileHeader`
- `ProfileWizardCard` (wrapper dla kreatora)
- `OnboardingWizard` (rozszerzony o tryb edycji)
- `LogoutButton`
- `ProfileLoadingState` / `ProfileErrorState`

## 4. Szczegoly komponentow
### ProfilePage (Astro)
- Opis komponentu: Strona routingu dla `/profile`, laduje Reactowy widok profilu.
- Glowne elementy: `Layout`, `main`, `ProfileView` z `client:load`.
- Obslugiwane interakcje: brak (statyczny wrapper).
- Obslugiwana walidacja: brak.
- Typy: brak.
- Propsy: brak.

### ProfileView (React)
- Opis komponentu: Orkiestruje pobieranie danych profilu, diet i alergenow; przekazuje prefill do kreatora i obsluguje zapis.
- Glowne elementy: naglowek, wrapper karty, `OnboardingWizard` w trybie edycji, `LogoutButton`.
- Obslugiwane interakcje:
  - klikniecie "Edytuj preferencje" (jesli dodamy skrot, np. przejscie do kroku 1),
  - zapis zmian w kreatorze,
  - wylogowanie.
- Obslugiwana walidacja: weryfikuje komplet danych wymaganych przez API przed wyslaniem PUT.
- Typy: `ProfileDTO`, `DietDTO`, `AllergenDTO`, `ProfileFormState`, `ProfileViewData`.
- Propsy:
  - `initialProfile?: ProfileDTO` (opcjonalnie, jesli SSR)

### ProfileHeader
- Opis komponentu: Pokazuje dane kontekstowe profilu (np. imie, aktualna dieta) i ostrzezenie o nieaktualnych przepisach po zmianie diety.
- Glowne elementy: `h1`, opis, badge z dieta, alert/tekst informacyjny.
- Obslugiwane interakcje: brak.
- Obslugiwana walidacja: brak.
- Typy: `UserDashboardContext` lub `ProfileHeaderModel`.
- Propsy:
  - `displayName: string | null`
  - `currentDietName?: string | null`
  - `showDietChangeNotice: boolean`

### ProfileWizardCard
- Opis komponentu: Opakowanie wizualne dla kreatora edycji, utrzymuje spojnosc UI.
- Glowne elementy: `Card`, `CardContent`, `OnboardingWizard`.
- Obslugiwane interakcje: delegowane do `OnboardingWizard`.
- Obslugiwana walidacja: brak.
- Typy: `OnboardingWizardProps`.
- Propsy: `wizardProps: OnboardingWizardProps`.

### OnboardingWizard (rozszerzony)
- Opis komponentu: Uzywany w trybie "create" i "edit". W trybie edycji prefilluje dane profilu i nie wymaga akceptacji regulaminu.
- Glowne elementy: `Progress`, kroki 1-4, przyciski Next/Back/Complete.
- Obslugiwane interakcje: nawigacja krokami, zmiana pol, zapis (PUT).
- Obslugiwana walidacja:
  - tryb `create`: `display_name` min 2 znaki, `accept_terms` = true.
  - tryb `edit`: `display_name` min 2 znaki (opcjonalnie), `accept_terms` pomijane.
  - `diet_id` moze byc null, `allergen_ids` i `dislike_ids` jako tablice string.
- Typy: `UpsertProfileCommand`, `OnboardingMode`, `OnboardingPrefill`.
- Propsy:
  - `diets: DietDTO[]`
  - `allergens: AllergenDTO[]`
  - `mode: "create" | "edit"`
  - `initialData?: OnboardingPrefill`
  - `onComplete?: (profile: ProfileDTO) => void`
  - `onCancel?: () => void`

### LogoutButton
- Opis komponentu: Wylogowanie uzytkownika.
- Glowne elementy: `Button`.
- Obslugiwane interakcje: klik -> `supabaseClient.auth.signOut()` i redirect do `/login` lub `/`.
- Obslugiwana walidacja: brak.
- Typy: brak.
- Propsy: opcjonalnie `onLogout?: () => void`.

### ProfileLoadingState / ProfileErrorState
- Opis komponentu: Stan ladowania i blad pobierania profilu.
- Glowne elementy: skeleton/placeholder, komunikat bledu, przycisk "Sprobuj ponownie".
- Obslugiwane interakcje: `refetch`.
- Obslugiwana walidacja: brak.
- Typy: brak.
- Propsy: `error?: string`, `onRetry?: () => void`.

## 5. Typy
- `ProfileDTO` (istniejacy): `id`, `display_name`, `diet_id`, `allergens`, `dislikes`, `terms_accepted_at`, `created_at`.
- `UpsertProfileCommand` (istniejacy): `diet_id`, `allergen_ids`, `dislike_ids`, `display_name?`, `accept_terms?`.
- `DietDTO`, `AllergenDTO`, `IngredientDTO` (istniejace).
- Nowe typy ViewModel:
  - `OnboardingMode = "create" | "edit"`.
  - `OnboardingPrefill`:
    - `display_name: string | null`
    - `diet_id: string | null`
    - `allergen_ids: string[]`
    - `dislike_ids: string[]`
  - `ProfileFormState` (lokalny stan widoku):
    - `profile: ProfileDTO | null`
    - `diets: DietDTO[]`
    - `allergens: AllergenDTO[]`
    - `isLoading: boolean`
    - `error: string | null`
    - `isDirty: boolean`
  - `ProfileHeaderModel`:
    - `displayName: string | null`
    - `currentDietName: string | null`
    - `showDietChangeNotice: boolean`

## 6. Zarzadzanie stanem
- `ProfileView` utrzymuje stan pobranych danych i przekazuje `initialData` do `OnboardingWizard`.
- Nowy hook `useProfile` (w `src/components/hooks`) do pobierania pelnego `ProfileDTO` z `GET /api/profile`.
- Istniejacy `useDiets` uzywany do diet; analogiczny hook `useAllergens` dla `/rest/v1/allergens`.
- `OnboardingWizard` ma lokalny stan formularza, ale w trybie edycji inicjalizuje go z `initialData`.
- `isDirty` do ostrzegania o niezapisanych zmianach (opcjonalnie).

## 7. Integracja API
- `GET /api/profile`
  - Response: `ProfileDTO`
  - Akcja: prefill kreatora, wyswietlenie aktualnych preferencji.
- `PUT /api/profile`
  - Request: `UpsertProfileCommand`
  - Response: `ProfileDTO`
  - Akcja: zapis zmian, toast sukcesu, przekierowanie do `/dashboard` lub `/`.
- `GET /rest/v1/diets`
  - Response: `DietDTO[]`
  - Akcja: lista diet w kroku 2.
- `GET /rest/v1/allergens`
  - Response: `AllergenDTO[]`
  - Akcja: lista alergenow w kroku 3.
- `GET /rest/v1/ingredients?query=...`
  - Response: `IngredientDTO[]`
  - Akcja: wyszukiwarka dislikes w kroku 4.

## 8. Interakcje uzytkownika
- Wejscie na `/profile` -> ladowanie profilu, diet i alergenow.
- Wyswietlenie prefill danych w kreatorze (dieta, alergeny, dislikes, display name).
- Zmiana diety -> pokazanie informacji, ze stare przepisy zostana oznaczone jako nieaktualne.
- Przejscie przez kroki i zapis -> PUT `/api/profile`, toast sukcesu, redirect.
- Blad zapisu -> toast bledu, pozostanie na stronie.
- Wylogowanie -> `supabaseClient.auth.signOut()` i redirect.

## 9. Warunki i walidacja
- `display_name` min 2 znaki (krok 1).
- `accept_terms` wymagane tylko w trybie `create` (pomijane w `edit`).
- `diet_id` moze byc `null` (opcja "Brak").
- `allergen_ids` i `dislike_ids` to tablice string (moga byc puste).
- Blokada przycisku "Complete Profile" podczas zapisu (`isSubmitting`).
- W kroku 2 wymagany wybor diety lub "Brak" przed przejsciem dalej.

## 10. Obsluga bledow
- `GET /api/profile`:
  - 401 -> redirect do `/login`.
  - 404 -> komunikat o braku profilu i opcja uruchomienia kreatora w trybie `create`.
  - inne -> wyswietlenie bledu i przycisk ponowienia.
- `PUT /api/profile`:
  - 400 (walidacja) -> pokazanie komunikatu i pozostanie w kroku.
  - 500 -> toast bledu.
- Wyszukiwarka dislikes: brak wynikow -> pusty stan; blad -> cichy komunikat w konsoli i toast informacyjny.

## 11. Kroki implementacji
1. Dodaj nowa strone `src/pages/profile.astro` i osadz `ProfileView` z `client:load`.
2. Stworz `ProfileView` (np. `src/components/profile/ProfileView.tsx`) oraz proste komponenty stanu ladowania/bledu.
3. Dodaj hook `useProfile` i `useAllergens` w `src/components/hooks`.
4. Rozszerz `OnboardingWizard` o `mode` oraz `initialData` i zmodyfikuj walidacje dla trybu `edit`.
5. Upewnij sie, ze krok 2 obsluguje opcje "Brak" (ustawia `diet_id` na null).
6. Dodaj komponent `LogoutButton` z wywolaniem `supabaseClient.auth.signOut()`.
7. Dodaj ostrzezenie o nieaktualnych przepisach przy zmianie diety (UI + logika porownania `diet_id`).
8. Sprawdz UX i walidacje: blokady przyciskow, wyswietlanie bledow, toasty.
9. Zweryfikuj zgodnosc z API (`UpsertProfileCommand`), szczegolnie brak `accept_terms` w trybie edycji.
