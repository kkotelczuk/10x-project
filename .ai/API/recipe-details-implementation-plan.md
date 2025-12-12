# API Endpoint Implementation Plan: Get Recipe Details

## 1. Przegląd punktu końcowego

Implementacja endpointu `GET /rest/v1/recipes`, który zwraca szczegółowe dane pojedynczego przepisu. Endpoint ten pośredniczy w komunikacji z Supabase, zapewniając walidację parametrów i formatowanie odpowiedzi zgodnie z definicją `RecipeDetailsDTO`. Obsługuje specyficzną składnię zapytań PostgREST (`id=eq.{uuid}`) wymaganą przez specyfikację.

## 2. Szczegóły żądania

- **Metoda HTTP:** `GET`
- **Struktura URL:** `/rest/v1/recipes`
- **Parametry URL (Query Params):**
  - **Wymagane:**
    - `id`: Identyfikator przepisu (UUID). Akceptowany format: `eq.{uuid}` lub czysty `{uuid}`.
  - **Opcjonalne:**
    - `select`: Ignorowany przez logikę biznesową (endpoint zawsze zwraca pełny obiekt), ale akceptowany w żądaniu.
- **Request Body:** Brak.

## 3. Wykorzystywane typy

- **DTO (Response):** `RecipeDetailsDTO` (z `src/types.ts`) - zawiera pełne dane przepisu, w tym `ingredients` i `instructions` jako struktury JSON.
- **Service:** `RecipeService` (nowy serwis w `src/lib/services/recipe.service.ts`).

## 4. Szczegóły odpowiedzi

- **Sukces (200 OK):**
  - Zwraca obiekt JSON zgodny z `RecipeDetailsDTO`.
  - Content-Type: `application/json`.
- **Kody statusu:**
  - `200`: Pomyślne pobranie danych.
  - `400`: Nieprawidłowy parametr `id` (brak lub zły format).
  - `401`: Brak autoryzacji (użytkownik nie jest zalogowany).
  - `404`: Przepis nie został znaleziony (lub użytkownik nie ma do niego dostępu przez RLS).
  - `500`: Błąd serwera/bazy danych.

## 5. Przepływ danych

1. **Endpoint (`src/pages/rest/v1/recipes.ts`)**:
   - Odbiera żądanie.
   - Pobiera klienta Supabase z `context.locals` (uwierzytelniony klient).
   - Parsuje parametr `id`, usuwając opcjonalny prefiks `eq.`.
   - Waliduje format UUID (używając `zod`).
2. **Service (`src/lib/services/recipe.service.ts`)**:
   - Wywołuje metodę `getRecipeById(id)`.
   - Wykonuje zapytanie do tabeli `recipes` w Supabase: `.select("*").eq("id", id).single()`.
3. **Database (Supabase)**:
   - Sprawdza uprawnienia RLS (czy `user_id` zgadza się z sesją).
   - Zwraca dane rekordu.
4. **Endpoint**:
   - Zwraca odpowiedź JSON do klienta.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie:** Endpoint jest dostępny tylko dla zalogowanych użytkowników. Middleware Astro powinno weryfikować sesję lub endpoint zwróci 401 jeśli `locals.user` / `locals.supabase` jest niedostępne.
- **Autoryzacja (RLS):** Bezpieczeństwo danych opiera się na Row Level Security w bazie danych Postgres. Użycie klienta z `locals.supabase` jest krytyczne, aby zapytanie było wykonywane w kontekście zalogowanego użytkownika.
- **Walidacja danych:** Parametr `id` jest ściśle walidowany pod kątem bycia poprawnym UUID v4, co zapobiega atakom typu SQL Injection (choć Supabase Client też przed tym chroni).

## 7. Obsługa błędów

- **Błędy walidacji:** Zwracany kod `400 Bad Request` z komunikatem JSON wyjaśniającym problem (np. "Invalid ID format").
- **Brak wyniku:** Jeśli `data` jest null lub wystąpi błąd `PGRST116` (row not found), zwracany jest kod `404 Not Found`.
- **Błędy systemowe:** Każdy nieobsłużony wyjątek lub błąd połączenia z DB jest łapany w bloku `try-catch`, logowany na serwerze (`console.error`), a klient otrzymuje generyczny błąd `500 Internal Server Error`.

## 8. Rozważania dotyczące wydajności

- **Pobieranie danych:** Zapytanie używa klucza głównego (`id`), co gwarantuje użycie indeksu i bardzo szybki czas dostępu.
- **Cache:** Ze względu na specyfikę danych użytkownika i potencjalną edytowalność, cache powinien być ustawiony ostrożnie (np. `private, no-cache` lub krótki czas życia), aby użytkownik nie widział nieaktualnych danych po edycji. W `diets.ts` użyto cache publicznego, ale przepisy użytkownika są danymi prywatnymi. Sugerowany nagłówek: `Cache-Control: private, no-store` lub `max-age=0`.

## 9. Kroki implementacji

### Krok 1: Utworzenie `RecipeService`

- Utwórz plik `src/lib/services/recipe.service.ts`.
- Zaimplementuj klasę `RecipeService` przyjmującą `SupabaseClient` w konstruktorze.
- Dodaj metodę `getRecipeById(id: string): Promise<RecipeDetailsDTO | null>`.
- Zaimplementuj obsługę błędu "nie znaleziono" (zwracanie `null` lub rzucanie specyficznego błędu).

### Krok 2: Utworzenie Endpointu API

- Utwórz plik `src/pages/rest/v1/recipes.ts`.
- Skonfiguruj `prerender = false`.
- Zaimplementuj handler `GET`.
- Dodaj logikę parsowania parametru `id` (obsługa `eq.`).
- Dodaj walidację UUID.
- Połącz z `RecipeService`.

### Krok 3: Weryfikacja

- Uruchom serwer deweloperski.
- Przetestuj żądanie z poprawnym ID (z prefiksem `eq.` i bez).
- Przetestuj żądanie z nieistniejącym ID (oczekiwane 404).
- Przetestuj żądanie bez logowania (oczekiwane 401/404 zależnie od konfiguracji middleware/RLS).
