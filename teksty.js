/**
 * Teksty strony w trzech językach: polskim, czeskim i angielskim.
 *
 * Wszystko, co widzi oglądający, siedzi tutaj — także podpisy sceny 3D
 * i komunikaty błędów. Strona nie ma osobnych plików na język: przełącznik
 * podmienia teksty w miejscu, a wybór zostaje w przeglądarce.
 *
 * Nazwy plików (`plansza.pdf`, `szablon-planszy.pdf`) są takie same w każdej
 * wersji — to nazwy w repozytorium, nie treść do tłumaczenia.
 */

export const JEZYKI = [
  { kod: 'pl', etykieta: 'PL', html: 'pl' },
  { kod: 'cs', etykieta: 'CZ', html: 'cs' },
  { kod: 'en', etykieta: 'EN', html: 'en' },
];

export const TEKSTY = {
  pl: {
    tytulStrony: 'KongresERP — stoisko targowe, wizualizacja 3D',
    nadtytul: 'Stoisko targowe · wizualizacja 3D',
    tytulDomyslny: 'Ścianka z planszy produkcyjnej',
    tytulScianki: (szer, wys) => `Ścianka ${szer} × ${wys} cm`,
    tytulBezPlanszy: 'Ścianka bez planszy',
    wczytywanie: 'Wczytuję planszę…',

    ramki: 'Ramki',
    ramkiWartosc: (n, szer, wys) => `${n} szt. · ${szer} × ${wys} cm`,
    powierzchnia: 'Powierzchnia stoiska',
    lada: 'Lada',
    ladaWartosc: '100 × 50 × 100 cm',
    siedziska: 'Siedziska',
    siedziskaWartosc: '2 × hoker 75 cm',

    wskazowkaSrebrna: 'Rollup i stolik przestawisz wskaźnikiem — złap i przeciągnij '
      + 'po podłodze stoiska.',
    przywrocFormatSrebrny: 'rollup · stolik',
    wariantZloty: 'Złoty',
    wariantSrebrny: 'Srebrny',
    tytulRollupa: (szer, wys) => `Rollup ${szer} × ${wys} cm`,
    rollup: 'Rollup',
    stolikEtykieta: 'Stolik koktajlowy',
    stolikWartosc: '⌀ 60 × 110 cm, pokrowiec stretch',
    plikRollup: 'Rollup',
    chipRollup: 'Rollup',
    rollupPlik: (nazwa) => `Grafika rollupa: <b>${nazwa}</b>`,
    rollupBrak: 'Brak grafiki rollupa — wczytaj plik albo upuść go na stronę.',
    wyposazenie: 'Wyposażenie',
    chipLada: 'Lada',
    chipStolik: 'Stolik',
    chipHokery: 'Hokery',
    wskazowka: 'Meble przestawisz wskaźnikiem — złap ladę, stolik albo hoker i przeciągnij '
      + 'po podłodze stoiska.',

    plansza: (nazwa) => `Plansza: <b>${nazwa}</b>`,
    arkusz: (szer, wys, spad) => `arkusz ${szer} × ${wys} cm, spad ${spad} mm odcięty`,
    obraz: (szer, wys) => `obraz ${szer} × ${wys} px — wymiary z proporcji, bez spadu`,
    arkuszBezSpadu: (szer, wys) => `arkusz ${szer} × ${wys} cm, bez spadu`,
    skala: (n, szer, wys) => `plik ma ${szer} × ${wys} mm — potraktowałem go jako skalę 1:${n % 1 ? n.toFixed(2) : n}`,
    blad: (nazwa, powod) => `Nie wczytałem <b>${nazwa}</b> — ${powod}.`,
    bladRada: 'Wczytaj plik produkcyjny planszy przyciskiem poniżej albo upuść go na stronę.',
    powodBrak: 'nie ma go na serwerze',
    powodOtwarcie: 'PDF nie dał się otworzyć',

    pliki: 'Pliki',
    plikScianka: 'Ścianka',
    plikLada: 'Lada',
    wczytajPdf: 'Wczytaj plik',
    szablon: 'Szablon',
    ladaPlik: (nazwa) => `oklejka lady: <b>${nazwa}</b>`,
    zamow: 'Zamów stoisko',
    zamowGdzie: 'szybkiestoisko.pl',
    wczytaj: 'Zobacz własną planszę',
    pobierz: 'Pobierz szablon 1:1',
    pobierzFormat: 'PDF · 3060 × 2560 mm',
    przywroc: 'Ustaw meble od nowa',
    przywrocFormat: 'lada · stolik · hokery',
    instrukcjaTytul: 'Jak przygotować planszę',

    krok1: 'Weź szablon',
    krok1a: 'Arkusz 1:1',
    krok1b: ' z ramkami, szczelinami profili, strefami bezpiecznymi i linią wzroku. '
      + 'Grafik projektuje na nim jak na podkładzie. Zasady są wypisane na samym szablonie.',
    krok2: 'Odbierz plik',
    krok2t: 'Jeden PDF 3060 × 2560 mm — ścianka 300 × 250 cm plus 30 mm spadu. '
      + 'Bez linii szablonu, nic w szczelinach.',
    krok3: 'Sprawdź tutaj',
    krok3t: 'Przeciągnij PDF na stronę albo kliknij „Zobacz własną planszę". '
      + 'Podgląd zostaje w Twojej przeglądarce — nikt inny go nie widzi.',
    krok4: 'Opublikuj',
    krok4a: 'Gdy plansza jest zaakceptowana, wgraj ją do repozytorium strony jako ',
    krok4b: '. Od tej chwili widzą ją wszyscy.',

    zrzutTytul: 'Upuść PDF planszy',
    zrzutOpis: 'Podgląd tylko w Twojej przeglądarce — plik nigdzie nie jest wysyłany',

    sterowanie: 'Obrót — przeciągnij · przybliżenie — kółko · przesunięcie — prawy przycisk',
    eksportObj: 'Pobierz model OBJ',
    eksportGlb: 'Pobierz model GLB',
  },

  cs: {
    tytulStrony: 'KongresERP — veletržní stánek, 3D vizualizace',
    nadtytul: 'Veletržní stánek · 3D vizualizace',
    tytulDomyslny: 'Stěna z produkčního souboru',
    tytulScianki: (szer, wys) => `Stěna ${szer} × ${wys} cm`,
    tytulBezPlanszy: 'Stěna bez grafiky',
    wczytywanie: 'Načítám grafiku…',

    ramki: 'Rámy',
    ramkiWartosc: (n, szer, wys) => `${n} ks · ${szer} × ${wys} cm`,
    powierzchnia: 'Plocha stánku',
    lada: 'Pult',
    ladaWartosc: '100 × 50 × 100 cm',
    siedziska: 'Sezení',
    siedziskaWartosc: '2 × barová židle 75 cm',

    wskazowkaSrebrna: 'Roll-up a stolek přesunete ukazatelem — chytněte a táhněte '
      + 'po podlaze stánku.',
    przywrocFormatSrebrny: 'roll-up · stolek',
    wariantZloty: 'Zlatý',
    wariantSrebrny: 'Stříbrný',
    tytulRollupa: (szer, wys) => `Roll-up ${szer} × ${wys} cm`,
    rollup: 'Roll-up',
    stolikEtykieta: 'Koktejlový stolek',
    stolikWartosc: '⌀ 60 × 110 cm, strečový potah',
    plikRollup: 'Roll-up',
    chipRollup: 'Roll-up',
    rollupPlik: (nazwa) => `Grafika roll-upu: <b>${nazwa}</b>`,
    rollupBrak: 'Chybí grafika roll-upu — načtěte soubor nebo jej přetáhněte na stránku.',
    wyposazenie: 'Vybavení',
    chipLada: 'Pult',
    chipStolik: 'Stolek',
    chipHokery: 'Židle',
    wskazowka: 'Nábytek přesunete ukazatelem — chytněte pult, stolek nebo židli a táhněte '
      + 'po podlaze stánku.',

    plansza: (nazwa) => `Grafika: <b>${nazwa}</b>`,
    arkusz: (szer, wys, spad) => `arch ${szer} × ${wys} cm, spadávka ${spad} mm oříznuta`,
    obraz: (szer, wys) => `obrázek ${szer} × ${wys} px — rozměry z poměru stran, bez spadávky`,
    arkuszBezSpadu: (szer, wys) => `arch ${szer} × ${wys} cm, bez spadávky`,
    skala: (n, szer, wys) => `soubor má ${szer} × ${wys} mm — bral jsem jej jako měřítko 1:${n % 1 ? n.toFixed(2) : n}`,
    blad: (nazwa, powod) => `Nepodařilo se načíst <b>${nazwa}</b> — ${powod}.`,
    bladRada: 'Načtěte produkční soubor tlačítkem níže nebo jej přetáhněte na stránku.',
    powodBrak: 'na serveru není',
    powodOtwarcie: 'PDF se nepodařilo otevřít',

    pliki: 'Soubory',
    plikScianka: 'Stěna',
    plikLada: 'Pult',
    wczytajPdf: 'Načíst soubor',
    szablon: 'Šablona',
    ladaPlik: (nazwa) => `polep pultu: <b>${nazwa}</b>`,
    zamow: 'Objednat stánek',
    zamowGdzie: 'szybkiestoisko.pl',
    wczytaj: 'Zobrazit vlastní grafiku',
    pobierz: 'Stáhnout šablonu 1:1',
    pobierzFormat: 'PDF · 3060 × 2560 mm',
    przywroc: 'Vrátit nábytek zpět',
    przywrocFormat: 'pult · stolek · židle',
    instrukcjaTytul: 'Jak připravit grafiku',

    krok1: 'Vezměte šablonu',
    krok1a: 'Arch 1:1',
    krok1b: ' s rámy, spárami profilů, bezpečnostními zónami a linií očí. Grafik na něm '
      + 'pracuje jako na podkladu. Pravidla jsou vypsaná přímo na šabloně.',
    krok2: 'Převezměte soubor',
    krok2t: 'Jedno PDF 3060 × 2560 mm — stěna 300 × 250 cm plus 30 mm spadávky. '
      + 'Bez linek šablony, nic ve spárách.',
    krok3: 'Zkontrolujte tady',
    krok3t: 'Přetáhněte PDF na stránku nebo klikněte na „Zobrazit vlastní grafiku". '
      + 'Náhled zůstane ve vašem prohlížeči — nikdo jiný jej nevidí.',
    krok4: 'Zveřejněte',
    krok4a: 'Jakmile je grafika schválená, nahrajte ji do repozitáře stránky jako ',
    krok4b: '. Od té chvíle ji vidí všichni.',

    zrzutTytul: 'Přetáhněte sem PDF grafiky',
    zrzutOpis: 'Náhled jen ve vašem prohlížeči — soubor se nikam neodesílá',

    sterowanie: 'Otáčení — tažením · přiblížení — kolečkem · posun — pravé tlačítko',
    eksportObj: 'Stáhnout model OBJ',
    eksportGlb: 'Stáhnout model GLB',
  },

  en: {
    tytulStrony: 'KongresERP — trade fair booth, 3D visualisation',
    nadtytul: 'Trade fair booth · 3D visualisation',
    tytulDomyslny: 'Wall from the production file',
    tytulScianki: (szer, wys) => `Wall ${szer} × ${wys} cm`,
    tytulBezPlanszy: 'Wall without artwork',
    wczytywanie: 'Loading the artwork…',

    ramki: 'Frames',
    ramkiWartosc: (n, szer, wys) => `${n} pcs · ${szer} × ${wys} cm`,
    powierzchnia: 'Booth footprint',
    lada: 'Counter',
    ladaWartosc: '100 × 50 × 100 cm',
    siedziska: 'Seating',
    siedziskaWartosc: '2 × bar stool 75 cm',

    wskazowkaSrebrna: 'Move the roll-up and the table with the pointer — grab and drag '
      + 'across the booth floor.',
    przywrocFormatSrebrny: 'roll-up · table',
    wariantZloty: 'Gold',
    wariantSrebrny: 'Silver',
    tytulRollupa: (szer, wys) => `Roll-up ${szer} × ${wys} cm`,
    rollup: 'Roll-up',
    stolikEtykieta: 'Cocktail table',
    stolikWartosc: '⌀ 60 × 110 cm, stretch cover',
    plikRollup: 'Roll-up',
    chipRollup: 'Roll-up',
    rollupPlik: (nazwa) => `Roll-up artwork: <b>${nazwa}</b>`,
    rollupBrak: 'No roll-up artwork — load a file or drop it onto the page.',
    wyposazenie: 'Furniture',
    chipLada: 'Counter',
    chipStolik: 'Table',
    chipHokery: 'Stools',
    wskazowka: 'Move the furniture with the pointer — grab the counter, table or stool '
      + 'and drag it across the booth floor.',

    plansza: (nazwa) => `Artwork: <b>${nazwa}</b>`,
    arkusz: (szer, wys, spad) => `sheet ${szer} × ${wys} cm, ${spad} mm bleed trimmed`,
    obraz: (szer, wys) => `image ${szer} × ${wys} px — size from the aspect ratio, no bleed`,
    arkuszBezSpadu: (szer, wys) => `sheet ${szer} × ${wys} cm, no bleed`,
    skala: (n, szer, wys) => `the file is ${szer} × ${wys} mm — read as scale 1:${n % 1 ? n.toFixed(2) : n}`,
    blad: (nazwa, powod) => `Could not load <b>${nazwa}</b> — ${powod}.`,
    bladRada: 'Load the production file with the button below, or drop it onto the page.',
    powodBrak: 'it is not on the server',
    powodOtwarcie: 'the PDF could not be opened',

    pliki: 'Files',
    plikScianka: 'Wall',
    plikLada: 'Counter',
    wczytajPdf: 'Load file',
    szablon: 'Template',
    ladaPlik: (nazwa) => `counter wrap: <b>${nazwa}</b>`,
    zamow: 'Order the booth',
    zamowGdzie: 'szybkiestoisko.pl',
    wczytaj: 'Show your own artwork',
    pobierz: 'Download the 1:1 template',
    pobierzFormat: 'PDF · 3060 × 2560 mm',
    przywroc: 'Reset the furniture',
    przywrocFormat: 'counter · table · stools',
    instrukcjaTytul: 'How to prepare the artwork',

    krok1: 'Take the template',
    krok1a: 'A 1:1 sheet',
    krok1b: ' with frames, profile gaps, safe zones and the eye-level line. The designer '
      + 'works on it as an underlay. The rules are written on the template itself.',
    krok2: 'Collect the file',
    krok2t: 'One PDF, 3060 × 2560 mm — a 300 × 250 cm wall plus 30 mm bleed. '
      + 'No template lines, nothing in the gaps.',
    krok3: 'Check it here',
    krok3t: 'Drag the PDF onto the page or click "Show your own artwork". The preview stays '
      + 'in your browser — nobody else sees it.',
    krok4: 'Publish',
    krok4a: 'Once the artwork is approved, upload it to the site repository as ',
    krok4b: '. From then on everyone sees it.',

    zrzutTytul: 'Drop the artwork PDF',
    zrzutOpis: 'The preview stays in your browser — the file is not uploaded anywhere',

    sterowanie: 'Drag to orbit · scroll to zoom · right-drag to pan',
    eksportObj: 'Download OBJ model',
    eksportGlb: 'Download GLB model',
  },
};
