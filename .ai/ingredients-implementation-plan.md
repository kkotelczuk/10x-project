# API Endpoint Implementation Plan: Search Ingredients (Dislikes)

## 1. Przegląd punktu końcowego
Punkt końcowy `GET /rest/v1/ingredients` umożliwia pobieranie listy składników, które użytkownicy mogą oznaczać jako "nielubiane". Obsługuje filtrowanie po nazwie (wyszukiwanie) oraz domyślnie zwraca tylko aktywne/widoczne składniki. Jest kluczowy dla procesu konfiguracji profilu użytkownika.

## 2. Szczegóły żądania
- **Metoda HTTP:** `GET`
- **Struktura URL:** `/rest/v1/ingredients`
- **Parametry URL (Query Parameters):**
  - **Opcjonalne:**
    - `query` (string): Fraza wyszukiwania. Filtruje wyniki dopasowując do nazwy składnika (`name`) w trybie `ilike` (case-insensitive).
    - `limit` (number): Opcjonalne ograniczenie liczby wyników (domyślnie np. 50, aby nie przeciążać widoku, choć specyfikacja tego nie wymusza, jest to dobra praktyka).
- **Request Body:** Brak.

## 3. Wykorzystywane typy
- **DTO:** `IngredientDTO` (zdefiniowany w `src/types.ts`)
  ```typescript
  export type IngredientDTO = Pick<DbRow<"ingredients">, "id" | "name" | "category" | "variants">;
  ```
- **Zależności:**
  - `SupabaseClient` (z `@/db/supabase.client`)
  - `DietService` pattern (jako referencja implementacyjna)

## 3. Szczegóły odpowiedzi
- **Nagłówki:**
  - `Content-Type: application/json`
  - `Cache-Control: public, max-age=3600` (dla zapytań bez filtrów) lub krótszy cache dla wyników wyszukiwania.
- **Kod sukcesu:** `200 OK`
- **Ciało odpowiedzi:** Tablica obiektów `IngredientDTO`.
  ```json
  [
    {
      "id": "onions",
      "name": "Cebula",
      "category": "vegetable",
      "variants": ["cebula", "szalotka"]
    }
  ]
  ```
- **Kody błędów:**
  - `500 Internal Server Error`: W przypadku błędu połączenia z bazą danych lub błędu serwera.

## 4. Przepływ danych
1.  **Klient** wysyła żądanie GET na `/rest/v1/ingredients` (opcjonalnie z parametrem `?query=ceb`).
2.  **Astro Endpoint** (`src/pages/rest/v1/ingredients.ts`) przechwytuje żądanie.
3.  Endpoint inicjalizuje **IngredientService**, przekazując klienta Supabase z `locals`.
4.  **IngredientService** buduje zapytanie do tabeli `ingredients`:
    - Wybiera kolumny zdefiniowane w DTO.
    - Dodaje filtr `is_visible = true`.
    - Jeśli podano `query`, dodaje filtr `name ILIKE %query%`.
5.  **Supabase** zwraca przefiltrowane dane.
6.  **Astro Endpoint** zwraca dane jako JSON z odpowiednimi nagłówkami.

## 5. Względy bezpieczeństwa
- **Uwierzytelnianie:** Endpoint korzysta z `locals.supabase`. Dane referencyjne są zazwyczaj publicznie dostępne (polityka RLS `ENABLE SELECT FOR ALL` lub `AUTHENTICATED` zależnie od konfiguracji bazy, ale logika backendu działa w kontekście serwera).
- **Walidacja danych:** Parametr `query` jest traktowany jako string. Supabase client (`supabase-js`) automatycznie parametryzuje zapytania, chroniąc przed SQL Injection.
- **Ochrona zasobów:** Domyślny filtr `is_visible=true` zapobiega wyciekowi składników wycofanych lub roboczych.

## 6. Obsługa błędów
- Błędy bazy danych (np. timeout, brak połączenia) są przechwytywane w bloku `try-catch` w serwisie i rzucane wyżej lub obsługiwane w endpoincie.
- Endpoint loguje błąd w konsoli (`console.error`) dla celów debugowania.
- Zwracana jest generyczna wiadomość JSON `{ "error": "Internal Server Error" }` ze statusem 500, aby nie ujawniać szczegółów implementacji klientowi.

## 7. Rozważania dotyczące wydajności
- **Cache:** Ponieważ lista składników zmienia się rzadko, należy zastosować nagłówek `Cache-Control` (np. 1 godzina) dla zapytań pobierających pełną listę.
- **Indeksowanie:** Tabela `ingredients` powinna mieć indeks na kolumnie `name` (lub `is_visible`), aby przyspieszyć wyszukiwanie `ilike`, chociaż przy małej skali danych (słowniki) nie jest to krytyczne.
- **Payload:** Pobierane są tylko wymagane pola (`select('id, name, category, variants')`), co minimalizuje rozmiar przesyłanych danych.

## 8. Etapy wdrożenia

1.  **Utworzenie serwisu `IngredientService`**
    - Plik: `src/lib/services/ingredient.service.ts`
    - Klasa: `IngredientService`
    - Metoda: `searchIngredients(query?: string): Promise<IngredientDTO[]>`
    - Logika: Pobranie z Supabase z filtrowaniem.

2.  **Utworzenie endpointu API**
    - Plik: `src/pages/rest/v1/ingredients.ts`
    - Implementacja handlera `GET`.
    - Pobranie parametru `query` z URL (`url.searchParams.get('query')`).
    - Wywołanie serwisu i zwrot odpowiedzi.

3.  **Weryfikacja manualna**
    - Sprawdzenie działania endpointu dla pełnej listy.
    - Sprawdzenie działania wyszukiwania (np. `?query=a`).
    - Sprawdzenie obsługi błędów (np. przy braku połączenia - symulacja).

