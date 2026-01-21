# Plan implementacji widoku Dashboard

## 1. Przegląd

Widok Dashboardu (`/dashboard`) stanowi główne centrum sterowania dla zalogowanego użytkownika. Umożliwia przeglądanie zapisanych przepisów, zarządzanie nimi (wyszukiwanie, filtrowanie) oraz monitorowanie dziennego limitu generowania przepisów. Projekt realizuje podejście **Mobile First** z dedykowanymi elementami nawigacyjnymi (FAB).

## 2. Routing widoku

- **Ścieżka:** `/dashboard`
- **Plik Astro:** `src/pages/dashboard.astro`
- **Dostęp:** Tylko dla zalogowanych użytkowników (chronione przez Middleware).

## 3. Struktura komponentów

```text
src/pages/dashboard.astro (Server Component)
└── Layout.astro
    └── DashboardView.tsx (Client Island - client:load)
        ├── WelcomeHeader.tsx
        │   └── UsageProgressBar.tsx
        ├── DashboardFilters.tsx
        │   ├── SearchInput.tsx
        │   ├── DietSelect.tsx
        │   └── SortSelect.tsx
        ├── RecipeGrid.tsx
        │   ├── RecipeCard.tsx (x Lista)
        │   └── RecipeCardSkeleton.tsx (Loading state)
        └── FloatingActionButton.tsx (Mobile only)
```

## 4. Szczegóły komponentów

### `DashboardPage` (Astro)

- **Opis:** Kontener serwerowy. Odpowiada za wstępną weryfikację sesji (choć robi to middleware) i wyrenderowanie szkieletu strony.
- **Główne elementy:** `Layout`, `DashboardView`.
- **Typy:** Brak propsów.

### `DashboardView` (React)

- **Opis:** Główny "Mózg" widoku. Zarządza stanem filtrów, pobieraniem danych i koordynacją komponentów potomnych.
- **Zarządzanie stanem:** Przechowuje `searchQuery`, `selectedDiet`, `sortOrder`, `recipes` (dane), `isLoading`.
- **Integracja API:** Wywołuje hooki `useRecipes` oraz `useProfile`.

### `WelcomeHeader`

- **Opis:** Wyświetla powitanie użytkownika oraz wizualizację limitu generowania.
- **Props:**
  - `displayName`: string
  - `usage`: `{ remaining: number; limit: number }`

### `DashboardFilters`

- **Opis:** Pasek narzędziowy sticky (przyklejony u góry na mobile/desktop).
- **Elementy:**
  - Input tekstowy (szukanie po tytule).
  - Select (wybór diety - pobrany z lookups lub hardcoded na start).
  - Select (sortowanie: Najnowsze / Najstarsze).
- **Props:**
  - `onSearchChange`: (val: string) => void
  - `onDietChange`: (val: string) => void
  - `onSortChange`: (val: string) => void
  - `currentFilters`: Object

### `RecipeGrid` & `RecipeCard`

- **Opis:** Siatka wyświetlająca przepisy.
- **Logika "Stale" (US-014):** Komponent `RecipeCard` otrzymuje `userDietId`. Jeśli `recipe.diet_label` jest inne niż `userDietId`, karta otrzymuje stylizację "nieaktualne" (wyszarzenie, ikona info).
- **Props (Card):**
  - `recipe`: `RecipeListItemDTO`
  - `isStale`: boolean
- **Akcje:** Kliknięcie w kartę przenosi do widoku szczegółów `/recipes/[id]`.

### `FloatingActionButton` (FAB)

- **Opis:** Przycisk "+" dostępny tylko na widokach mobilnych (hidden on md+).
- **Akcja:** Przekierowanie do `/` (strona główna/generator).

## 5. Typy

Wymagane rozszerzenie lub wykorzystanie istniejących typów w `src/types.ts`:

### 5.1. View Models

```typescript
// Stan filtrów w Dashboardzie
export interface DashboardFiltersState {
  search: string;
  diet: string | "all";
  sort: "created_at.desc" | "created_at.asc";
}

// Skrócony profil użytkownika potrzebny do kontekstu Dashboardu
export interface UserDashboardContext {
  displayName: string | null;
  currentDietId: string | null; // Kluczowe do wykrywania "stale" przepisów
}
```

### 5.2. Wykorzystane DTO

- `RecipeListItemDTO` (istniejące): Do wyświetlania listy.

## 6. Zarządzanie stanem

Stan będzie zarządzany lokalnie w komponencie `DashboardView` z wykorzystaniem React Hooks.

1.  **Stan filtrów:** `useState<DashboardFiltersState>`
2.  **Stan danych:** Custom hook `useRecipes(filters)`
    - Obsługuje _debouncing_ dla wyszukiwania (500ms).
    - Obsługuje stan `loading` i `error`.
    - Triggeruje zapytanie do API przy zmianie filtrów.
3.  **Stan profilu:** Custom hook `useProfileSummary()`
    - Pobiera informację o aktualnej diecie użytkownika (do logiki "stale").

## 7. Integracja API

Zgodnie z dokumentacją (punkt 3.3.1), integracja odbędzie się poprzez endpoint `/rest/v1/recipes` (Proxy) lub bezpośrednio przez klienta Supabase, zależnie od gotowości endpointu. Plan zakłada użycie kontraktu endpointu REST.

**Żądanie (Fetch):**

- **URL:** `/rest/v1/recipes`
- **Method:** `GET`
- **Query Params:**
  - `select`: `id,title,diet_label,created_at,is_active,prep_time_minutes`
  - `order`: `created_at.desc` (lub asc)
  - `diet_label`: `eq.{selectedDiet}` (jeśli wybrano filtr)
  - `title`: `ilike.*{searchQuery}*` (jeśli wpisano tekst)

**Odpowiedź:**

- `200 OK`: Tablica `RecipeListItemDTO[]`
- `401 Unauthorized`: Przekierowanie do logowania.

## 8. Interakcje użytkownika

1.  **Wejście na stronę:**
    - Ładowanie skeletonów.
    - Pobranie profilu użytkownika i pierwszej strony przepisów.
2.  **Wpisanie frazy w wyszukiwarkę:**
    - Input reaguje natychmiastowo.
    - Zapytanie do API wysyłane po 500ms bezczynności (debounce).
3.  **Zmiana diety w filtrze:**
    - Natychmiastowe przeładowanie listy z nowym parametrem `diet_label`.
4.  **Scrollowanie (opcjonalnie Load More):**
    - Paginacja może być zrealizowana jako przycisk "Załaduj więcej" na dole listy.
5.  **Kliknięcie w "Nieaktualny" przepis:**
    - Przepis jest normalnie otwieralny, ale wizualnie odróżniony (zgodnie z US-014).

## 9. Warunki i walidacja

- **Walidacja statusu "Stale":**
  - Warunek: `recipe.diet_label !== user.current_diet_id`.
  - Efekt: Karta otrzymuje klasę CSS `grayscale opacity-75`, dodawany jest badge "Nieaktualna dieta".
- **Walidacja pustego stanu:**
  - Jeśli API zwróci pustą tablicę: Wyświetl komponent `EmptyState` z zachętą do stworzenia przepisu.

## 10. Obsługa błędów

- **Błąd pobierania danych:** Wyświetlenie komponentu błędu w miejscu gridu z przyciskiem "Spróbuj ponownie".
- **Błąd sieci:** Toast notification (biblioteka `sonner`).
- **Wylogowanie w tle:** Jeśli API zwróci 401, automatyczne przekierowanie do `/login`.

## 11. Kroki implementacji

1.  **Setup routingu i layoutu:**
    - Stworzenie `src/pages/dashboard.astro`.
    - Zabezpieczenie strony (sprawdzenie `locals.user`).
2.  **Przygotowanie komponentów UI:**
    - Implementacja `RecipeCard` (bazując na `shadcn/ui card`).
    - Implementacja `RecipeCardSkeleton`.
    - Implementacja `WelcomeHeader` i `FloatingActionButton`.
3.  **Logika biznesowa (Hooks):**
    - Stworzenie hooka `useRecipes` obsługującego fetch do `/rest/v1/recipes` z budowaniem query string.
    - Stworzenie hooka `useProfileSummary` (można wykorzystać istniejący serwis profilu).
4.  **Integracja widoku (DashboardView):**
    - Złożenie komponentów w `DashboardView`.
    - Podpięcie stanów filtrów.
    - Implementacja logiki porównywania diety (stale check).
5.  **Stylizacja i Responsywność:**
    - Dostosowanie Gridu (1 col mobile, 3 col desktop).
    - Sticky header dla filtrów.
6.  **Testy manualne:**
    - Weryfikacja filtrowania i szukania.
    - Sprawdzenie czy przepisy z innej diety są wyszarzone.
