# API Endpoint Implementation Plan: Get Allergens

## 1. Przegląd punktu końcowego
Celem tego punktu końcowego jest udostępnienie listy alergenów zdefiniowanych w systemie. Dane te są wykorzystywane w interfejsie użytkownika (np. w formularzach profilu) do wyboru alergenów, które użytkownik chce wykluczyć ze swojej diety. Jest to zasób typu "read-only" dla klienta API.

## 2. Szczegóły żądania
- **Metoda HTTP**: `GET`
- **Struktura URL**: `/rest/v1/allergens`
- **Parametry**:
  - Wymagane: Brak
  - Opcjonalne: Brak
- **Request Body**: Brak

## 3. Wykorzystywane typy
- **AllergenDTO**: Zdefiniowany w `src/types.ts`. Reprezentuje wiersz z tabeli `allergens`.
  ```typescript
  export type AllergenDTO = DbRow<"allergens">;
  ```

## 4. Szczegóły odpowiedzi
- **Nagłówki**:
  - `Content-Type: application/json`
  - `Cache-Control: public, max-age=3600` (dane referencyjne rzadko się zmieniają)
- **Kody statusu**:
  - `200 OK`: Pomyślne pobranie danych. Ciało odpowiedzi zawiera tablicę obiektów `AllergenDTO`.
  - `500 Internal Server Error`: Wystąpił nieoczekiwany błąd po stronie serwera.

**Przykładowa odpowiedź (200 OK):**
```json
[
  {
    "id": "peanuts",
    "name": "Orzeszki ziemne"
  },
  {
    "id": "dairy",
    "name": "Nabiał"
  }
]
```

## 5. Przepływ danych
1.  Klient wysyła żądanie `GET /rest/v1/allergens`.
2.  Astro Middleware inicjalizuje klienta Supabase i umieszcza go w `context.locals`.
3.  Endpoint API (`src/pages/rest/v1/allergens.ts`) odbiera żądanie.
4.  Endpoint inicjalizuje `AllergenService`, przekazując klienta Supabase.
5.  `AllergenService` wykonuje zapytanie `select('*')` do tabeli `allergens` w bazie danych Supabase.
6.  Baza danych zwraca wyniki (przefiltrowane przez RLS, jeśli dotyczy, choć alergeny są zazwyczaj publiczne).
7.  Serwis zwraca tablicę `AllergenDTO` do endpointu.
8.  Endpoint zwraca odpowiedź JSON do klienta.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Endpoint korzysta z klienta Supabase zainicjalizowanego w middleware, który obsługuje sesję użytkownika.
- **Autoryzacja (RLS)**: Dostęp do danych jest kontrolowany przez polityki Row Level Security (RLS) na poziomie bazy danych. Zakładamy, że tabela `allergens` jest dostępna do odczytu dla wszystkich uwierzytelnionych użytkowników (lub publicznie, zależnie od konfiguracji RLS).
- **Walidacja**: Brak danych wejściowych wymagających sanityzacji.

## 7. Obsługa błędów
- **Błędy bazy danych**: Jeśli zapytanie do Supabase zwróci błąd (`error` nie jest null), serwis rzuci wyjątek lub zwróci pustą tablicę (preferowane rzucenie wyjątku dla jasności błędu 500).
- **Wyjątki serwera**: Blok `try/catch` w handlerze endpointu przechwyci wszelkie nieobsłużone wyjątki.
- **Odpowiedź błędu**: W przypadku błędu, API zwróci status `500` z ogólnym komunikatem JSON: `{"error": "Internal Server Error"}` oraz zaloguje szczegóły błędu w konsoli serwera.

## 8. Rozważania dotyczące wydajności
- **Caching**: Ze względu na statyczny charakter danych (alergeny rzadko się zmieniają), odpowiedź powinna zawierać nagłówek `Cache-Control: public, max-age=3600` (1 godzina) lub dłuższy, aby zredukować obciążenie bazy danych i przyspieszyć działanie klienta.
- **Selekcja danych**: Pobierane są tylko wymagane kolumny (wszystkie kolumny tabeli `allergens` są potrzebne i jest ich mało).

## 9. Etapy wdrożenia

1.  **Utworzenie serwisu `AllergenService`**
    - Plik: `src/lib/services/allergen.service.ts`
    - Klasa: `AllergenService`
    - Metody: `getAllAllergens(): Promise<AllergenDTO[]>`
    - Logika: Pobranie danych z tabeli `allergens` przy użyciu wstrzykniętego klienta Supabase.

2.  **Utworzenie punktu końcowego API**
    - Plik: `src/pages/rest/v1/allergens.ts`
    - Konfiguracja: `export const prerender = false;`
    - Handler: `export const GET: APIRoute`
    - Logika: Użycie `AllergenService` do pobrania danych i zwrócenie odpowiedzi JSON. Dodanie nagłówków Cache-Control. Obsługa błędów `try/catch`.

3.  **Weryfikacja**
    - Uruchomienie serwera deweloperskiego.
    - Wysłanie żądania GET pod adres `/rest/v1/allergens`.
    - Sprawdzenie poprawności struktury JSON i nagłówków.

