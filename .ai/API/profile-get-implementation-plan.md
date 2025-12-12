# API Endpoint Implementation Plan: GET /api/profile

## 1. Przegląd punktu końcowego
Celem tego punktu końcowego jest pobranie szczegółowych informacji o profilu aktualnie zalogowanego użytkownika. Endpoint agreguje dane z tabeli głównej `profiles` oraz tabel łączących `profile_allergens` i `profile_dislikes`, zwracając spójny obiekt `ProfileDTO` gotowy do użycia na frontendzie.

## 2. Szczegóły żądania
- **Metoda HTTP**: `GET`
- **Ścieżka**: `/api/profile`
- **Struktura URL**: `/api/profile`
- **Parametry**:
  - Wymagane: Nagłówek `Authorization` z tokenem Bearer (obsługiwane przez middleware/Supabase).
  - Opcjonalne: Brak.
- **Request Body**: Brak.

## 3. Wykorzystywane typy
- **`ProfileDTO`** (`src/types.ts`): Główny typ odpowiedzi zawierający spłaszczone tablice `allergens` i `dislikes`.
- **`DbRow<"profiles">`**: Typ bazodanowy wiersza profilu.
- **`DbRow<"profile_allergens">`**: Typ bazodanowy relacji alergenów.
- **`DbRow<"profile_dislikes">`**: Typ bazodanowy relacji nielubianych składników.

## 4. Szczegóły odpowiedzi
- **Kod sukcesu**: `200 OK`
- **Format**: JSON
- **Struktura**:
  ```json
  {
    "id": "uuid",
    "display_name": "Nazwa Użytkownika",
    "diet_id": "diet-id-string",
    "terms_accepted_at": "ISO-8601-Date",
    "created_at": "ISO-8601-Date",
    "allergens": ["allergen-id-1", "allergen-id-2"],
    "dislikes": ["ingredient-id-1"]
  }
  ```

## 5. Przepływ danych
1.  **Middleware/Endpoint**: Weryfikacja sesji użytkownika za pomocą klienta Supabase z `context.locals`.
2.  **Controller (Endpoint)**: Pobranie `user.id` z sesji.
3.  **Service (`ProfileService`)**:
    -   Wywołanie zapytania do Supabase `from('profiles')`.
    -   Dołączenie relacji (`select`) dla `profile_allergens` i `profile_dislikes`.
    -   Filtrowanie po `id` użytkownika.
4.  **Transformation**: Mapowanie surowych danych z bazy (gdzie relacje są tablicami obiektów) na płaskie tablice stringów w `ProfileDTO`.
5.  **Response**: Zwrócenie obiektu JSON.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Wymagany ważny token JWT Supabase.
- **Autoryzacja**: Dostęp tylko do własnego profilu. Gwarantowane przez mechanizm RLS (Row Level Security) w bazie danych oraz filtrowanie po `auth.uid()`.
- **Izolacja danych**: Zapytania do bazy danych muszą używać klienta z kontekstu żądania (`locals.supabase`), aby zachować kontekst użytkownika.

## 7. Obsługa błędów
| Scenariusz | Kod HTTP | Opis |
| :--- | :--- | :--- |
| Brak sesji / Token nieprawidłowy | 401 | Użytkownik nie jest zalogowany. |
| Profil nie istnieje | 404 | Nie znaleziono rekordu w tabeli `profiles` dla danego ID. |
| Błąd bazy danych | 500 | Błąd połączenia lub zapytania do Supabase. |

## 8. Rozważania dotyczące wydajności
- **Single Query**: Pobranie wszystkich danych (profil + relacje) w jednym zapytaniu SQL za pomocą składni `select` z zagnieżdżonymi zasobami, aby uniknąć problemu N+1.
- **Indeksy**: Tabele `profiles`, `profile_allergens`, `profile_dislikes` posiadają indeksy na kluczach głównych i obcych (zgodnie z definicją schema), co zapewnia szybkie wyszukiwanie.

## 9. Etapy wdrożenia

### Krok 1: Utworzenie serwisu profilu
Utwórz plik `src/lib/services/profile.service.ts`. Zaimplementuj klasę/moduł `ProfileService` z metodą `getProfile(userId: string)`.
-   Użyj `supabase` client przekazanego jako argument lub w konstruktorze (zgodnie ze wzorcem dependency injection lub context passing, aby obsłużyć `locals`). Sugerowane podejście: przekazywanie klienta Supabase do metody serwisu.
-   Zaimplementuj zapytanie pobierające profil wraz z relacjami.
-   Zaimplementuj mapowanie wyniku na `ProfileDTO`.

### Krok 2: Implementacja Endpointu API
Utwórz plik `src/pages/api/profile.ts`.
-   Zdefiniuj handler `GET`.
-   Skonfiguruj `prerender = false`.
-   Pobierz instancję `supabase` z `context.locals`.
-   Sprawdź sesję (`auth.getUser()`). Jeśli błąd/brak -> zwróć 401.
-   Wywołaj `ProfileService.getProfile`.
-   Jeśli serwis zwróci `null` (brak profilu) -> zwróć 404.
-   Zwróć 200 z danymi JSON.
-   Obsłuż błędy `try-catch` zwracając 500.

### Krok 3: Weryfikacja typów
Upewnij się, że typy zwracane przez zapytanie Supabase są poprawnie rzutowane na `ProfileDTO`, szczególnie w przypadku zagnieżdżonych tablic z `join table` (np. `profile_allergens` może zostać zwrócone jako `[{ allergen_id: '...' }]`, co trzeba zamienić na `['...']`).

