# API Endpoint Implementation Plan: Recipes List

## 1. Przegląd punktu końcowego
Ten punkt końcowy (`GET /rest/v1/recipes`) służy do pobierania listy przepisów użytkownika na potrzeby widoku pulpitu nawigacyjnego (Dashboard). Zwraca lekkie obiekty DTO zawierające tylko niezbędne pola, obsługuje filtrowanie po etykiecie diety, wyszukiwanie po tytule oraz sortowanie. Dostęp do danych jest zabezpieczony przez RLS (Row Level Security) bazy danych Supabase.

## 2. Szczegóły żądania
- **Metoda HTTP**: `GET`
- **Struktura URL**: `/rest/v1/recipes`
- **Parametry zapytania (Query Parameters)**:
  - **Filtrowanie**:
    - `diet_label`: Oczekiwany format `eq.{value}` (np. `eq.keto`).
  - **Wyszukiwanie**:
    - `title`: Oczekiwany format `ilike.*{query}*` (np. `ilike.*pizza*`).
  - **Sortowanie**:
    - `order`: Oczekiwane `created_at.desc` (domyślne).
  - **Projekcja**:
    - `select`: `id,title,diet_label,created_at,is_active,prep_time_minutes` (Służy jako informacja o zwracanych polach; backend wymusi zwracanie `RecipeListItemDTO`).

## 3. Wykorzystywane typy
- **DTO**: `RecipeListItemDTO` (zdefiniowane w `src/types.ts`)
  ```typescript
  export type RecipeListItemDTO = Pick<
    DbRow<"recipes">,
    "id" | "title" | "diet_label" | "created_at" | "is_active" | "prep_time_minutes"
  >;
  ```
- **Service Params Interface**: (do utworzenia w serwisie)
  ```typescript
  export interface ListRecipesParams {
    userId: string;
    dietLabel?: string; // Wartość wyekstrahowana z 'eq.{value}'
    searchQuery?: string; // Wartość wyekstrahowana z 'ilike.*{query}*'
    limit?: number;
  }
  ```

## 4. Szczegóły odpowiedzi
- **Kod sukcesu**: `200 OK`
- **Typ zawartości**: `application/json`
- **Ciało odpowiedzi**: Tablica obiektów `RecipeListItemDTO`.

Przykład:
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Keto Pizza",
    "diet_label": "keto",
    "is_active": true,
    "created_at": "2024-01-02T12:00:00Z",
    "prep_time_minutes": 30
  }
]
```

## 5. Przepływ danych
1. **Klient** wysyła żądanie `GET /rest/v1/recipes` z parametrami.
2. **Astro Endpoint** (`src/pages/rest/v1/recipes.ts`):
   - Inicjalizuje klienta Supabase z kontekstu (`context.locals.supabase`).
   - Weryfikuje sesję użytkownika (`auth.getUser()`).
   - Parsuje i waliduje parametry zapytania (wyodrębnia wartości z formatu PostgREST).
   - Przekazuje żądanie do warstwy serwisu.
3. **RecipeService** (`src/lib/services/recipe.service.ts`):
   - Buduje zapytanie do tabeli `recipes`.
   - Stosuje `select` ograniczony do pól DTO.
   - Stosuje filtry (`eq` dla diety, `ilike` dla tytułu) jeśli zostały przekazane.
   - Stosuje sortowanie (`order('created_at', { ascending: false })`).
   - Wykonuje zapytanie do bazy danych.
4. **Baza danych (Supabase)**:
   - Polityki RLS filtrują rekordy, zwracając tylko te należące do `auth.uid()`.
5. **Astro Endpoint**:
   - Zwraca dane JSON do klienta.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Weryfikacja JWT (token dostępu) przez `supabase.auth.getUser()`. Brak sesji skutkuje błędem `401 Unauthorized`.
- **Autoryzacja (RLS)**: Logika biznesowa polega na Row Level Security w bazie danych. Endpoint nie musi ręcznie filtrować po `user_id`, ponieważ robi to baza danych w oparciu o kontekst sesji.
- **Sanityzacja danych**: Parametry wejściowe są parsowane i przekazywane do sparametryzowanych metod klienta Supabase, co chroni przed SQL Injection.
- **Walidacja**: Użycie `zod` do sprawdzenia poprawności parametrów wejściowych (nawet jeśli są opcjonalne).

## 7. Obsługa błędów
| Scenariusz | Kod HTTP | Opis |
| :--- | :--- | :--- |
| Prawidłowe żądanie | 200 | Zwraca listę przepisów. |
| Brak tokena / nieprawidłowa sesja | 401 | Użytkownik nie jest zalogowany. |
| Błąd parsowania parametrów | 400 | Parametry mają nieprawidłowy format (nie pasują do wzorców `eq.` / `ilike.`). |
| Błąd bazy danych | 500 | Wewnętrzny błąd serwera podczas zapytania do DB. |

## 8. Wydajność
- **Projekcja danych**: Pobierane są tylko kolumny wymagane przez `RecipeListItemDTO`, co minimalizuje transfer danych (pomijane są duże pola JSON `ingredients` i `instructions`).
- **Indeksowanie**: Upewnić się, że kolumny `user_id`, `diet_label` i `created_at` są zaindeksowane w bazie danych dla szybkiego filtrowania i sortowania.
- **Prerender**: Endpoint musi być dynamiczny (`export const prerender = false`), ponieważ zależy od uwierzytelnionego użytkownika.

## 9. Kroki implementacji

1.  **Utworzenie Serwisu**:
    - Stworzyć plik `src/lib/services/recipe.service.ts`.
    - Zaimplementować klasę `RecipeService` z metodą `listRecipes`.
    - Metoda powinna przyjmować klienta Supabase oraz parametry filtrów.
    - Zaimplementować logikę budowania zapytania Supabase query builder.

2.  **Utworzenie Endpointu API**:
    - Stworzyć plik `src/pages/rest/v1/recipes.ts`.
    - Skonfigurować `prerender = false`.
    - Zaimplementować handler `GET`.
    - Dodać walidację sesji użytkownika.
    - Dodać logikę parsowania parametrów URL (zamiana `eq.{val}` na `{val}` itp.).
    - Wywołać `RecipeService`.
    - Zwrócić odpowiedź JSON.

3.  **Parsowanie Query Params (Helper)**:
    - Wewnątrz endpointu lub w `src/lib/utils.ts` dodać proste funkcje pomocnicze do wyciągania wartości z prefiksów PostgREST (`eq.`, `ilike.`), aby zachować czystość kodu w kontrolerze.

