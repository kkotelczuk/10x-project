# Plan Schematu Bazy Danych - HealthyMeal

Ten dokument opisuje schemat bazy danych PostgreSQL dla aplikacji HealthyMeal, zaktualizowany o dedykowane tabele słownikowe dla diet, alergenów i składników, zgodnie z dostarczonymi danymi źródłowymi. Schemat jest zoptymalizowany pod kątem Supabase, wydajnego wyszukiwania oraz bezpiecznej izolacji danych (RLS).

## 1. Tabele Słownikowe (Lookups)

Tabele te przechowują definicje i metadane używane w aplikacji. Są to dane statyczne (lub rzadko zmieniane), importowane z plików JSON/JS.

### 1.1. `diets`

Przechowuje definicje diet dostępnych w systemie (źródło: `dieta_data/diet.json`).

| Kolumna           | Typ Danych | Ograniczenia   | Opis                                                     |
| :---------------- | :--------- | :------------- | :------------------------------------------------------- |
| `id`              | `text`     | `PK`           | Unikalny identyfikator (slug), np. 'keto', 'vege'.       |
| `name`            | `text`     | `NOT NULL`     | Nazwa wyświetlana diety.                                 |
| `allowed_foods`   | `text[]`   | `DEFAULT '{}'` | Lista dozwolonych grup produktów.                        |
| `forbidden_foods` | `text[]`   | `DEFAULT '{}'` | Lista zakazanych grup produktów.                         |
| `macros`          | `jsonb`    | `DEFAULT '{}'` | Wytyczne makroskładników (tłuszcz, białko, węglowodany). |

### 1.2. `allergens`

Przechowuje listę alergenów (źródło: `dieta_data/allergens.js`).

| Kolumna | Typ Danych | Ograniczenia | Opis                                                  |
| :------ | :--------- | :----------- | :---------------------------------------------------- |
| `id`    | `text`     | `PK`         | Slug alergenu, np. 'mleko-krowie', 'orzeszki-ziemne'. |
| `name`  | `text`     | `NOT NULL`   | Nazwa wyświetlana alergenu.                           |

### 1.3. `ingredients`

Przechowuje tagi składników używane do definicji produktów nielubianych (źródło: `dieta_data/ingredient_tags_database.json`).

| Kolumna      | Typ Danych | Ograniczenia   | Opis                                                  |
| :----------- | :--------- | :------------- | :---------------------------------------------------- |
| `id`         | `text`     | `PK`           | Slug składnika, np. 'poultry', 'onions'.              |
| `name`       | `text`     | `NOT NULL`     | Nazwa wyświetlana (np. 'Drób').                       |
| `category`   | `text`     | `NOT NULL`     | Kategoria (np. 'białko', 'warzywo').                  |
| `variants`   | `text[]`   | `DEFAULT '{}'` | Lista wariantów składnika (np. ['kurczak', 'indyk']). |
| `is_visible` | `boolean`  | `DEFAULT true` | Czy tag jest widoczny do wyboru dla użytkownika.      |

---

## 2. Tabele Główne

### 2.1. `profiles`

Rozszerzenie tabeli `auth.users`. Przechowuje preferencje użytkownika poprzez relacje do tabel słownikowych.

| Kolumna               | Typ Danych    | Ograniczenia                 | Opis                                      |
| :-------------------- | :------------ | :--------------------------- | :---------------------------------------- |
| `id`                  | `uuid`        | `PK`, `FK -> auth.users.id`  | Identyfikator użytkownika.                |
| `diet_id`             | `text`        | `FK -> diets.id`, `NULLABLE` | Wybrana dieta główna.                     |
| `display_name`        | `text`        | `NULLABLE`                   | Nazwa wyświetlana użytkownika.            |
| `terms_accepted_at`   | `timestamptz` | `NOT NULL`                   | Data zaakceptowania regulaminu.           |
| `privacy_accepted_at` | `timestamptz` | `NOT NULL`                   | Data zaakceptowania polityki prywatności. |
| `created_at`          | `timestamptz` | `DEFAULT now()`              | Data utworzenia profilu.                  |
| `updated_at`          | `timestamptz` | `DEFAULT now()`              | Data ostatniej aktualizacji profilu.      |

### 2.2. Tabele Łączące (Junction Tables)

Służą do obsługi relacji wiele-do-wielu między profilem a słownikami.

**`profile_allergens`**
| Kolumna | Typ Danych | Ograniczenia | Opis |
| :--- | :--- | :--- | :--- |
| `profile_id` | `uuid` | `PK`, `FK -> profiles.id` | Identyfikator profilu. |
| `allergen_id` | `text` | `PK`, `FK -> allergens.id` | Identyfikator alergenu. |

**`profile_dislikes`**
| Kolumna | Typ Danych | Ograniczenia | Opis |
| :--- | :--- | :--- | :--- |
| `profile_id` | `uuid` | `PK`, `FK -> profiles.id` | Identyfikator profilu. |
| `ingredient_id` | `text` | `PK`, `FK -> ingredients.id` | Identyfikator nielubianego składnika. |

### 2.3. `recipes`

Przechowuje wygenerowane przepisy.

| Kolumna             | Typ Danych    | Ograniczenia                                         | Opis                                                  |
| :------------------ | :------------ | :--------------------------------------------------- | :---------------------------------------------------- |
| `id`                | `uuid`        | `PK`, `DEFAULT gen_random_uuid()`                    | Unikalny identyfikator przepisu.                      |
| `user_id`           | `uuid`        | `FK -> profiles.id`, `NOT NULL`, `ON DELETE CASCADE` | Właściciel przepisu.                                  |
| `title`             | `text`        | `NOT NULL`                                           | Tytuł przepisu.                                       |
| `ingredients`       | `jsonb`       | `NOT NULL`                                           | Lista składników przepisu (JSON).                     |
| `instructions`      | `jsonb`       | `NOT NULL`                                           | Instrukcje przygotowania (JSON).                      |
| `diet_label`        | `text`        | `NOT NULL`                                           | Kopia nazwy diety (`diets.id`) z momentu generowania. |
| `prep_time_minutes` | `integer`     | `NULLABLE`                                           | Czas przygotowania.                                   |
| `calories`          | `integer`     | `NULLABLE`                                           | Kalorie.                                              |
| `is_active`         | `boolean`     | `DEFAULT true`                                       | Czy przepis jest zgodny z obecnym profilem.           |
| `created_at`        | `timestamptz` | `DEFAULT now()`                                      | Data utworzenia.                                      |

### 2.4. `generation_logs`

Audyt generowania przepisów.

| Kolumna         | Typ Danych    | Ograniczenia                                         | Opis                   |
| :-------------- | :------------ | :--------------------------------------------------- | :--------------------- |
| `id`            | `uuid`        | `PK`, `DEFAULT gen_random_uuid()`                    | ID logu.               |
| `user_id`       | `uuid`        | `FK -> profiles.id`, `NOT NULL`, `ON DELETE CASCADE` | Użytkownik.            |
| `success`       | `boolean`     | `NOT NULL`                                           | Status powodzenia.     |
| `error_message` | `text`        | `NULLABLE`                                           | Błąd (jeśli wystąpił). |
| `created_at`    | `timestamptz` | `DEFAULT now()`                                      | Czas próby.            |

---

## 3. Relacje i Struktura

1.  **Słowniki**:
    - Tabela `diets` jest słownikiem dla `profiles.diet_id` (N:1).
    - Tabela `allergens` łączy się z `profiles` przez `profile_allergens` (N:M).
    - Tabela `ingredients` łączy się z `profiles` przez `profile_dislikes` (N:M).

2.  **Kaskadowość**:
    - Usunięcie profilu (`profiles`) usuwa powiązane wpisy w `profile_allergens` i `profile_dislikes` (`ON DELETE CASCADE`).
    - Usunięcie wpisu ze słownika (rzadkie) powinno być zablokowane (`ON DELETE RESTRICT`) lub obsłużone (np. soft delete), aby nie naruszyć integralności profili.

---

## 4. Indeksy

### 4.1. Wydajność Aplikacji

- `profiles_diet_id_idx` (B-Tree): Szybkie filtrowanie użytkowników po diecie.
- `profile_allergens_profile_id_idx` (B-Tree): Szybkie pobieranie alergenów profilu.
- `profile_dislikes_profile_id_idx` (B-Tree): Szybkie pobieranie nielubianych składników.

### 4.2. Wyszukiwanie (Tabela `recipes`)

- `recipes_title_search_idx` (GIN): Pełnotekstowe wyszukiwanie po tytule (`to_tsvector('polish', title)`).
- `recipes_ingredients_gin_idx` (GIN): Wyszukiwanie w strukturze JSONB składników.
- `recipes_user_id_is_active_idx` (B-Tree): Filtrowanie aktywnych przepisów użytkownika na dashboardzie.

---

## 5. Zasady PostgreSQL (RLS & Triggers)

### 5.1. Row Level Security (RLS)

Wszystkie tabele mają włączone RLS.

- **Tabele Słownikowe (`diets`, `allergens`, `ingredients`)**:
  - `SELECT`: Publicznie dostępne dla uwierzytelnionych użytkowników (lub wszystkich, zależnie od potrzeb frontendu).
  - `INSERT/UPDATE/DELETE`: Tylko dla roli `service_role` (admin).

- **Tabele Łączące (`profile_allergens`, `profile_dislikes`)**:
  - `SELECT`: Użytkownik widzi swoje wpisy (`profile_id = auth.uid()`).
  - `INSERT/DELETE`: Użytkownik zarządza swoimi wpisami (`profile_id = auth.uid()`).

- **`profiles`, `recipes`, `generation_logs`**:
  - Zasady analogiczne jak w poprzednim planie (dostęp tylko do własnych danych).

### 5.2. Trigger: Inwalidacja Przepisów

Trigger `handle_profile_update` na tabeli `profiles` musi teraz monitorować także zmiany w tabelach łączących, co jest trudniejsze bezpośrednio.

- **Zmiana podejścia**: Trigger najlepiej umieścić na `profiles` (zmiana `diet_id`) ORAZ na tabelach łączących (`AFTER INSERT/DELETE` na `profile_allergens`, `profile_dislikes`).
- Każda zmiana w preferencjach ustawia `recipes.is_active = false` dla danego `user_id`.

---

## 6. Uwagi

1.  **Seedowanie Danych**: Tabele `diets`, `allergens` i `ingredients` muszą zostać uzupełnione danymi z plików JSON/JS podczas inicjalizacji bazy danych.
2.  **Obsługa `ingredients`**: Tabela zawiera kolumnę `variants` (tablica tekstowa), co pozwala na elastyczne dopasowywanie przez AI (np. jeśli użytkownik nie lubi "Drobiu", AI unika też "Kurczaka").
3.  **Spójność**: Zastosowanie tabel łączących zamiast tablic w `profiles` zapewnia lepszą integralność danych i łatwiejsze raportowanie.
