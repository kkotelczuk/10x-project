# API Endpoint Implementation Plan: Upsert Profile

## 1. Przegląd punktu końcowego

Punkt końcowy `PUT /api/profile` służy do atomowej aktualizacji lub tworzenia profilu użytkownika. Obsługuje zarówno proces onboardingu (pierwsze ustawienie preferencji i akceptacja regulaminu), jak i późniejszą edycję profilu (zmiana diety, alergenów, nielubianych składników). Operacja jest kompleksowa i obejmuje aktualizację tabeli głównej `profiles` oraz zarządzanie relacjami w tabelach `profile_allergens` i `profile_dislikes`.

## 2. Szczegóły żądania

- **Metoda HTTP**: `PUT`
- **Struktura URL**: `/api/profile`
- **Uwierzytelnianie**: Bearer Token (wymagane, weryfikowane przez middleware/locals)
- **Parametry**: Brak parametrów ścieżki (ID użytkownika pobierane z kontekstu autoryzacji).
- **Request Body** (JSON):
  ```json
  {
    "diet_id": "keto", // string | null (opcjonalne)
    "allergen_ids": ["peanuts"], // string[] (wymagane, może być puste)
    "dislike_ids": ["onions"], // string[] (wymagane, może być puste)
    "display_name": "Jan", // string (opcjonalne)
    "accept_terms": true // boolean (wymagane przy tworzeniu)
  }
  ```

## 3. Wykorzystywane typy

- **DTOs**: `ProfileDTO` (zdefiniowane w `src/types.ts`) - zwracane w odpowiedzi.
- **Command Model**: `UpsertProfileCommand` (zdefiniowane w `src/types.ts`) - używane do typowania payloadu żądania.
- **Zod Schema**: Należy stworzyć schemat walidacji odpowiadający `UpsertProfileCommand`.

## 4. Szczegóły odpowiedzi

- **Sukces (200 OK)**:
  - Zwraca obiekt `ProfileDTO` reprezentujący zaktualizowany stan profilu.
  - Struktura:
    ```json
    {
      "id": "uuid",
      "display_name": "Jan",
      "diet_id": "keto",
      "terms_accepted_at": "timestamp",
      "created_at": "timestamp",
      "allergens": ["peanuts"],
      "dislikes": ["onions"]
    }
    ```
- **Błędy**:
  - `400 Bad Request`: Błąd walidacji danych wejściowych (np. brak `accept_terms` przy nowym profilu, niepoprawne ID).
  - `401 Unauthorized`: Użytkownik nie jest zalogowany.
  - `500 Internal Server Error`: Błąd podczas zapisu do bazy danych.

## 5. Przepływ danych

1.  **Request**: Klient wysyła żądanie `PUT` z danymi profilu.
2.  **Middleware**: Astro Middleware weryfikuje token sesji i ustawia `locals.user`.
3.  **Endpoint**:
    - Sprawdza obecność `locals.user`.
    - Waliduje ciało żądania za pomocą Zod.
    - Wywołuje `ProfileService.upsertProfile`.
4.  **Service (`ProfileService`)**:
    - Pobiera aktualny profil (aby sprawdzić status `terms_accepted_at`).
    - Waliduje regułę `accept_terms` dla nowych profili.
    - Wykonuje operacje na bazie danych (Supabase):
      a. `upsert` na tabeli `profiles`.
      b. Usunięcie starych relacji z `profile_allergens` i `profile_dislikes`.
      c. Wstawienie nowych relacji do `profile_allergens` i `profile_dislikes`.
    - Pobiera i składa pełny obiekt `ProfileDTO`.
5.  **Response**: Endpoint zwraca JSON z `ProfileDTO`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Tylko zalogowani użytkownicy mogą modyfikować profil.
- **Autoryzacja**: Użytkownik może modyfikować tylko własny profil (gwarantowane przez pobranie ID z sesji i RLS).
- **Walidacja**: Ścisła walidacja typów i wartości (np. czy `diet_id` istnieje w słowniku - opcjonalnie, lub poleganie na FK constraint bazy).
- **RLS**: Row Level Security w bazie danych powinno blokować próby modyfikacji cudzych danych, nawet w przypadku błędu w kodzie aplikacji.

## 7. Obsługa błędów

- Błędy walidacji Zod -> zwrócenie 400 z listą błędów.
- Próba utworzenia profilu bez akceptacji regulaminu -> zwrócenie 400 z komunikatem "Terms acceptance required".
- Błędy bazy danych (np. naruszenie klucza obcego) -> logowanie błędu i zwrócenie 500 (lub 400 jeśli to błąd danych).

## 8. Kroki implementacji

1.  **Utworzenie Serwisu (`src/lib/services/profile.service.ts`)**:
    - Zaimplementowanie klasy/modułu `ProfileService`.
    - Dodanie metody `upsertProfile` przyjmującej `SupabaseClient`, `userId` i `UpsertProfileCommand`.
    - Implementacja logiki aktualizacji profilu i relacji (usuwanie starych -> dodawanie nowych).
    - Implementacja metody pomocniczej do pobrania pełnego profilu (`getProfile`).

2.  **Utworzenie Endpointu (`src/pages/api/profile.ts`)**:
    - Utworzenie pliku endpointu.
    - Zdefiniowanie schematu Zod dla `UpsertProfileCommand`.
    - Implementacja handlera `PUT`.
    - Integracja z `ProfileService`.

3.  **Weryfikacja typów**:
    - Upewnienie się, że `types.ts` jest poprawnie importowany i używany.

4.  **Testy manualne**:
    - Wysłanie żądania bez tokenu (401).
    - Wysłanie niepoprawnych danych (400).
    - Utworzenie nowego profilu (sukces).
    - Aktualizacja istniejącego profilu (sukces).
