## Plan implementacji widoku Recipe Generation (recipe-gen)

## 1. Przegląd

Widok **Recipe Generation** odpowiada za rozpoczęcie procesu modyfikacji/generowania przepisu przez AI na podstawie tekstu wejściowego użytkownika. Widok realizuje wymagania Core z PRD (limit 1000 znaków, walidacja, feedback, limit dzienny 3/24h) i kończy się **utworzeniem rekordu przepisu w bazie** oraz **przekierowaniem do widoku szczegółów nowego przepisu**.

Kluczowe założenia UX:

- **Mobile First** (czytelny formularz, duże CTA, brak “cienkich” interakcji).
- **Feedback zamiast spinnera**: ekran oczekiwania z licznikiem (countdown) + ciekawostką + skeleton (maskowanie opóźnień).
- **Transparentność limitu**: obsługa statusu 429 i komunikatu o wyczerpaniu limitu + blokada dalszych prób w bieżącej sesji.
- **Persystencja tekstu**: wpisany tekst nie ginie po zamknięciu/odświeżeniu (sessionStorage).

## 2. Routing widoku

- **Ścieżka:** `/generate`
- **Plik Astro:** `src/pages/generate.astro`
- **Dostęp:** tylko dla zalogowanych użytkowników (docelowo przez middleware + redirect do `/login` na 401).
- **Nawigacja (docelowo):**
  - Desktop: przycisk „Generuj” w topbar.
  - Mobile: FAB „Generuj”.

Uwaga spójności routingu:

- W dokumentacji UI/PRD ścieżka szczegółów przepisu to **`/recipe/[id]`**. W innych planach/komentarzach może pojawić się wariant `/recipes/[id]` — przed implementacją warto ujednolicić i konsekwentnie używać **`/recipe/[id]`**.

## 3. Struktura komponentów

```text
src/pages/generate.astro (Server Component)
└── Layout.astro
    └── RecipeGenView.tsx (Client Island - client:load)
        ├── CreditCounter.tsx
        ├── GenerateForm.tsx
        │   ├── Textarea + char counter
        │   ├── Disclaimer (medyczny/edukacyjny)
        │   └── Primary CTA (Modyfikuj)
        ├── ConfirmConsumeCreditsDialog.tsx (Modal)
        ├── GenerationWaitingScreen.tsx (Countdown + ciekawostki + skeleton)
        └── ErrorBanner / Toast (sonner)
```

## 4. Szczegóły komponentów

### `GeneratePage` (Astro) — `src/pages/generate.astro`

- **Opis:** Serwerowy kontener routingu. Renderuje layout i wyspę React z widokiem generowania.
- **Główne elementy:** `Layout`, `RecipeGenView` (`client:load`).
- **Obsługiwane zdarzenia:** brak (tylko kompozycja).
- **Walidacja:** brak.
- **Typy:** brak propsów.

### `RecipeGenView` (React) — `src/components/recipe-gen/RecipeGenView.tsx` (nowy)

- **Opis:** Orkiestruje całą ścieżkę generowania: stan formularza, modal potwierdzenia, wywołanie API, ekran oczekiwania, obsługę błędów i redirect po sukcesie.
- **Główne elementy:**
  - Sekcja nagłówka: tytuł strony („Modyfikuj przepis”) + `CreditCounter`.
  - Sekcja treści: `GenerateForm`.
  - Warunkowo: `ConfirmConsumeCreditsDialog`, `GenerationWaitingScreen`.
- **Obsługiwane zdarzenia:**
  - `onChangeText(value)` (z `GenerateForm`) → aktualizacja stanu + persystencja.
  - `onSubmit()` (z `GenerateForm`) → otwarcie modala potwierdzenia.
  - `onConfirmGenerate()` (z modala) → start żądania do `/api/generate`.
  - `onCancelGenerate()` → zamknięcie modala, brak requestu.
  - `onRetry()` → ponowienie (z zachowaniem tekstu).
- **Walidacja (UI):**
  - `original_text.trim().length > 0` (inaczej CTA disabled).
  - `original_text.length <= 1000` (enforced przez `maxLength` + licznik, ale i tak dodatkowy guard).
  - Blokada generowania gdy stan `limitReached === true` (np. po 429).
- **Typy (DTO i ViewModel):**
  - DTO: `GenerateRecipeCommand`, `GenerateRecipeResponse` (z `src/types.ts`).
  - VM: `RecipeGenViewState`, `UsageVM`, `GenerateErrorVM` (opis w sekcji 5).
- **Props:** brak (widok routowany).

### `CreditCounter` (React) — `src/components/recipe-gen/CreditCounter.tsx` (nowy)

- **Opis:** Wskaźnik limitu w formacie `remaining/limit` (np. `2/3`). W tym etapie może pokazywać stan „nieznany” do czasu pozyskania usage.
- **Główne elementy:** `div` + `Badge`/`Card` z shadcn/ui.
- **Obsługiwane zdarzenia:** brak.
- **Walidacja:**
  - Jeśli `usage === null` → pokaz „—/3” lub skeleton.
  - Jeśli `usage.remaining === 0` → styl “disabled/locked”.
- **Typy:**
  - `usage: UsageVM | null`
  - `isLoading?: boolean`
- **Props:**
  - `usage: UsageVM | null`
  - `isLoading?: boolean`

### `GenerateForm` (React) — `src/components/recipe-gen/GenerateForm.tsx` (nowy, może bazować na `GenerateRecipeForm.tsx`)

- **Opis:** Formularz do wklejenia tekstu przepisu (do 1000 znaków), z licznikiem znaków oraz głównym CTA „Modyfikuj”.
- **Główne elementy (HTML/UI):**
  - `label` + `textarea` (`maxLength={1000}`) + licznik `x/1000`.
  - `Alert`/`small` z disclaimerem: „Aplikacja ma charakter edukacyjny…”.
  - `Button` (Primary).
- **Obsługiwane zdarzenia:**
  - `onChange` textarea → `onTextChange(value)`.
  - `onSubmit` form → `onSubmit()`.
- **Walidacja (szczegółowa, zgodna z API):**
  - `original_text`:
    - `min` (UI): co najmniej 1 znak po trim (API: `min(3)` — UX: pokaż walidację „minimum 3 znaki” zanim otworzysz modal).
    - `max`: 1000 znaków (twardy limit).
  - Przycisk disabled, gdy:
    - `isSubmitting === true` lub `isWaiting === true`
    - `limitReached === true`
    - `original_text.trim().length < 3`
- **Typy:**
  - VM: `GenerateFormVM` (opis w sekcji 5).
- **Props:**
  - `value: string`
  - `onTextChange: (value: string) => void`
  - `onSubmit: () => void`
  - `isDisabled: boolean`
  - `isBusy: boolean`
  - `limitReached: boolean`
  - `validationMessage?: string | null` (np. “Wklej co najmniej 3 znaki”)

### `ConfirmConsumeCreditsDialog` (React) — `src/components/recipe-gen/ConfirmConsumeCreditsDialog.tsx` (nowy)

- **Opis:** Modal potwierdzający rozpoczęcie generowania i zużycie kredytu (zgodnie z opisem UX).
- **Główne elementy:** `AlertDialog` (shadcn/ui), przyciski „Anuluj” i „Potwierdź”.
- **Obsługiwane zdarzenia:**
  - `onOpenChange(open)` (kontrola modala).
  - `onConfirm()` → start generowania.
  - `onCancel()` → zamknięcie.
- **Walidacja:**
  - Modal nie powinien się otworzyć, jeśli formularz jest niepoprawny (`trim < 3` lub `>1000`).
  - Jeśli `limitReached` → modal nie powinien się otworzyć (zamiast tego komunikat).
- **Typy:**
  - `usage: UsageVM | null` (do treści typu: „Zużyjesz 1 z 3” + opcjonalnie „Pozostanie: X/3”).
- **Props:**
  - `open: boolean`
  - `onOpenChange: (open: boolean) => void`
  - `onConfirm: () => void`
  - `onCancel: () => void`
  - `usage: UsageVM | null`

### `GenerationWaitingScreen` (React) — `src/components/recipe-gen/GenerationWaitingScreen.tsx` (nowy)

- **Opis:** Ekran oczekiwania w trakcie requestu do `/api/generate`. Wyświetla countdown + ciekawostkę + skeleton układu docelowego przepisu.
- **Główne elementy:**
  - `Progress` lub licznik sekund (np. start 30s).
  - `Card` z ciekawostką (rotowane co N sekund).
  - `SkeletonLoader` (sekcja tytułu/ingredientów/instrukcji).
- **Obsługiwane zdarzenia:** brak (tylko wewnętrzny timer).
- **Walidacja:** brak.
- **Typy:**
  - `secondsLeft: number`
  - `fact: string`
- **Props:**
  - `initialSeconds?: number` (np. 30)
  - `facts?: string[]`

### `ErrorBanner` / Toast (React) — `src/components/recipe-gen/ErrorBanner.tsx` (opcjonalny nowy)

- **Opis:** Prezentuje błędy walidacji i błędy systemowe (sieć, 502, 500). Dla UX preferuj toast (sonner) + inline banner dla błędów formularza.
- **Walidacja:** brak.
- **Props (opcjonalnie):**
  - `error: GenerateErrorVM`
  - `onRetry?: () => void`

## 5. Typy

Widok używa istniejących typów z `src/types.ts` oraz wprowadza lekkie ViewModel-e (lokalne w katalogu widoku, np. `src/components/recipe-gen/types.ts`).

### 5.1. Wykorzystywane DTO (istniejące)

- **`GenerateRecipeCommand`**:
  - `original_text: string`
- **`GenerateRecipeResponse`**:
  - `recipe.id: string`
  - `recipe.title: string`
  - `recipe.ingredients: RecipeIngredientJson[]`
  - `recipe.instructions: RecipeInstructionJson[]`
  - `usage.remaining: number`
  - `usage.limit: number`

### 5.2. Nowe ViewModel-e (proponowane)

```ts
export interface UsageVM {
  remaining: number;
  limit: number; // stałe 3, ale trzymamy jawnie z API
}

export type RecipeGenStep = "editing" | "confirm" | "waiting" | "error";

export interface GenerateFormVM {
  originalText: string;
  charCount: number; // originalText.length
  isValid: boolean; // trim >= 3 && length <= 1000
  validationMessage: string | null;
}

export interface GenerateErrorVM {
  kind: "unauthorized" | "limit" | "validation" | "ai_provider" | "server" | "network" | "unknown";
  message: string;
  details?: unknown; // np. zod format z API dla 400
  status?: number;
  retryable: boolean;
}

export interface RecipeGenViewState {
  step: RecipeGenStep;
  form: GenerateFormVM;
  usage: UsageVM | null; // może być null przed pierwszym sukcesem
  isBusy: boolean; // request in-flight
  limitReached: boolean; // ustawiane po 429, aby zablokować CTA w tej sesji
  error: GenerateErrorVM | null;
}
```

## 6. Zarządzanie stanem

Zarządzanie stanem lokalnie w `RecipeGenView` (React Hooks), bez globalnego store na start.

- **Stan formularza**: `useState<string>` + pochodne (charCount, isValid, message) liczone w `useMemo`.
- **Persystencja tekstu**:
  - custom hook `useSessionStorageState<string>(key, defaultValue)`:
    - na mount: odczyt wartości,
    - na zmianę: zapis do sessionStorage,
    - guard: try/catch (np. private mode).
- **Stan procesu**:
  - `step` (`editing`/`confirm`/`waiting`/`error`)
  - `isBusy` (blokada UI)
  - `limitReached` (po 429)
- **Stan usage**:
  - źródło prawdy po sukcesie to `GenerateRecipeResponse.usage`
  - po 429 ustaw `usage = { remaining: 0, limit: 3 }` (żeby UI od razu przełączył się w tryb “locked”)
  - opcjonalnie: “hydration usage” w przyszłości (np. dedykowany endpoint), ale nie jest wymagane do podstawowego działania.

Rekomendowane hooki:

- `useGenerateRecipe()` — enkapsulacja fetch + mapowanie błędów do `GenerateErrorVM`.
- `useSessionStorageState()` — persystencja tekstu.

## 7. Integracja API

Widok korzysta z endpointów opisanych w `.ai/API/api-plan.md`.

### 7.1. `POST /api/generate` (kluczowe)

- **Request**:
  - `method`: `POST`
  - `headers`: `Content-Type: application/json`
  - `body` (`GenerateRecipeCommand`):
    - `original_text: string` (3–1000 znaków)
- **Response (201)** — `GenerateRecipeResponse`:
  - `recipe`: `{ id, title, ingredients, instructions }`
  - `usage`: `{ remaining, limit }`
- **Błędy (na podstawie implementacji endpointu):**
  - `401` `{ error: "Unauthorized" }`
  - `400` `{ error: "Validation failed", details: ... }`
  - `429` `{ error: "Daily generation limit reached" }`
  - `502` `{ error: "Failed to generate recipe from AI provider" }`
  - `500` `{ error: "Internal Server Error" }`

**Akcje frontendowe:**

- Po `201`: zaktualizuj `usage`, wyczyść `sessionStorage` dla tekstu, wykonaj redirect do `/recipe/{id}`.
- Po `429`: ustaw `limitReached = true`, pokaż komunikat z US-010, wyłącz CTA.
- Po `400`: pokaż błąd walidacji (preferencyjnie inline nad CTA + opcjonalnie rozwijane “szczegóły” dla `details`).
- Po `502/500`: toast + możliwość retry (z zachowaniem tekstu).
- Po `401`: redirect do `/login` (lub komunikat “zaloguj się”, zależnie od etapu projektu).

### 7.2. `GET /api/profile` (opcjonalne w tym widoku)

W tym widoku nie jest wymagane do samego generowania (backend pobiera profil po swojej stronie), ale może być użyte do:

- wyświetlenia `display_name` w nagłówku,
- wyświetlenia kontekstu “Twoje preferencje są używane do modyfikacji”.

Typ odpowiedzi: `ProfileDTO` (z `src/types.ts`).

## 8. Interakcje użytkownika

1. **Wejście na `/generate`**
   - Tekst w textarea jest automatycznie przywracany z sessionStorage (jeśli istnieje).
   - `CreditCounter` pokazuje `—/3` (lub skeleton) do czasu pierwszej aktualizacji usage (z sukcesu) albo pokazuje `0/3` po wykryciu 429.

2. **Wklejenie tekstu przepisu**
   - Aktualizacja licznika znaków w czasie rzeczywistym.
   - Po przekroczeniu limitu (1000) textarea nie przyjmuje dalszego inputu (maxLength).

3. **Klik “Modyfikuj”**
   - Jeśli tekst < 3 znaki po trim → brak modala, pokaz walidacji.
   - Jeśli limitReached → CTA disabled + komunikat limitu.
   - W przeciwnym razie → otwórz modal potwierdzenia zużycia kredytu.

4. **Potwierdzenie w modalu**
   - Zamknij modal → pokaż ekran oczekiwania.
   - Wywołaj `POST /api/generate`.

5. **Oczekiwanie**
   - Countdown od np. 30s. Jeśli request trwa dłużej niż countdown, UI przechodzi w stan “Jeszcze chwila…” (bez błędu).
   - Rotacja ciekawostek co np. 6–8s.

6. **Sukces**
   - Natychmiastowy redirect do `/recipe/{newId}`.
   - W tle: wyczyszczenie persystowanego tekstu.

7. **Błąd**
   - `429`: pokaż komunikat z US-010 i zablokuj CTA.
   - `400`: pokaż błąd walidacji, pozostaw tekst.
   - `502/500/network`: pokaż toast + przycisk “Spróbuj ponownie”.

## 9. Warunki i walidacja

### 9.1. Warunki UI (przed requestem)

- **Tekst wymagany**:
  - `original_text.trim().length >= 3`
  - Wpływ na UI:
    - CTA disabled, gdy warunek niespełniony.
    - Inline helper: “Wklej co najmniej 3 znaki.”
- **Limit znaków**:
  - `original_text.length <= 1000`
  - Wpływ na UI:
    - `maxLength={1000}`
    - licznik `x/1000`
- **Blokada po 429**:
  - `limitReached === true` → CTA disabled + widoczny komunikat limitu.

### 9.2. Warunki wynikające z API (po request)

- **401 Unauthorized**
  - UI: przekierowanie do `/login` lub komunikat “Musisz być zalogowany”.
- **400 Validation failed**
  - UI: przypisanie do `GenerateErrorVM.kind = "validation"`, wyświetlenie “popraw tekst”.
- **429 Daily generation limit reached**
  - UI: `limitReached = true`, komunikat:
    - „Wykorzystałeś dzienny limit modyfikacji (3/3). Wróć do nas jutro!”
- **502 AI provider**
  - UI: retryable error + informacja “Dostawca AI chwilowo niedostępny”.

## 10. Obsługa błędów

Scenariusze i rekomendowana obsługa:

- **Brak sieci / timeout**:
  - `kind: "network"`, `retryable: true`, toast + “Spróbuj ponownie”.
- **429 limit**:
  - `kind: "limit"`, `retryable: false`, banner + disabled CTA.
- **400 walidacja**:
  - `kind: "validation"`, `retryable: true`, inline błąd + zachowanie tekstu.
- **502 (AI/JSON/OpenRouter)**:
  - `kind: "ai_provider"`, `retryable: true`, toast + retry.
- **500**:
  - `kind: "server"`, `retryable: true`, toast + retry.
- **401**:
  - `kind: "unauthorized"`, redirect.

Wskazówki UX:

- Błędy “user-correctable” (walidacja) pokazuj inline w formularzu.
- Błędy “systemowe” (502/500) pokazuj toast + akcję retry.

## 11. Kroki implementacji

1. **Ustalenie routingu i nazewnictwa**
   - Dodaj `src/pages/generate.astro`.
   - Ustal finalny routing szczegółów przepisu: rekomendacja **`/recipe/[id]`**.

2. **Utworzenie szkieletu widoku**
   - Dodaj katalog `src/components/recipe-gen/`.
   - Utwórz `RecipeGenView.tsx` i podepnij jako `client:load` w `generate.astro`.

3. **Implementacja formularza**
   - Wydziel `GenerateForm.tsx` (możesz zrefaktorować istniejący `src/components/GenerateRecipeForm.tsx` lub użyć go jako punktu startowego).
   - Dodaj walidację UI zgodną z API (`min 3`, `max 1000`), licznik znaków, disabled states.

4. **Persystencja tekstu**
   - Dodaj hook `useSessionStorageState` i użyj go w `RecipeGenView` dla pola `original_text`.
   - Zadbaj o guard na brak dostępu do storage (try/catch).

5. **Modal potwierdzenia**
   - Dodaj `ConfirmConsumeCreditsDialog` na `AlertDialog` (shadcn/ui).
   - Po potwierdzeniu przełącz widok w tryb “waiting” i uruchom request.

6. **Warstwa API**
   - Dodaj `useGenerateRecipe()`:
     - `generate(command: GenerateRecipeCommand): Promise<GenerateRecipeResponse>`
     - mapowanie błędów na `GenerateErrorVM` wg statusów (400/401/429/502/500).

7. **Ekran oczekiwania**
   - Dodaj `GenerationWaitingScreen`:
     - countdown 30s,
     - fallback gdy request trwa dłużej,
     - ciekawostki rotowane w interwale.

8. **Sukces i redirect**
   - Po `201`:
     - zaktualizuj `usage`,
     - wyczyść sessionStorage,
     - przekieruj do `/recipe/${recipe.id}`.

9. **Obsługa błędów**
   - Inline walidacja (formularz).
   - Toasty dla systemowych (sonner).
   - Po 429: komunikat limitu + blokada CTA.

10. **Dopasowanie stylów i dostępność**

- Mobile First: pojedyncza kolumna, duże CTA, czytelne spacing.
- ARIA: `aria-describedby` dla helperów walidacji, poprawne labelowanie textarea.

11. **Manual QA (checklista)**

- Tekst < 3 znaków → brak modala, CTA disabled, helper.
- Tekst 1000+ → nie da się przekroczyć, licznik działa.
- 429 → komunikat limitu + CTA disabled.
- 502/500 → toast + retry, tekst pozostaje.
- Sukces → redirect do szczegółów + text cleared.
