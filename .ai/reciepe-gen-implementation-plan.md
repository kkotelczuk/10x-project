# API Endpoint Implementation Plan: Generate Recipe

## 1. Przegląd punktu końcowego
Punkt końcowy `POST /api/generate` umożliwia użytkownikom generowanie lub modyfikowanie przepisów kulinarnych przy użyciu sztucznej inteligencji. Proces uwzględnia preferencje żywieniowe użytkownika (dietę, alergeny, nielubiane składniki) oraz zarządza limitami użycia (quota system), aby kontrolować koszty i zapobiegać nadużyciom.

## 2. Szczegóły żądania
- **Metoda HTTP**: `POST`
- **Struktura URL**: `/api/generate`
- **Uwierzytelnianie**: Bearer Token (Session Cookie obsługiwane przez Astro/Supabase)
- **Nagłówki**:
  - `Content-Type`: `application/json`
- **Request Body**:
  Wymagane jest przesłanie obiektu JSON zgodnego z interfejsem `GenerateRecipeCommand`:
  ```json
  {
    "original_text": "Tekst źródłowy przepisu lub nazwa potrawy do wygenerowania (max 1000 znaków)."
  }
  ```

## 3. Wykorzystywane typy
Plik: `src/types.ts`

- **Input**: `GenerateRecipeCommand`
- **Output**: `GenerateRecipeResponse`
- **Helpers**: `RecipeIngredientJson`, `RecipeInstructionJson`
- **Database**: `DbInsert<"recipes">`, `DbInsert<"generation_logs">`

## 4. Szczegóły odpowiedzi

### Sukces (201 Created)
Zwraca wygenerowany przepis oraz aktualny stan limitów.
```json
{
  "recipe": {
    "id": "uuid-v4",
    "title": "Nazwa Przepisu",
    "ingredients": [
      { "item": "Składnik", "amount": 100, "unit": "g" }
    ],
    "instructions": [
      { "step": 1, "text": "Instrukcja..." }
    ]
  },
  "usage": {
    "remaining": 2,
    "limit": 3
  }
}
```

### Błędy
- **400 Bad Request**: Nieprawidłowe dane wejściowe (np. brak tekstu, tekst zbyt długi).
- **401 Unauthorized**: Użytkownik nie jest zalogowany.
- **422 Unprocessable Entity**: Tekst wejściowy nie nadaje się do przetworzenia na przepis.
- **429 Too Many Requests**: Przekroczono dzienny limit generowania (3/24h).
- **500 Internal Server Error**: Błąd serwera, bazy danych lub dostawcy AI.

## 5. Przepływ danych

1. **Klient** wysyła żądanie `POST /api/generate` z tekstem przepisu.
2. **Endpoint (Astro)**:
   - Weryfikuje sesję użytkownika (`context.locals.user`).
   - Waliduje dane wejściowe (Zod).
3. **RecipeService**:
   - Sprawdza w tabeli `generation_logs`, ile razy użytkownik generował przepis w ciągu ostatnich 24h.
   - Jeśli limit przekroczony -> rzuca błąd (429).
4. **ProfileService** (lub zapytanie bezpośrednie):
   - Pobiera dane profilu: `diet_id` (nazwa diety), `allergens`, `dislikes`.
5. **AIService**:
   - Konstruuje prompt systemowy uwzględniający profil użytkownika i format JSON.
   - Wysyła zapytanie do OpenRouter API.
   - Parsuje i waliduje odpowiedź JSON od AI.
6. **RecipeService**:
   - Zapisuje nowy przepis w tabeli `recipes`.
   - Zapisuje wpis w `generation_logs` (`success: true`).
7. **Endpoint**:
   - Zwraca odpowiedź 201 z danymi przepisu i informacją o limitach.
8. **Obsługa błędów**:
   - W przypadku błędu na etapie 5 lub 6, zapisuje wpis w `generation_logs` (`success: false`, `error_message`).

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Ścisła weryfikacja `user_id` po stronie serwera.
- **Prompt Injection**: Oddzielenie instrukcji systemowych od danych użytkownika w zapytaniu do LLM.
- **API Keys**: Klucz OpenRouter przechowywany w zmiennych środowiskowych (`OPENROUTER_API_KEY`), niedostępny dla klienta.
- **Sanityzacja**: Walidacja formatu wyjściowego JSON z AI przed zapisem do bazy (zapobieganie XSS w stored JSON).

## 7. Obsługa błędów
- Błędy walidacji Zod -> `400` z czytelnym komunikatem.
- Błąd limitu -> `429` z komunikatem "Dzienny limit wykorzystany".
- Błąd parsowania JSON z AI -> Retry (wewnętrzny) lub `422`.
- Każdy błąd (poza 401/400 przed logiką biznesową) musi zostać odnotowany w `generation_logs` w celach audytowych i diagnostycznych.

## 8. Rozważania dotyczące wydajności
- **Timeout**: Ustawienie timeoutu dla zapytania do OpenRouter (np. 30-60 sekund), aby uniknąć wiszących żądań.
- **Baza danych**: Indeksy na `user_id` i `created_at` w tabeli `generation_logs` są kluczowe dla szybkiego sprawdzania limitów.
- **Payload**: Odpowiedź zawiera tylko niezbędne dane, unikanie przesyłania zbędnych metadanych.

## 9. Etapy wdrożenia

### Krok 1: Przygotowanie Serwisów
1. Utwórz/Zaktualizuj `src/lib/services/recipe.service.ts`:
   - Metoda `checkDailyLimit(userId: string): Promise<void>` (rzuca błąd jeśli limit przekroczony).
   - Metoda `logGenerationAttempt(userId: string, success: boolean, error?: string): Promise<void>`.
   - Metoda `createGeneratedRecipe(userId: string, data: RecipeData): Promise<RecipeDetailsDTO>`.
2. Utwórz `src/lib/services/ai.service.ts`:
   - Metoda `generateRecipe(originalText: string, profile: ProfileData): Promise<GeneratedRecipeData>`.
   - Implementacja klienta OpenRouter i promptu.

### Krok 2: Implementacja Endpointu
1. Utwórz plik `src/pages/api/generate.ts`.
2. Zaimplementuj handler `POST`.
3. Dodaj walidację Zod dla body (`GenerateRecipeCommand`).
4. Połącz logikę: Auth -> Check Limit -> Fetch Profile -> AI Generate -> Save -> Log -> Response.

### Krok 3: Walidacja i Testy
1. Przetestuj scenariusz sukcesu (poprawny JSON).
2. Przetestuj przekroczenie limitu (4. próba).
3. Przetestuj błędne dane wejściowe (pusty tekst).
4. Przetestuj błąd API AI (symulacja).

