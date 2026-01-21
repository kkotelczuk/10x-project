# Plan implementacji widoku Szczegółów Przepisu

## 1. Przegląd
Widok szczegółów przepisu (`RecipeDetails`) służy do prezentacji wygenerowanego przepisu w formie czytelnej dla użytkownika (format "do gotowania"). Kluczowe aspekty to czytelność, szybkość działania (SSR) oraz łatwy dostęp do akcji takich jak kopiowanie treści i usuwanie przepisu. Widok realizuje podejście Mobile First z adaptacyjnym układem treści.

## 2. Routing widoku
- **Ścieżka:** `/recipe/[id]`
- **Typ routingu:** Dynamiczny, renderowany po stronie serwera (SSR) w Astro.

## 3. Struktura komponentów

Struktura opiera się na hybrydowym podejściu Astro (Server Islands). Większość treści jest statyczna (HTML/CSS) dla wydajności, a interaktywność (akcje) jest wstrzykiwana jako wyspa React.

```text
src/pages/recipe/[id].astro (Page Root)
├── Layout (Astro Layout)
├── RecipeHeader (Astro Component)
│   ├── Title
│   ├── MetaBadges (Time, Diet)
│   └── AiNotesAlert (Conditional Astro Component)
├── RecipeContent (Astro Component - Grid/Flex Layout)
│   ├── IngredientsSection (Astro Component)
│   │   └── <details> (Native Accordion for Mobile) / List (Desktop)
│   └── InstructionsSection (Astro Component)
│       └── <details> (Native Accordion for Mobile) / Ordered List
└── RecipeActions (React Island - client:idle)
    ├── ActionToolbar
    ├── CopyButton
    └── DeleteRecipeDialog
```

## 4. Szczegóły komponentów

### `pages/recipe/[id].astro`
- **Opis:** Główny plik strony. Odpowiada za pobranie danych z Supabase (SSR), obsługę błędów (404/403) i renderowanie szkieletu.
- **Logika:**
  - Pobranie `id` z `Astro.params`.
  - Wywołanie `RecipeService` (lub bezpośrednie zapytanie Supabase) w celu pobrania danych.
  - Przekierowanie do 404, jeśli przepis nie istnieje.
  - Przekazanie danych do komponentów podrzędnych.

### `RecipeHeader.astro`
- **Opis:** Wyświetla tytuł przepisu, czas przygotowania oraz etykietę diety. Zawiera również ostrzeżenie od AI, jeśli istnieje.
- **Props:** `title: string`, `prepTime: number`, `diet: string`, `aiNotes?: string`.
- **Elementy:** `<h1>`, `<Badge>` (Shadcn), `Alert` (Shadcn - wariant static).

### `IngredientsSection.astro`
- **Opis:** Lista składników. Na mobile domyślnie zwinięta (lub stylizowana jako sekcja), na desktopie zawsze widoczna kolumna.
- **Implementacja Mobile:** Użycie tagów HTML5 `<details>` i `<summary>` dla natywnego akordeonu bez JS, stylizowanego za pomocą Tailwind (np. `md:hidden` dla znacznika summary, aby na desktopie było zawsze otwarte/bez nagłówka akordeonu).
- **Props:** `ingredients: RecipeIngredientJson[]`.

### `InstructionsSection.astro`
- **Opis:** Lista kroków przygotowania. Analogiczne zachowanie responsywne jak w sekcji składników.
- **Props:** `instructions: RecipeInstructionJson[]`.

### `RecipeActions.tsx` (React Island)
- **Opis:** Pasek narzędziowy z akcjami. Musi być interaktywny.
- **Props:**
  - `recipeId: string`
  - `recipeTitle: string`
  - `ingredients: RecipeIngredientJson[]`
  - `instructions: RecipeInstructionJson[]`
- **Główne elementy:**
  - `Button` (wariant outline/ghost dla Kopiuj, destructive dla Usuń).
  - `DeleteRecipeDialog` (Komponent modalny z potwierdzeniem).
- **Obsługiwane interakcje:**
  - **Kopiuj:** Formatuje dane do stringa tekstowego i kopiuje do schowka systemowego + Toast.
  - **Usuń:** Otwiera modal -> Potwierdzenie -> API Request -> Redirect.
- **Typy:** Wymaga pełnych struktur danych do sformatowania tekstu do schowka.

## 5. Typy

Wykorzystujemy typy zdefiniowane w `src/types.ts`.

```typescript
// Import z src/types.ts
import type { RecipeDetailsDTO, RecipeIngredientJson, RecipeInstructionJson } from "@/types";

// Helper type dla propsów komponentu React
export interface RecipeActionsProps {
  id: string;
  title: string;
  ingredients: RecipeIngredientJson[];
  instructions: RecipeInstructionJson[];
}
```

## 6. Zarządzanie stanem

- **Stan lokalny (React):**
  - `isDeleteDialogOpen` (boolean): Kontrola widoczności modala usuwania.
  - `isDeleting` (boolean): Stan ładowania podczas usuwania (disable button).
- **Stan globalny/serwerowy:**
  - Brak potrzeby skomplikowanego stanu globalnego. Dane są przekazywane z góry (SSR).

## 7. Integracja API

### Fetching (SSR w `[id].astro`)
Bezpośrednie użycie klienta Supabase w środowisku Astro (lub `RecipeService`).
- **Query:** `supabase.from('recipes').select('*').eq('id', params.id).single()`

### Actions (Client-side w `RecipeActions.tsx`)
1.  **Usuwanie:**
    - **Endpoint:** `DELETE /rest/v1/recipes?id=${id}`
    - **Headers:** Content-Type: application/json
    - **Response:** `{ success: true }` lub `{ error: "..." }`

## 8. Interakcje użytkownika

1.  **Wejście na stronę:** Użytkownik widzi natychmiastowo wyrenderowaną treść (dzięki SSR).
2.  **Kopiowanie:**
    - Kliknięcie "Kopiuj do schowka".
    - System formatuje tekst:
      ```text
      [Tytuł]
      
      Składniki:
      - [Ilość] [Jednostka] [Nazwa]
      
      Instrukcje:
      1. [Krok]
      ```
    - Wyświetla się toast "Skopiowano do schowka".
3.  **Usuwanie:**
    - Kliknięcie "Usuń".
    - Pojawia się `AlertDialog` z pytaniem "Czy na pewno chcesz usunąć ten przepis? Tej operacji nie można cofnąć."
    - Kliknięcie "Anuluj" zamyka modal.
    - Kliknięcie "Usuń" (destructive):
      - Przycisk zmienia stan na loading.
      - Wykonanie żądania DELETE.
      - Po sukcesie: Toast "Przepis usunięty" i przekierowanie `window.location.href = '/'` (lub do dashboardu).

## 9. Warunki i walidacja

- **ID w URL:** Musi być poprawnym UUID. Astro powinno obsłużyć to w routingu lub zwrócić 404 wewnątrz `getStaticPaths` (dla SSG) lub wewnątrz logiki SSR.
- **Dostępność danych:**
  - Jeśli `ingredients` jest null/puste -> wyświetl komunikat placeholderowy.
  - Jeśli `instructions` jest null/puste -> wyświetl komunikat placeholderowy.

## 10. Obsługa błędów

- **Przepis nieznaleziony (404):** Jeśli zapytanie do bazy zwróci błąd `PGRST116` (row not found), przekieruj na stronę 404.
- **Błąd usuwania:** Jeśli API zwróci błąd, wyświetl Toast z komunikatem błędu (np. "Nie udało się usunąć przepisu. Spróbuj ponownie.").
- **Błąd parsowania JSON:** Zabezpiecz renderowanie list składników/instrukcji przed błędnym formatem JSON w bazie (try-catch lub bezpieczne mapowanie).

## 11. Kroki implementacji

1.  **Przygotowanie Pliku Strony (`[id].astro`):**
    - Utworzenie struktury pliku.
    - Implementacja logiki pobierania danych z Supabase w sekcji frontmatter.
    - Obsługa przypadku "Not Found".

2.  **Implementacja Komponentów Statycznych (Astro):**
    - `RecipeHeader`: Stylowanie tytułu, badge'y i alertu.
    - `IngredientsSection`: Implementacja listy z wykorzystaniem `<details>` dla mobile.
    - `InstructionsSection`: Implementacja listy kroków.

3.  **Implementacja Logiki Interaktywnej (React):**
    - Stworzenie komponentu `RecipeActions.tsx`.
    - Implementacja funkcji formatowania tekstu do schowka (`formatRecipeForClipboard`).
    - Integracja z `sonner` (Toast) dla akcji kopiowania.

4.  **Implementacja Usuwania:**
    - Dodanie `AlertDialog` do `RecipeActions`.
    - Implementacja funkcji `handleDelete` wywołującej endpoint API `/rest/v1/recipes`.
    - Obsługa przekierowania po sukcesie.

5.  **Składanie Widoku:**
    - Osadzenie komponentów w `[id].astro`.
    - Dopracowanie stylów responsywnych (Tailwind) - upewnienie się, że na mobile sekcje są zwijalne, a na desktopie widoczne obok siebie (Grid).

6.  **Weryfikacja:**
    - Test manualny kopiowania (poprawność formatu).
    - Test manualny usuwania (czy rekord znika z bazy).
    - Sprawdzenie widoku na mobile i desktop.
