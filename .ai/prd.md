# Dokument wymagań produktu (PRD) - HealthyMeal

## 1. Przegląd produktu

HealthyMeal to aplikacja internetowa (Web App) typu MVP, której celem jest rozwiązywanie problemu dostosowywania przepisów kulinarnych do indywidualnych potrzeb żywieniowych. Użytkownicy często znajdują w sieci interesujące przepisy, które jednak zawierają składniki, których nie mogą lub nie chcą spożywać ze względu na alergie, diety eliminacyjne lub preferencje.

Aplikacja umożliwia użytkownikom wklejenie tekstu dowolnego przepisu, a następnie wykorzystuje sztuczną inteligencję (LLM) do jego modyfikacji zgodnie z profilem żywieniowym użytkownika. System zamienia niepożądane składniki na odpowiedniki, zachowując strukturę i sens kulinarny dania.

## 2. Problem użytkownika

Dostosowywanie dostępnych w sieci przepisów kulinarnych do osobistych potrzeb i wymagań żywieniowych jest czasochłonne, ryzykowne (możliwość pomyłki przy alergiach) i wymaga specjalistycznej wiedzy o zamiennikach produktów.

Kluczowe problemy to:

- Trudność w szybkim znalezieniu zamienników dla alergenów (np. czym zastąpić jajko w ciastach).
- Konieczność ręcznego przeliczania lub modyfikowania instrukcji przygotowania po zmianie składników.
- Brak centralnego miejsca do przechowywania zmodyfikowanych, bezpiecznych wersji przepisów.
- Ryzyko przygotowania posiłku niezgodnego z dietą (np. Keto, Vegan) przez przeoczenie ukrytych składników.

## 3. Wymagania funkcjonalne

### 3.1 Uwierzytelnianie i Zarządzanie Kontem

- Rejestracja i logowanie za pomocą adresu e-mail i hasła.
- Logowanie społecznościowe (Google OAuth).
- Możliwość resetowania hasła.
- Wylogowanie z sesji.

### 3.2 Onboarding i Profil Żywieniowy

- Obowiązkowy kreator (wizard) przy pierwszym uruchomieniu po rejestracji.
- Wybór diety głównej z listy zamkniętej (np. Keto, Wegetariańska, Wegańska, Bezglutenowa).
- Wybór alergenów do wykluczenia definitywnego z listy zamkniętej (np. Orzechy, Laktoza, Skorupiaki).
- Definiowanie "Preferencji produktów" - lista tekstowa produktów nielubianych (miękkie wykluczenia).
- Edycja profilu możliwa wyłącznie poprzez ponowne przejście procesu onboardingu.

### 3.3 Modyfikacja Przepisów (Core AI)

- Pole tekstowe do wklejenia przepisu (limit 1000 znaków).
- Walidacja bezpieczeństwa i tematyki (AI sprawdza, czy tekst jest przepisem).
- Generowanie zmodyfikowanej wersji przepisu:
  - Zamiana składników niezgodnych z dietą/alergenami.
  - Próba zamiany produktów "nielubianych" (jeśli możliwe bez zepsucia dania).
  - Dostosowanie instrukcji przygotowania do nowych składników.
- Strukturyzacja danych wyjściowych: Tytuł, Składniki, Instrukcje, Metadane (czas, kalorie - opcjonalnie).
- Obsługa błędów: Wyświetlenie komunikatu, jeśli modyfikacja jest niemożliwa lub tekst nie jest przepisem.

### 3.4 Dashboard i Zarządzanie Przepisami

- Widok listy (kafelków) zapisanych przepisów.
- Wyszukiwarka tekstowa przeszukująca tytuły i składniki.
- Filtrowanie listy po: Rodzaju diety, Dacie dodania.
- Oznaczanie przepisów jako "nieaktualne" (wyszarzenie), jeśli zostały utworzone przed ostatnią zmianą profilu użytkownika.
- Możliwość usunięcia przepisu.

### 3.5 Szczegóły Przepisu

- Wyświetlanie czytelnego widoku przepisu (oddzielne sekcje składników i instrukcji).
- Funkcja "Kopiuj do schowka" (cały tekst przepisu).
- Przycisk ponownej modyfikacji (tworzy nowy wpis w bazie).
- Wyświetlanie uwag od AI (np. "Nie udało się wykluczyć cebuli, jest kluczowa dla smaku").

### 3.6 Ograniczenia Systemowe i Prawne

- Limit 3 modyfikacji na użytkownika na dobę (reset o północy lub po 24h).
- Disclaimer medyczny widoczny w stopce lub przy generowaniu (aplikacja edukacyjna).
- Zgody RODO i Cookies przy rejestracji.

## 4. Granice produktu

### Wchodzi w zakres (In Scope)

- Responsywna aplikacja webowa (PWA/RWD).
- Obsługa języka polskiego (interfejs i generowanie treści).
- Baza danych z relacją rodzic-dziecko dla przepisów (backend), ale płaska lista w UI.
- Prosta animacja oczekiwania na wynik (skeleton loader/animacja gotowania).

### Nie wchodzi w zakres (Out of Scope)

- Import przepisów bezpośrednio z adresu URL (scraping).
- Rozpoznawanie przepisów ze zdjęć.
- Generowanie przepisów od zera na podstawie nazwy potrawy.
- Ręczna edycja treści przepisu wewnątrz aplikacji.
- Udostępnianie przepisów innym użytkownikom (social features).
- Widok drzewa wersji/historii zmian dla jednego przepisu.
- Generowanie listy zakupów.
- Natywne aplikacje mobilne (iOS/Android).

## 5. Historyjki użytkowników

### Uwierzytelnianie i Konto

ID: US-001
Tytuł: Rejestracja konta email
Opis: Jako nowy użytkownik chcę założyć konto podając email i hasło, aby móc zapisywać swoje przepisy.
Kryteria akceptacji:

1. Użytkownik podaje email i hasło (z walidacją siły hasła).
2. Po udanej rejestracji użytkownik jest przekierowywany do onboardingu.
3. System wymaga akceptacji regulaminu i polityki prywatności.

ID: US-002
Tytuł: Logowanie przez Google
Opis: Jako użytkownik chcę zalogować się kontem Google, aby przyspieszyć proces dostępu.
Kryteria akceptacji:

1. Przycisk "Zaloguj z Google" jest dostępny na ekranie logowania/rejestracji.
2. Po autoryzacji Google, jeśli konto nie istnieje, jest tworzone i następuje onboarding.
3. Jeśli konto istnieje, następuje przekierowanie do Dashboardu.

ID: US-003
Tytuł: Odzyskiwanie hasła
Opis: Jako użytkownik, który zapomniał hasła, chcę zresetować je poprzez link email.
Kryteria akceptacji:

1. Formularz "Zapomniałem hasła" wysyła link resetujący na email.
2. Kliknięcie w link pozwala ustawić nowe hasło.

### Onboarding i Profil

ID: US-004
Tytuł: Wizard preferencji - Dieta
Opis: Jako nowy użytkownik chcę wybrać moją dietę z listy, aby przepisy były do niej dostosowane.
Kryteria akceptacji:

1. Wyświetlenie listy diet (np. Keto, Vege).
2. Możliwość zaznaczenia tylko jednej diety głównej lub opcji "Brak".
3. Przejście do następnego kroku jest możliwe po wyborze.

ID: US-005
Tytuł: Wizard preferencji - Alergeny
Opis: Jako użytkownik chcę zaznaczyć alergeny, których muszę unikać, aby przepisy były bezpieczne.
Kryteria akceptacji:

1. Wyświetlenie listy popularnych alergenów.
2. Możliwość wielokrotnego wyboru.
3. Zapisanie wyboru w profilu.

ID: US-006
Tytuł: Wizard preferencji - Produkty nielubiane
Opis: Jako użytkownik chcę wpisać listę produktów, których nie lubię, aby AI próbowało je wyeliminować.
Kryteria akceptacji:

1. Pole tekstowe umożliwiające dodawanie wpisów (tagów).
2. System zapisuje te dane jako preferencje "miękkie".

ID: US-007
Tytuł: Aktualizacja profilu
Opis: Jako użytkownik chcę zmienić dietę, przechodząc ponownie proces onboardingu.
Kryteria akceptacji:

1. Dostęp do opcji "Edytuj preferencje" w profilu.
2. Uruchomienie tego samego wizarda co przy rejestracji.
3. Nadpisanie starych preferencji nowymi po zakończeniu procesu.

### Główna Funkcjonalność (Core)

ID: US-008
Tytuł: Wprowadzanie przepisu do modyfikacji
Opis: Jako użytkownik chcę wkleić tekst przepisu, aby dostosować go do mojej diety.
Kryteria akceptacji:

1. Pole tekstowe przyjmuje do 1000 znaków.
2. Przycisk "Modyfikuj" jest aktywny tylko gdy pole nie jest puste.
3. Wyświetlenie licznika znaków.

ID: US-009
Tytuł: Walidacja i generowanie przez AI
Opis: Jako użytkownik chcę otrzymać zmodyfikowany przepis, który zachowuje sens kulinarny.
Kryteria akceptacji:

1. Wyświetlenie animacji ładowania podczas przetwarzania.
2. Backend weryfikuje, czy tekst jest przepisem.
3. Jeśli tekst nie jest przepisem -> komunikat błędu.
4. Jeśli tekst jest poprawny -> wyświetlenie zmodyfikowanego tytułu, składników i instrukcji.
5. Wyświetlenie uwag AI (jeśli wystąpiły).

ID: US-010
Tytuł: Obsługa limitu dziennego
Opis: Jako użytkownik chcę wiedzieć, kiedy wyczerpałem limit darmowych modyfikacji.
Kryteria akceptacji:

1. System zlicza udane modyfikacje (max 3/24h).
2. Po wykorzystaniu limitu przycisk "Modyfikuj" jest nieaktywny.
3. Wyświetlenie komunikatu: "Wykorzystałeś dzienny limit modyfikacji (3/3). Wróć do nas jutro!".

ID: US-011
Tytuł: Zapisywanie przepisu
Opis: Jako użytkownik chcę, aby wygenerowany przepis zapisał się automatycznie w mojej bibliotece.
Kryteria akceptacji:

1. Po udanym wygenerowaniu przepis jest zapisywany w bazie danych powiązanej z użytkownikiem.
2. Użytkownik jest przekierowywany do widoku szczegółów nowego przepisu.

### Dashboard i Przeglądanie

ID: US-012
Tytuł: Przeglądanie listy przepisów
Opis: Jako użytkownik chcę widzieć listę moich przepisów, aby móc do nich wrócić.
Kryteria akceptacji:

1. Wyświetlenie kafelków z tytułem, dietą i datą dodania.
2. Paginacja lub "load more" przy dużej liczbie przepisów.

ID: US-013
Tytuł: Wyszukiwanie i filtrowanie
Opis: Jako użytkownik chcę znaleźć konkretny przepis wpisując jego nazwę lub składnik.
Kryteria akceptacji:

1. Pasek wyszukiwania filtruje listę w czasie rzeczywistym lub po zatwierdzeniu (po tytule i składnikach).
2. Filtry: Dieta (dropdown), Data (rosnąco/malejąco).

ID: US-014
Tytuł: Oznaczenie nieaktualnych przepisów
Opis: Jako użytkownik chcę wiedzieć, które przepisy zostały stworzone przed zmianą mojej diety.
Kryteria akceptacji:

1. Przepisy z datą utworzenia starszą niż data ostatniej edycji profilu są wyszarzone.
2. Dodanie ikony lub etykiety "Nieaktualne preferencje".
3. Przepisy te są nadal klikalne i możliwe do odczytu.

### Szczegóły i Akcje

ID: US-015
Tytuł: Kopiowanie przepisu
Opis: Jako użytkownik chcę skopiować treść przepisu jednym kliknięciem, aby wysłać go np. na komunikatorze.
Kryteria akceptacji:

1. Przycisk "Kopiuj do schowka" kopiuje sformatowany tekst (Tytuł + Składniki + Instrukcje).
2. Wyświetlenie krótkiego komunikatu "Skopiowano".

ID: US-016
Tytuł: Usuwanie przepisu
Opis: Jako użytkownik chcę usunąć przepis, którego już nie potrzebuję.
Kryteria akceptacji:

1. Przycisk "Usuń" dostępny w widoku szczegółów lub na liście.
2. Potwierdzenie akcji (modal).
3. Trwałe usunięcie rekordu z bazy.

## 6. Metryki sukcesu

### 6.1 Wskaźniki zaangażowania i retencji

- D7 Retention: Minimum 20% użytkowników, którzy wygenerowali pierwszy przepis, wraca do aplikacji w 7. dniu od rejestracji (wykonuje akcję view lub create).
- Frequency: Średnia liczba generowanych przepisów na aktywnego użytkownika w tygodniu (Cel: > 1).

### 6.2 Wskaźniki akwizycji i onboardingu

- Onboarding Completion Rate: 90% użytkowników, którzy rozpoczęli proces rejestracji, kończy wizard preferencji i trafia do Dashboardu.

### 6.3 Wskaźniki jakości i bezpieczeństwa

- Failed Generation Rate: Procent prób generowania zakończonych błędem (technicznym lub walidacji). Cel: < 5%.
- Safety Incidents: Liczba zgłoszeń lub wykrytych prób generowania treści niebezpiecznych/nielegalnych. Cel: 0.
