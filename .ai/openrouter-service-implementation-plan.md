# Plan wdrożenia usługi OpenRouter

## 1. Opis usługi
Usługa `OpenRouterService` zapewnia serwerową integrację z API OpenRouter w celu obsługi czatów opartych na LLM. Działa wyłącznie po stronie backendu (Astro API endpoints), ukrywa klucze API, wspiera streaming odpowiedzi, ustrukturyzowane odpowiedzi (`response_format`) oraz spójne mapowanie błędów na komunikaty przyjazne dla użytkownika. Interfejs usługi jest używany przez endpointy w `src/pages/api` i zwraca dane dla frontendowych komponentów React w `src/components`.

**Kluczowe komponenty usługi (numerowane):**
1. **Konfiguracja i walidacja środowiska** – pobieranie i walidacja `OPENROUTER_API_KEY`, domyślnych parametrów modelu oraz ustawień time-out.
2. **Klient HTTP do OpenRouter** – warstwa wysyłania żądań i obsługi odpowiedzi (w tym streamingu).
3. **Budowa promptu (system/user)** – generowanie poprawnej struktury `messages` zgodnej z API.
4. **Obsługa `response_format` (JSON Schema)** – wymuszanie ustrukturyzowanych odpowiedzi.
5. **Dobór modelu i parametrów** – centralne zarządzanie nazwą modelu i parametrami.
6. **Mapowanie błędów i telemetryka** – spójne logowanie i mapowanie błędów na odpowiedzi API.

## 2. Opis konstruktora
Konstruktor inicjalizuje usługę z wymaganymi zależnościami i ustawieniami. Powinien działać w warstwie serwerowej (np. `src/lib/openrouter/OpenRouterService.ts`) i być używany przez Astro endpointy.

**Wejście konstruktora (przykład):**
- `apiKey` – klucz API z `process.env.OPENROUTER_API_KEY` (wymagany).
- `baseUrl` – domyślnie `https://openrouter.ai/api/v1`.
- `defaultModel` – np. `openrouter/auto` lub konkretny model.
- `defaultParams` – np. `temperature`, `max_tokens`, `top_p`, `frequency_penalty`, `presence_penalty`.
- `timeoutMs` – np. 30000.
- `appId`/`appName` – identyfikator aplikacji do nagłówków (opcjonalnie).

Konstruktor musi walidować brakujące konfiguracje i rzucać błędy inicjalizacji na wczesnym etapie.

## 3. Publiczne metody i pola
### Publiczne metody
1. **`createChatCompletion(input)`**
   - **Funkcja:** wysyła żądanie do OpenRouter i zwraca odpowiedź (synchronizowaną lub streaming).
   - **Wejście:** `messages`, `model`, `params`, opcjonalnie `response_format`, `stream`.
   - **Wyjście:** obiekt odpowiedzi modelu lub strumień danych.

2. **`createStructuredResponse(input)`**
   - **Funkcja:** wymusza ustrukturyzowaną odpowiedź poprzez `response_format`.
   - **Wejście:** `messages`, `schemaName`, `schemaObject`, `model`, `params`.
   - **Wyjście:** obiekt JSON zgodny z zadanym schematem.

3. **`validateConfig()`**
   - **Funkcja:** kontrola konfiguracji przed użyciem (np. brak klucza).
   - **Wyjście:** `void` lub błąd walidacji.

### Publiczne pola
- `defaultModel`
- `defaultParams`
- `baseUrl`

## 4. Prywatne metody i pola
### Prywatne metody
1. **`buildMessages(systemMessage, userMessage, history)`**
   - Składa wiadomości do formatu OpenRouter `messages[]`.

2. **`buildResponseFormat(schemaName, schemaObject)`**
   - Tworzy strukturę `response_format` zgodną z wymaganym wzorem.

3. **`resolveModel(modelOverride)`**
   - Wybiera model z override lub wartość domyślną.

4. **`resolveParams(paramsOverride)`**
   - Scala parametry domyślne z nadpisaniami.

5. **`handleOpenRouterError(error)`**
   - Mapuje błędy HTTP/Network/Validation na spójne błędy aplikacyjne.

### Prywatne pola
- `apiKey`
- `timeoutMs`
- `logger` (opcjonalnie)

## 5. Obsługa błędów
**Potencjalne scenariusze błędów (numerowane):**
1. Brak lub nieprawidłowy `OPENROUTER_API_KEY`.
2. Błąd sieci / timeout połączenia.
3. Błąd autoryzacji (401/403).
4. Nieprawidłowe dane wejściowe (`messages`, `response_format`, parametry).
5. Limit tokenów lub ograniczenia modelu (400/429).
6. Nieobsługiwany model / brak uprawnień do modelu.
7. Niepoprawny JSON w odpowiedzi przy `response_format`.
8. Błędy streamingu (zerwany strumień, niepełne dane).

**Sposób obsługi:**
- Każdy błąd mapowany do jednolitego kształtu odpowiedzi API (np. `{ errorCode, message, details }`).
- Błędy sieci i timeouty – retry na poziomie endpointu (np. 1-2 próby z backoff).
- Błędy walidacji – zwrot `400` i jasny komunikat do klienta.
- Błędy autoryzacji – zwrot `401/403`.
- Błędy limitów – zwrot `429` z informacją o limicie.

## 6. Kwestie bezpieczeństwa
- Klucz API nigdy nie trafia do frontendu; tylko serwerowe wywołania w `src/pages/api`.
- Przechowywanie klucza w zmiennych środowiskowych (`.env`), bez logowania klucza.
- Walidacja danych wejściowych (system/user messages, schema).
- Ograniczenie max tokenów i limitów kosztów przez `defaultParams`.
- Ochrona przed prompt injection: separacja komunikatów systemowych i userowych.
- Logowanie błędów bez danych wrażliwych.

## 7. Plan wdrożenia krok po kroku
1. **Utwórz warstwę usługi**
   - Lokalizacja: `src/lib/openrouter/OpenRouterService.ts`.
   - Zdefiniuj konstruktor z walidacją konfiguracji.

2. **Zdefiniuj typy DTO i struktury wejść/wyjść**
   - Lokalizacja: `src/types.ts` lub osobny moduł w `src/lib`.
   - Uwzględnij struktury: `Message`, `ChatCompletionInput`, `StructuredResponseInput`.

3. **Zaimplementuj składanie wiadomości (system/user)**
   - **Metody włączenia:**
     1. `systemMessage` jako pierwsza wiadomość w `messages`.
     2. `userMessage` jako kolejna wiadomość typu `user`.
   - **Przykład:**
     1. Komunikat systemowy:
        - `"Jesteś pomocnym asystentem do planowania posiłków."`
     2. Komunikat użytkownika:
        - `"Stwórz listę zakupów na 3 dni dla diety wegetariańskiej."`

4. **Dodaj obsługę `response_format` (JSON Schema)**
   - **Wymagany wzór:**
     - `{ type: 'json_schema', json_schema: { name: [schema-name], strict: true, schema: [schema-obj] } }`
   - **Przykład:**
     1. `schema-name`: `"shopping_list"`
     2. `schema-obj`:
        - `{ type: 'object', properties: { items: { type: 'array', items: { type: 'string' } } }, required: ['items'] }`
     3. `response_format`:
        - `{ type: 'json_schema', json_schema: { name: 'shopping_list', strict: true, schema: { type: 'object', properties: { items: { type: 'array', items: { type: 'string' } } }, required: ['items'] } } }`

5. **Dobierz model i parametry**
   - **Metody włączenia:**
     1. Model domyślny w konstruktorze.
     2. Model nadpisywany per żądanie.
   - **Przykłady:**
     1. Nazwa modelu: `"openrouter/auto"` lub `"anthropic/claude-3.5-sonnet"`.
     2. Parametry modelu:
        - `temperature: 0.2`
        - `max_tokens: 800`
        - `top_p: 0.9`

6. **Zaimplementuj klienta HTTP**
   - Użyj `fetch` w środowisku Astro (server-side).
   - Dodaj obsługę time-out (np. `AbortController`).
   - Obsłuż zarówno tryb standardowy, jak i `stream: true`.

7. **Dodaj obsługę błędów i mapowanie odpowiedzi**
   - Centralna metoda mapująca błędy HTTP/Network na własne błędy domenowe.
   - Logowanie techniczne na serwerze i przyjazny komunikat dla klienta.

8. **Podłącz usługę do endpointów**
   - Dodaj endpointy w `src/pages/api` (np. `chat.ts`).
   - Endpoint wywołuje `OpenRouterService` i zwraca wynik klientowi.
