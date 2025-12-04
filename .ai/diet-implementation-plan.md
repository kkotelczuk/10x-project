# API Endpoint Implementation Plan: Get Diets

## 1. Przegląd punktu końcowego

Celem tego punktu końcowego jest dostarczenie listy dostępnych diet, które są używane podczas procesu onboardingu użytkownika (kreator diety). Endpoint zwraca statyczne dane referencyjne (słownikowe) zdefiniowane w systemie.

## 2. Szczegóły żądania

- **Metoda HTTP**: `GET`
- **Struktura URL**: `/rest/v1/diets`
- **Parametry**:
  - **Wymagane**: Brak.
  - **Opcjonalne**: `select` (wartość `*` sugeruje pobranie wszystkich pól; implementacja będzie domyślnie zwracać pełny obiekt DTO).
- **Request Body**: Brak.

## 3. Wykorzystywane typy

- **DTO**: `DietDTO` (zdefiniowany w `src/types.ts`) - reprezentuje wiersz z tabeli `diets`.
  ```typescript
  export type DietDTO = DbRow<"diets">;
  ```

## 4. Szczegóły odpowiedzi

- **Kod sukcesu**: `200 OK`
- **Format**: JSON
- **Struktura**: Tablica obiektów `DietDTO`.
  ```json
  [
    {
      "id": "keto",
      "name": "Ketogeniczna",
      "allowed_foods": ["meat", "fats"],
      "forbidden_foods": ["sugar"],
      "macros": { "fat": "high", "carbs": "low" }
    }
    // ...
  ]
  ```
- **Kody błędów**:
  - `500 Internal Server Error`: W przypadku błędu połączenia z bazą danych.

## 5. Przepływ danych

1.  Klient (Frontend) wysyła żądanie `GET /rest/v1/diets`.
2.  Endpoint Astro inicjalizuje `DietService`.
3.  `DietService` wykonuje zapytanie do tabeli `diets` w Supabase.
4.  Supabase zwraca dane (zgodnie z RLS public-read).
5.  Endpoint zwraca dane w formacie JSON do klienta.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Nie wymagane (zasób publiczny).
- **Autoryzacja**: Opiera się na polityce RLS w bazie danych (`Allow read access for all users` dla tabeli `diets`).
- **Ochrona**: Standardowe nagłówki bezpieczeństwa zapewniane przez framework Astro.

## 7. Obsługa błędów

- Błędy po stronie bazy danych (np. timeout, błąd połączenia) będą przechwytywane w bloku `try-catch`.
- Szczegóły błędu będą logowane na konsoli serwera (dla celów debugowania).
- Klient otrzyma ogólny komunikat błędu z kodem `500`.

## 8. Rozważania dotyczące wydajności

- Dane diet są rzadko zmieniane (dane statyczne).
- Zalecane jest ustawienie nagłówka `Cache-Control` (np. `public, max-age=3600`) w odpowiedzi, aby zredukować liczbę zapytań do bazy danych.

## 9. Etapy wdrożenia

### Krok 1: Weryfikacja i Seedowanie Danych

Tabela `diets` istnieje, ale należy upewnić się, że zawiera dane.

- Stworzyć skrypt SQL (`supabase/seed.sql`) lub wykorzystać panel Supabase do zaimportowania danych z pliku `dieta_data/diet.json`.
- Upewnić się, że dane w bazie odpowiadają strukturze wymaganej przez `DietDTO`.

### Krok 2: Implementacja Serwisu (`DietService`)

Utworzyć plik `src/lib/services/diet.service.ts`:

- Zaimplementować klasę/funkcję `DietService`.
- Dodać metodę `getAllDiets()`, która pobiera dane z tabeli `diets` używając klienta Supabase.
- Zapewnić typowanie zwracanych danych jako `DietDTO[]`.

### Krok 3: Implementacja Endpointu Astro

Utworzyć plik endpointu `src/pages/rest/v1/diets.ts`:

- Zdefiniować handler `GET`.
- Wywołać `DietService.getAllDiets()`.
- Dodać obsługę błędów i zwracanie odpowiednich kodów statusu.
- Ustawić nagłówki `Cache-Control`.

### Krok 4: Testowanie

- Ręczne wywołanie endpointu (np. przez przeglądarkę lub curl/Postman).
- Weryfikacja poprawności struktury JSON.
- Weryfikacja nagłówków cache.
