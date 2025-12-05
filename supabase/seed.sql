
INSERT INTO public.diets (id, name, allowed_foods, forbidden_foods, macros)
VALUES
(
  'keto',
  'Keto',
  ARRAY[
    'pełnotłuste nabiał',
    'mięso, ryby, jaja',
    'awokado',
    'niskowęglowodanowe warzywa (brokuły, szpinak, sałata)',
    'oleje (oliwa z oliwek, kokosowy)',
    'orzechy (makadamia, orzechy włoskie, migdały)',
    'nasiona (chia, lniane)',
    'czekolada gorzka (min. 85% kakao)',
    'kakao, kawa, herbata bez cukru',
    'ocet jabłkowy, musztarda, sosy bez cukru'
  ],
  ARRAY[
    'pieczywo, makarony, ryż',
    'słodycze, cukier',
    'ziemniaki i inne warzywa skrobiowe',
    'owoce tropikalne, suszone owoce',
    'nabiał niskotłusty',
    'przetworzone produkty z dodatkiem cukru lub skrobi'
  ],
  '{ "tłuszcz": "70-80%", "białko": "10-20%", "węglowodany": "5-10%", "ograniczenia kaloryczne": "brak sztywnego limitu, zaleca się 20-50g netto węglowodanów dziennie" }'::jsonb
),
(
  'vege',
  'Vege',
  ARRAY[
    'warzywa',
    'owoce',
    'ziarna (ryż, kasze, pszenica)',
    'nabiał',
    'jaja',
    'orzechy, nasiona',
    'strączki (soczewica, fasola, groch)',
    'oleje roślinne'
  ],
  ARRAY[
    'mięso, ryby, drobiu',
    'produkty pochodzenia zwierzęcego (oprócz nabiału i jaj)'
  ],
  '{ "tłuszcz": "20-30%", "białko": "25-30%", "węglowodany": "45-55%", "ograniczenia kaloryczne": "brak sztywnego limitu, zaleca się zbilansowaną dietę" }'::jsonb
),
(
  'vegan',
  'Vegan',
  ARRAY[
    'warzywa',
    'owoce',
    'ziarna (ryż, kasze, pszenica)',
    'orzechy, nasiona',
    'strączki (soczewica, fasola, groch)',
    'oleje roślinne',
    'mleka roślinne (bez cukru)'
  ],
  ARRAY[
    'mięso, ryby, drobiu',
    'nabiał',
    'jaja',
    'produkty pochodzenia zwierzęcego'
  ],
  '{ "tłuszcz": "20-30%", "białko": "25-30%", "węglowodany": "45-55%", "ograniczenia kaloryczne": "brak sztywnego limitu, zaleca się zbilansowaną dietę" }'::jsonb
),
(
  'low-carb',
  'Low-carb',
  ARRAY[
    'warzywa niskowęglowodanowe (brokuły, szpinak, sałata)',
    'mięso, ryby, jaja',
    'pełnotłusty nabiał',
    'awokado',
    'oleje roślinne',
    'orzechy, nasiona',
    'niskowęglowodanowe owoce (maliny, jagody)'
  ],
  ARRAY[
    'pieczywo, makarony, ryż',
    'słodycze, cukier',
    'ziemniaki i inne warzywa skrobiowe',
    'owoce tropikalne, suszone owoce',
    'przetworzone produkty z dodatkiem cukru lub skrobi'
  ],
  '{ "tłuszcz": "55-60%", "białko": "30-35%", "węglowodany": "5-10%", "ograniczenia kaloryczne": "brak sztywnego limitu, zaleca się 20-100g węglowodanów dziennie" }'::jsonb
),
(
  'bezgluten',
  'Bezgluten',
  ARRAY[
    'warzywa',
    'owoce',
    'mięso, ryby, jaja',
    'nabiał',
    'ziarna bezglutenowe (ryż, kukurydza, amarant, gryka, kwinoa, tef)',
    'orzechy, nasiona',
    'oleje roślinne',
    'mleka roślinne'
  ],
  ARRAY[
    'pszenica, żyto, jęczmień',
    'pieczywo, makarony, ryż z dodatkiem pszenicy',
    'malt, ekstrakt malty, aromat malty',
    'przetworzone produkty z dodatkiem glutenu'
  ],
  '{ "tłuszcz": "20-30%", "białko": "15-20%", "węglowodany": "45-55%", "ograniczenia kaloryczne": "brak sztywnego limitu, zaleca się unikanie glutenu poniżej 10-30mg dziennie" }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  allowed_foods = EXCLUDED.allowed_foods,
  forbidden_foods = EXCLUDED.forbidden_foods,
  macros = EXCLUDED.macros;

INSERT INTO public.allergens (id, name)
VALUES
  ('mleko-krowie', 'Mleko krowie'),
  ('jaja-kurze', 'Jaja kurze'),
  ('ryby', 'Ryby'),
  ('skorupiaki', 'Skorupiaki (np. krewetki, kraby, homary, raki)'),
  ('orzeszki-ziemne', 'Orzeszki ziemne (arachidowe)'),
  ('orzechy-drzewa', 'Orzechy drzewa (migdały, orzechy laskowe, włoskie, nerkowce, pekan, brazylijskie, pistacje, makadamia)'),
  ('soja', 'Soja'),
  ('pszenica', 'Pszenica (gluten)'),
  ('seler', 'Seler'),
  ('gorczyca', 'Gorczyca'),
  ('nasiona-sezamu', 'Nasiona sezamu'),
  ('dwutlenek-siarki', 'Dwutlenek siarki i siarczyny'),
  ('lubin', 'Łubin'),
  ('mieczaki', 'Mięczaki (małże, kalmary, ślimaki, ostrygi, ośmiornice)'),
  ('pomidor', 'Pomidor'),
  ('marchew', 'Marchew'),
  ('jablko', 'Jabłko'),
  ('cytrusy', 'Cytrusy (np. pomarańcze, cytryny)'),
  ('truskawki', 'Truskawki'),
  ('banany', 'Banany'),
  ('czekolada', 'Czekolada')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name;

INSERT INTO public.ingredients (id, name, category, variants, is_visible)
VALUES
  ('poultry', 'Drób', 'białko', ARRAY['pierś z kurczaka', 'udo kurczaka', 'skrzydełko kurczaka', 'mielone kurczaka', 'kaczka', 'pierś z kaczki', 'gęś', 'indyk', 'udziec indyka', 'mielony indyk', 'przepiórka', 'drób z kury', 'kurczak capon'], true),
  ('legumes', 'Strączki', 'warzywo', ARRAY['fasola zwykła', 'fasola czarna', 'fasola pinto', 'fasola kidney', 'fasola cannellini', 'fasola pędu', 'soczewica czerwona', 'soczewica zielona', 'soczewica brązowa', 'groszek zielony', 'groszek łuskany', 'słodkie groszki', 'ciecierzyca', 'bób', 'soja', 'tofu'], true),
  ('onion-varieties', 'Warianty cebuli', 'warzywo', ARRAY['cebula żółta', 'cebula biała', 'cebula czerwona', 'cebula słodka', 'cebula perłowa', 'cebula szalotka', 'cebula młoda', 'szczypiorek', 'por', 'czosnek', 'imbir', 'turmeryк', 'cebula włoska', 'cebula ziemniaczana'], true),
  ('grains', 'Zboża', 'węglowodany', ARRAY['pszenica', 'pszenica całoziarnista', 'mąka pszenna', 'mąka białokrzyska', 'żyto', 'żytnia mąka', 'owies', 'płatki owsiane', 'mąka owsiana', 'kukurydza', 'mąka kukurydziana', 'polenta', 'jeczmiń', 'orkisz', 'amarantus', 'komosa ryżowa', 'sorgo', 'farina', 'semolina', 'makaron', 'makaron całoziarnisty', 'makaron bez glutenu', 'ryż', 'ryż biały', 'ryż brązowy', 'ryż jasmine', 'ryż basmati', 'ryż sushi', 'ryż arborio', 'pszenka', 'proso'], true),
  ('leafy-greens', 'Warzywa liściaste', 'warzywo', ARRAY['sałata masłowa', 'sałata lodowa', 'sałata rzymska', 'sałata red butter', 'szpinaka', 'szpinaka świeży', 'szpinaka mrożony', 'rukola', 'brokuł', 'kalafior', 'kapusta zwykła', 'kapusta czerwona', 'kapusta białoruska', 'kapusta włoska', 'kapusta pekinská', 'brukselka', 'chrzan', 'mangold', 'blitwina', 'endywia', 'radicchio', 'mizeria', 'włoszczyzna', 'pokrzywa', 'orach', 'liście pokrzywki', 'liście rzepy', 'liście buraczu'], true),
  ('nuts-seeds', 'Orzechy i nasiona', 'tłuszcz', ARRAY['migdały', 'migdały mielone', 'masło migdałowe', 'mleko migdałowe', 'orzechy włoskie', 'orzechy pecan', 'orzechy makadamia', 'orzechy hasłowce', 'orzechy piniowe', 'orzechy brasylskie', 'orzeszki ziemne', 'masło orzechowe', 'mleko orzechowe', 'pestki słonecznika', 'pestki maku', 'pestki dyni', 'pestki arbuza', 'nasiona sezamu', 'tahini', 'nasiona lnu', 'nasiona chia', 'nasiona konopi', 'nasiona papryki', 'kokos', 'mleko kokosowe', 'mleko kokosowe pełne', 'mleko kokosowe light', 'mąka kokosowa', 'olej kokosowy', 'wiórki kokosowe'], true),
  ('milk-alternatives', 'Zamienniki mleka', 'produkt mleczny', ARRAY['mleko krowie', 'mleko pełne', 'mleko półtłuste', 'mleko odtłuszczone', 'mleko bez laktozy', 'mleko kozie', 'mleko owcze', 'mleko migdałowe', 'mleko sojowe', 'mleko zbożowe', 'mleko ryzowe', 'mleko owsiane', 'mleko kokosowe', 'mleko orzechowe', 'mleko z pestek', 'mleko wapniowane', 'mleko bez cukru', 'mleko bez glutenu', 'jogurt naturalny', 'jogurt grecki', 'jogurt sojowy', 'jogurt migdałowy', 'kefir', 'buttermilk', 'mleczko owsiane', 'mleczko z nasion', 'mleco roślinne', 'śmietana', 'śmietana do kawy', 'śmietana do ubijania', 'śmietana sojowa'], true),
  ('root-vegetables', 'Warzywa korzeniowe', 'warzywo', ARRAY['marchew', 'marchew młoda', 'marchew fioletowa', 'marchew karota', 'buraki', 'buraczeń', 'rzodkiew', 'rzodkiewka', 'rzepa', 'seler korzeniowy', 'pietruszka korzeniowa', 'pasternak', 'brukiew', 'rutabaga', 'ziemniaki', 'ziemniaki wczesne', 'ziemniaki białe', 'ziemniaki czerwone', 'ziemniaki fioletowe', 'bataty', 'słodkie ziemniaki', 'tarò', 'jicama', 'czosnek', 'cebula', 'szalotka', 'imber', 'kurkuma', 'chrzan', 'pastinaka', 'koper włoski'], true),
  ('herbs-spices', 'Zioła i przyprawy', 'przyprawy', ARRAY['bazylia', 'bazylia świeża', 'bazylia thajska', 'bazylia świętojańska', 'oregano', 'oregano świeży', 'oregano suszony', 'majeranek', 'tymianek', 'rozmaryn', 'szałwia', 'koper włoski', 'kminek', 'kolendra', 'pietruszka', 'czosnek niedźwiedzi', 'szczypiorek', 'estragron', 'sorrel', 'mięta', 'mięta pieprzowa', 'melissa', 'lawenda', 'rukola', 'pieprz czarny', 'pieprz cayenne', 'pieprz kawny', 'papryka', 'papryka węgierska', 'papryka dymiasta', 'chili', 'pieprz habanero', 'pieprz jalapeño', 'kurkuma', 'kardamon', 'cynamon', 'goździki', 'gałka muszkatołowa', 'anyż', 'fenkuł', 'żeń-szeń', 'kumin', 'curry', 'wasabi', 'soja', 'słód', 'vinegre', 'sól', 'sól morska', 'cukier', 'honny', 'syrop klonowy', 'liście limonki', 'liście laurowe', 'czysnek mielony'], true),
  ('plant-proteins', 'Białka roślinne', 'białko', ARRAY['tofu', 'tofu zwykłe', 'tofu jedwabne', 'tofu stanowcze', 'tofu osmażone', 'tempeh', 'seitan', 'proteina sojowa', 'proteina sojowa teksturyzowana', 'proteina groszkowska', 'proteina ryżowa', 'wodorosty spirulina', 'wodorosty chlorella', 'mąka z insektów', 'mleko roślinne', 'makaron z soczewicy', 'makaron z groszku', 'makaron z soi'], true),
  ('fish-seafood', 'Ryby i owoce morza', 'białko', ARRAY['łosoś', 'łosoś atlantycki', 'łosoś pacyficzny', 'łosoś wędzony', 'pstrąg', 'pstrąg tęczowy', 'dorada', 'okoń morski', 'dorsz', 'halibut', 'miętus', 'okoń', 'sandacz', 'linn', 'makrela', 'tuńczyk', 'sardynka', 'anchois', 'śledź', 'ślimak', 'małż', 'ostryga', 'muszla', 'ósemka', 'krewetka', 'krewetka tygrysia', 'langustyna', 'omul', 'homar', 'krab', 'meduza', 'ośmiornica', 'kalmary', 'mątwa', 'muszle przegrzebka', 'przegrzebek', 'żółw morski', 'ikra', 'kawior'], true),
  ('eggs', 'Jaja i produkty jajeczne', 'białko', ARRAY['jajo kurzego', 'białko jaja', 'żółtko jaja', 'jajo całe', 'jajo uwędzane', 'mleczko rybne', 'mleczko', 'jajo przepiórki', 'jajo gęsi', 'jajo kaczki', 'jajo strusia'], true),
  ('dairy', 'Produkty mleczne', 'produkt mleczny', ARRAY['ser żółty', 'ser mozzarella', 'ser parmezan', 'ser pecorino', 'ser gruyere', 'ser emmental', 'ser camembert', 'ser brie', 'ser błękitny', 'ser pleśniowy', 'ser świeży', 'twaróg', 'masło', 'masło topione', 'ghee', 'jogurt', 'jogurt grecki', 'jogurt islandzki', 'śmietana', 'mleczko', 'kefir', 'śmietanka', 'sernik', 'ricotta', 'feta', 'halloumi'], true),
  ('oils-fats', 'Oleje i tłuszcze', 'tłuszcz', ARRAY['olej oliwny', 'olej oliwny extra virgin', 'olej oliwny virgin', 'olej oliwny raffinowany', 'olej słonecznikowy', 'olej rzepakowy', 'olej arachidowy', 'olej sezamowy', 'olej orzechowy', 'olej kokosowy', 'olej kokosowy virgin', 'olej kokosowy rafinowany', 'olej lnów', 'olej zdrojowy', 'olej avocado', 'olej gruntów', 'masło', 'masło klarowane', 'ghee', 'smalec', 'tłuszcz wołowy', 'tłuszcz drobiowy', 'słonina', 'boczek', 'margaryna', 'oleomargarynam', 'skrót roślinny'], true),
  ('fruits', 'Owoce', 'owoce', ARRAY['jabłko', 'gruszka', 'brzoskwinia', 'nektaryna', 'morela', 'śliwka', 'wiśnia', 'czereśnia', 'strawberry', 'maliña', 'jeżyna', 'porzeczka', 'agrest', 'aronía', 'porzeczka czarna', 'porzeczka czerwona', 'borówka', 'czarna porzeczka', 'banant', 'mango', 'papaya', 'ananas', 'kiwi', 'granat', 'kiwano', 'guawa', 'passiflora', 'citron', 'pomarańcz', 'cytryna', 'limonka', 'grejfruit', 'pomelo', 'mandarynka', 'liczi', 'figalice', 'melon', 'arbuз', 'daten', 'figa'], true),
  ('other-vegetables', 'Warzywa pozostałe', 'warzywo', ARRAY['pomidor', 'pomidor czereśnia', 'pomidor koktajlowy', 'pomidor mięsisty', 'pomidor włoski', 'pomidor zielony', 'pomidor uwędzony', 'papryka', 'papryka słodka', 'papryka żółta', 'papryka czerwona', 'papryka zielona', 'papryka pomarańczowa', 'bakłażan', 'cukinią', 'dynia', 'ogórek', 'ogórek cornichon', 'ogórek marinowany', 'okra', 'seler', 'seler liściaste', 'seler korzeniowy', 'marchew', 'burak', 'szpinaka', 'brokuł', 'kalafior', 'kapusta', 'brukselka', 'fasolka szparagowa', 'groszek zielony', 'kukurydza', 'artichoke', 'sałata', 'rukola', 'radicchio', 'endywia'], true),
  ('pasta-bread', 'Makarony i piekarskie', 'węglowodany', ARRAY['chleb biały', 'chleb żytni', 'chleb razowy', 'chleb zbożowy', 'chleb pełnoziarnisty', 'bułka', 'bagietka', 'chlebek', 'pita', 'tortilla', 'lavash', 'tandoori', 'nan', 'focaccia', 'ciabatta', 'makaron spaghetti', 'makaron penne', 'makaron rigatoni', 'makaron fettuccine', 'makaron farfalle', 'makaron lasagne', 'makaron orzo', 'makaron całoziarnisty', 'makaron bez glutenu', 'makaron z soczewicy', 'makaron z groszku', 'biszkopt', 'galleta', 'cracker', 'płatek chlebowy'], true),
  ('sauces-condiments', 'Sosy i dodatki', 'przyprawy', ARRAY['sos pomidorowy', 'pesto', 'majonezy', 'musztarda', 'keczup', 'sos chili', 'sriracha', 'wasabi', 'soja', 'tamari', 'miso', 'miso białe', 'miso czerwone', 'teriyaki', 'worcester', 'tabasco', 'panzanella', 'chimichurri', 'romesco', 'ayoli', 'hollandaise', 'bearnaise', 'demi-glace', 'brown butter', 'ponzu', 'nuoc mam', 'hoisin', 'oyster sauce', 'fish sauce', 'tamarind', 'harissa', 'tahini', 'żurawina', 'morze', 'marynata', 'ocet', 'ocet balsamiczny', 'ocet ryżowy', 'ocet białego wina', 'ocet czerwonego wina'], true),
  ('sweets-sugar', 'Słodycze i cukier', 'słodycze', ARRAY['cukier biały', 'cukier brązowy', 'cukier kryształ', 'cukier muskavado', 'cukier demerara', 'cukier turbinadowy', 'melasa', 'miód', 'nektary', 'syrop klonowy', 'syrop ryżowy', 'syrop kukurydzianom', 'syrop agawy', 'syrop drzewny', 'melasa', 'treacle', 'daktyle', 'rodzynki', 'żurawina', 'czarnuszka', 'wanilia', 'wanilina', 'ekstakt wanilii', 'kakao', 'czekolada', 'czekolada ciemna', 'czekolada mleczna', 'czekolada biała', 'chipsy czekoladowe', 'karob', 'wiśnia', 'malin', 'zakwas owocowy'], true),
  ('baking-ingredients', 'Składniki piekarskie', 'składniki piekarskie', ARRAY['proszek do pieczenia', 'soda oczyszczająca', 'drożdże', 'drożdże świeże', 'drożdże suche', 'drożdże szybko rosnące', 'maizena', 'skrobia kukurydziana', 'mąka pszenna', 'mąka białokrzyska', 'mąka całoziarnista', 'mąka żytnia', 'mąka owsiana', 'mąka kokosowa', 'mąka migdałowa', 'mąka z groszku', 'mąka z soczewicy', 'mąka kukurydziana', 'mąka z reszty', 'mleko', 'masło', 'jaja', 'krem tarta', 'emulgator', 'zagęszczacz', 'erytritol', 'stevia', 'xylitol', 'gelatin', 'agar'], true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  variants = EXCLUDED.variants,
  is_visible = EXCLUDED.is_visible;
