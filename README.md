# KongresERP — stoisko targowe 3D

Wizualizacja stoiska, w której ścianka i lada są renderowane **z plików
produkcyjnych PDF**. Wrzucasz plik, robisz `git push`, Netlify publikuje —
model 3D bierze grafikę wprost z tego pliku, bez żadnego kroku pośredniego.

## Jak podmienić grafikę

| Element | Plik | Format |
| --- | --- | --- |
| Ścianka | `plansza.pdf` | 3060 × 2560 mm (300 × 250 cm + 30 mm spadu) |
| Lada | `lada.pdf` | 2060 × 1060 mm (bok 500 · front 1000 · bok 500 + spad) |

```bash
git add plansza.pdf && git commit -m "Nowa plansza" && git push
```

Do szybkiego podglądu bez wdrożenia: **Pliki → Wczytaj PDF** albo przeciągnięcie
PDF-a na stronę. Taki podgląd zostaje w przeglądarce — plik nigdzie nie jest
wysyłany, więc wersję roboczą można pokazać na spotkaniu bez publikowania.

**Skala rozpoznaje się sama.** Plik oddany w 1:10 strona przelicza na 1:1
i pisze o tym w panelu. Wymuszenie: `?skala=1`.

**Wymiary ścianki czytamy z PDF-a** — szerokość arkusza minus dwa spady. Siatka
ramek wychodzi z modułu konstrukcyjnego 100 × 125 cm. Inna ścianka to inny plik,
nic nie trzeba przestawiać w kodzie.

## Zamówienie stoiska

Panel ma przycisk **„Zamów stoisko"** prowadzący na
[szybkiestoisko.pl](https://szybkiestoisko.pl/) — otwiera się w nowej karcie.
Adres zmienia się w `index.html`, podpis przycisku w `teksty.js`
(klucze `zamow` i `zamowGdzie`, trzy języki).

## Osadzenie na innej stronie

Strona działa w `<iframe>` bez żadnych ustawień — Netlify nie wysyła nagłówków
blokujących ramkę:

```html
<iframe src="https://<adres-z-netlify>/" title="Stoisko 3D"
        style="width:100%;height:640px;border:0;border-radius:12px"
        loading="lazy" allowfullscreen></iframe>
```

W ramce strona sama przechodzi w **tryb osadzony**: znikają narzędzia do
podmiany plików i instrukcja dla grafika, zostaje stoisko, wymiary, przełącznik
wyposażenia, języki i przycisk zamówienia. Wymuszenie: `?osadzone=1` (tryb
osadzony poza ramką) albo `?osadzone=0` (pełny panel w ramce).

Przydatne parametry przy osadzaniu: `?lang=en` — wersja językowa,
`?plik=inna.pdf` i `?lada=inna.pdf` — konkretna grafika dla danej podstrony.

Jeśli chcesz ograniczyć, kto może osadzać stronę, dopisz w `netlify.toml`:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "frame-ancestors 'self' https://kongreserp.pl https://*.kongreserp.pl"
```

Bez tego nagłówka stronę może osadzić każdy — co przy publicznej wizualizacji
zwykle jest w porządku.

## Szablony dla grafika

`szablon-planszy.pdf` i `szablon-lady.pdf` to podkłady w skali 1:1 — strona
udostępnia je w sekcji „Pliki". Widać na nich to, czego nie widać na gotowym
wydruku: ramki i szczeliny profili, strefy bezpieczne, linię wzroku 160 cm,
pole zasłonięte ladą, a przy ladzie linie zagięcia w narożach oraz pasy zakryte
przez cokół i blat.

Obok każdego szablonu leży **podgląd PNG** (przycisk „PNG") — ten sam arkusz
w pikselach, przycięty do pola netto, więc proporcje obrazu są proporcjami
ścianki: 2000 × 1666 px dla ścianki, 2000 × 1000 px dla lady. Do makiety
i prezentacji; plikiem produkcyjnym pozostaje PDF.

Oddawany plik nie może zawierać linii szablonu — to podkład roboczy, nie część
grafiki.

## Generator plików

Wszystkie cztery PDF-y powstają z jednego źródła — wymiarów konstrukcji
zapisanych w `narzedzia/pliki.py`:

```bash
python3 narzedzia/pliki.py                     # wszystkie cztery
python3 narzedzia/pliki.py szablon-lady        # tylko wybrany
python3 narzedzia/pliki.py --png 2000          # dodatkowo podglądy PNG
```

Zmiana konstrukcji (inna ścianka, inna lada) to zmiana liczb na górze tego
pliku; szablony i grafika wyjściowa przeliczą się same.

**Grafika wyjściowa jest poglądowa.** Logotyp jest w niej rastrem 326 px, więc
na wydruku 1:1 byłby nieostry — do produkcji potrzebny jest logotyp wektorowy
(SVG, EPS albo PDF). Wizualizacji to nie przeszkadza.

## Wersje językowe

Strona mówi po polsku, czesku i angielsku — przełącznik w rogu panelu, wybór
zostaje w przeglądarce. Można też wejść od razu w danym języku: `?lang=cs`,
`?lang=en`. Wszystkie teksty siedzą w `teksty.js`.

## Wyposażenie

Ladę, stolik i hokery można złapać wskaźnikiem i przesunąć po podłodze stoiska;
ruch jest ograniczony do jego obrysu. Chipy „Lada · Stolik · Hokery" zdejmują
meble ze sceny, gdy rozmowa dotyczy samej grafiki. „Ustaw meble od nowa" wraca
do układu wyjściowego.

## Co jest w repo

| Plik | Rola |
| --- | --- |
| `index.html` | strona: scena, panel, obsługa plików |
| `stoisko.js` | render PDF-ów i budowa modelu stoiska |
| `teksty.js` | teksty w trzech językach |
| `three-d-stage.js` | scena three.js: światło, cień, orbita, eksport OBJ/GLB |
| `narzedzia/pliki.py` | generator grafiki wyjściowej i szablonów |
| `vendor/` | pdf.js 6.3.289 lokalnie |
| `assets/` | logotyp KongresERP |

pdf.js leży w repo, a nie na CDN, z jednego powodu: worker musi być
same-origin, inaczej przeglądarka go zablokuje. Three.js ładuje się z unpkg
z przypiętym hashem integralności.

## Uruchomienie lokalne

Strona musi iść przez HTTP — `file://` blokuje modułowego workera pdf.js:

```bash
python3 -m http.server 3004
# http://127.0.0.1:3004/
```

## Netlify

Repozytorium jest gotowe do podpięcia: brak kroku budowania, katalogiem
publikacji jest korzeń (`netlify.toml`). W panelu Netlify: **Add new site →
Import an existing project → GitHub → erpview/kongreserp**.
