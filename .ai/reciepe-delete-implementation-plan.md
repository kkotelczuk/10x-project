# API Endpoint Implementation Plan: Delete Recipe

## 1. Przegląd punktu końcowego
Wdrożenie endpointu REST API umożliwiającego trwałe usunięcie przepisu należącego do zalogowanego użytkownika. Endpoint będzie obsługiwał specyficzny format parametru zapytania `id=eq.{uuid}`, zgodny ze specyfikacją przypominającą PostgREST, zapewniając kompatybilność z klientem.

## 2. Szczegóły żądania
- **Metoda HTTP**: `DELETE`
- **Struktura URL**: `/rest/v1/recipes`
- **Parametry**:
  - **Wymagane**: `id` (Query Parameter) - w formacie `eq.{uuid}` (np. `eq.550e8400-e29b-41d4-a716-446655440000`).
  - **Opcjonalne**: Brak.
- **Request Body**: Brak.

## 3. Wykorzystywane typy
- `SupabaseClient` (z `@/db/supabase.client`) - do interakcji z bazą danych.
- Standardowe typy odpowiedzi API (interfejsy błędów).

## 3. Szczegóły odpowiedzi
- **200 OK**: Sukces. Ciało odpowiedzi może być puste lub zawierać potwierdzenie (np. `{ success: true }`).
- **400 Bad Request**: Nieprawidłowy format parametru `id` (brak prefiksu `eq.` lub niepoprawny UUID).
- **401 Unauthorized**: Użytkownik nie jest zalogowany.
- **404 Not Found**: Przepis o podanym ID nie istnieje lub nie należy do użytkownika.
- **500 Internal Server Error**: Nieoczekiwany błąd serwera.

## 4. Przepływ danych
1. **Żądanie**: Klient wysyła żądanie `DELETE /rest/v1/recipes?id=eq.{uuid}`.
2. **Middleware/Endpoint**:
   - Weryfikacja sesji użytkownika (`locals.supabase`).
   - Ekstrakcja i walidacja parametru `id` (usunięcie prefiksu `eq.`).
3. **Service Layer**:
   - Wywołanie `RecipeService.deleteRecipe(id)`.
4. **Database (Supabase)**:
   - Wykonanie zapytania `DELETE FROM recipes WHERE id = $id`.
   - RLS automatycznie zapewnia, że użytkownik usuwa tylko swój rekord.
5. **Weryfikacja**:
   - Sprawdzenie liczby usuniętych wierszy. Jeśli 0 -> błąd 404 (lub 403, ale z perspektywy bezpieczeństwa 404 jest bezpieczniejsze).
6. **Odpowiedź**: Zwrócenie odpowiedniego kodu statusu do klienta.

## 5. Względy bezpieczeństwa
- **Uwierzytelnianie**: Wymagane zalogowanie użytkownika. Endpoint musi sprawdzać `await locals.supabase.auth.getUser()`.
- **Autoryzacja (RLS)**: Poleganie na Row Level Security w bazie danych Postgres/Supabase. Tabela `recipes` powinna mieć politykę pozwalającą na `DELETE` tylko dla właściciela rekordu (`auth.uid() = user_id`).
- **Walidacja danych**: Ścisła walidacja formatu UUID zapobiega atakom typu injection i błędom bazy danych.

## 6. Obsługa błędów
| Scenariusz | Kod HTTP | Komunikat |
|:--- |:--- |:--- |
| Brak parametru `id` | 400 | `Missing id parameter` |
| Zły format `id` (brak `eq.` lub zły UUID) | 400 | `Invalid id format` |
| Brak autoryzacji | 401 | `Unauthorized` |
| Rekord nie znaleziony / brak uprawnień | 404 | `Recipe not found` |
| Błąd bazy danych | 500 | `Internal Server Error` |

## 7. Rozważania dotyczące wydajności
- Operacja usuwania jest operacją atomową po kluczu głównym (indeksowanym), co zapewnia wysoką wydajność.
- Brak konieczności stosowania cache dla operacji DELETE.

## 8. Etapy wdrożenia

### Krok 1: Utworzenie `RecipeService`
Utwórz plik `src/lib/services/recipe.service.ts`.
- Zaimplementuj klasę `RecipeService` przyjmującą `SupabaseClient` w konstruktorze.
- Dodaj metodę `deleteRecipe(id: string): Promise<boolean>`.
- Metoda powinna zwracać `true` jeśli usunięto rekord, `false` jeśli nie znaleziono rekordu (0 rows affected).

### Krok 2: Utworzenie Endpointu API
Utwórz plik `src/pages/rest/v1/recipes.ts`.
- Skonfiguruj `prerender = false`.
- Zaimplementuj handler `export const DELETE: APIRoute`.

### Krok 3: Implementacja Logiki Handlera
Wewnątrz `src/pages/rest/v1/recipes.ts`:
1. Pobierz `locals.supabase`.
2. Sprawdź sesję użytkownika.
3. Pobierz parametr `id` z `url.searchParams`.
4. Zwaliduj format `eq.{uuid}` i wyciągnij czysty UUID.
5. Zainicjuj `RecipeService`.
6. Wywołaj `deleteRecipe`.
7. Zwróć odpowiedni `Response`.

### Krok 4: Testowanie
- Sprawdź usuwanie istniejącego przepisu (200 OK).
- Sprawdź usuwanie nieistniejącego przepisu (404 Not Found).
- Sprawdź błędny format ID (400 Bad Request).
- Sprawdź brak autoryzacji (401 Unauthorized).

