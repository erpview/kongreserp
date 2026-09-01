/**
 * Stoisko KongresERP — model 3D budowany z dostarczonej planszy PDF.
 *
 * Wejściem jest jeden plik: `plansza.pdf` w tym katalogu, w formacie
 * produkcyjnym z generatora (arkusz w skali 1:1 ze spadem, np. 3060 × 2560 mm
 * na ściankę 300 × 250 cm). Strona renderuje go w przeglądarce przez pdf.js,
 * odcina spad i kładzie na tkaninie — dlatego wdrożenie na Netlify to
 * podmiana pliku i `git push`, bez żadnego kroku lokalnego.
 *
 * Wymiary ścianki czytamy z samego PDF-a: szerokość arkusza minus dwa spady.
 * Siatka ramek wychodzi z modułu 100 × 125 cm, czyli konstrukcji, na której
 * ścianka stoi naprawdę. Wszystko da się nadpisać w adresie:
 *
 *   ?plik=inna.pdf&spad=0&glebokosc=200&kolumny=4&wiersze=2
 */

import * as pdfjs from './vendor/pdf.min.mjs';
import { JEZYKI, TEKSTY } from './teksty.js';

pdfjs.GlobalWorkerOptions.workerSrc =
  './vendor/pdf.worker.min.mjs';

const stage = document.querySelector('three-d-stage');
const { THREE } = await stage.ready;

const NAVY = '#101b3a', GOLD = '#0026ff', STONE = '#e9eaed', PAPER = '#ffffff';
const MM = 1 / 1000;                    // milimetr w metrach sceny
const PT_NA_MM = 25.4 / 72;
const MODUL = { szer: 1000, wys: 1250 };  // ramka konstrukcji w milimetrach

// Drugi pakiet: mniejsze stoisko przy alejce. Wymiary w metrach sceny.
const SREBRNE = {
  szer: 1.5, glebokosc: 0.7,
  rollupSzer: 1.0, rollupWys: 2.0,
  kolorStolika: '#3a3f4a',   // ciemnoszary pokrowiec stretch
};

const param = new URLSearchParams(location.search);
const USTAWIENIA = {
  plik: param.get('plik') || 'plansza.pdf',
  spad: liczba(param.get('spad'), 30),           // mm, zawinięcie w kanał silikonowy
  glebokosc: liczba(param.get('glebokosc'), 140), // cm, głębokość stoiska
  kolumny: liczba(param.get('kolumny'), null),
  wiersze: liczba(param.get('wiersze'), null),
  skala: liczba(param.get('skala'), null),   // wymuszona skala pliku, np. 1 albo 10
  lada: param.get('lada') || 'lada.pdf',
  rollup: param.get('rollup') || 'rollup.pdf',
  teksturaPx: 3000,
  teksturaLadyPx: 2000,
};

// Skale, w jakich ludzie rysują plansze wielkoformatowe. Plik oddany w 1:10
// wygląda w milimetrach jak pocztówka — bez rozpoznania skali ścianka zrobiłaby
// się kwadracikiem obok metrowej lady.
const SKALE = [1, 2, 2.5, 4, 5, 10, 20, 25, 50, 100];
const ARKUSZ_WZORCOWY = 3060;   // mm — ścianka 300 cm ze spadem, punkt odniesienia
const ARKUSZ_LADY = 2060;       // mm — rozwinięcie lady 100 × 50 × 100 ze spadem
const NAJMNIEJSZA_SCIANKA = 1000;  // mm — poniżej tego żadna ścianka nie istnieje

/* Strona osadzona w ramce pokazuje samo stoisko i przycisk zamówienia —
   wczytywanie własnych plików i instrukcja dla grafika zostają w wersji
   samodzielnej. Rozpoznajemy to same z siebie; `?osadzone=0` wymusza pełny
   panel także w ramce, `?osadzone=1` bez ramki. */
const osadzone = param.get('osadzone') === '1'
  || (param.get('osadzone') !== '0' && window.self !== window.top);
document.body.classList.toggle('osadzone', osadzone);

function liczba(wartosc, domyslna) {
  const x = parseFloat(wartosc);
  return Number.isFinite(x) ? x : domyslna;
}

/* ---------------------------------------------------------------- plansza */

/** Renderuje pierwszą stronę PDF-a bez spadu i oddaje teksturę plus wymiary
 *  ścianki w milimetrach. `zrodlo` to adres pliku albo jego zawartość. */
async function planszaZPdf(zrodlo) {
  const dokument = await pdfjs.getDocument(
    typeof zrodlo === 'string' ? { url: zrodlo } : { data: zrodlo }
  ).promise;
  const strona = await dokument.getPage(1);

  const arkusz = strona.getViewport({ scale: 1 });
  // wymiary tak, jak stoją w pliku, oraz to samo przeliczone na skalę 1:1
  const plikSzer = arkusz.width * PT_NA_MM, plikWys = arkusz.height * PT_NA_MM;
  const skalaPliku = USTAWIENIA.skala ?? wykryjSkale(plikSzer);
  const arkuszSzer = plikSzer * skalaPliku, arkuszWys = plikWys * skalaPliku;

  const spad = Math.min(USTAWIENIA.spad, arkuszSzer / 4, arkuszWys / 4);
  const szer = arkuszSzer - 2 * spad, wys = arkuszWys - 2 * spad;

  // Kadrujemy w jednostkach pliku, bo tam żyje strona PDF-a; skala tak dobrana,
  // żeby pole widoczne miało zadaną szerokość w pikselach, a offset przesuwa
  // arkusz o spad, więc kadr wychodzi wprost z renderu.
  const spadPliku = spad / skalaPliku;
  const szerPliku = plikSzer - 2 * spadPliku;
  const skala = USTAWIENIA.teksturaPx / (szerPliku / PT_NA_MM);
  const widok = strona.getViewport({
    scale: skala,
    offsetX: -spadPliku / PT_NA_MM * skala,
    offsetY: -spadPliku / PT_NA_MM * skala,
  });

  const plotno = document.createElement('canvas');
  plotno.width = Math.round(szerPliku / PT_NA_MM * skala);
  plotno.height = Math.round((plikWys - 2 * spadPliku) / PT_NA_MM * skala);
  const ctx = plotno.getContext('2d');
  ctx.fillStyle = NAVY;                       // tło na wypadek przezroczystości
  ctx.fillRect(0, 0, plotno.width, plotno.height);
  await strona.render({ canvasContext: ctx, viewport: widok }).promise;

  const tekstura = new THREE.CanvasTexture(plotno);
  tekstura.colorSpace = THREE.SRGBColorSpace;
  tekstura.anisotropy = 8;
  return { tekstura, szer, wys, arkuszSzer, arkuszWys, spad, skalaPliku, plikSzer, plikWys };
}

/** Skala, w jakiej oddano plik. Arkusz mniejszy niż jakakolwiek ścianka to
 *  rysunek pomniejszony — dobieramy najbliższą typową skalę zamiast zgadywać
 *  dowolny mnożnik, bo 1:10 zdarza się, a 1:8,7 nie. */
function wykryjSkale(szerokoscPliku, wzorzec = ARKUSZ_WZORCOWY) {
  if (szerokoscPliku >= NAJMNIEJSZA_SCIANKA) return 1;
  let najlepsza = 1, blad = Infinity;
  for (const s of SKALE) {
    const odchylka = Math.abs(Math.log((szerokoscPliku * s) / wzorzec));
    if (odchylka < blad) { blad = odchylka; najlepsza = s; }
  }
  return najlepsza;
}


/** Grafika z obrazu — PNG, JPG albo WebP zamiast PDF-a.
 *
 *  Obraz nie niesie milimetrów ani spadu, więc czytamy z niego tylko
 *  proporcje: szerokość ścianki zostaje ta sama co dotąd, wysokość wychodzi
 *  z kształtu pliku. Zakładamy pole netto — kto eksportuje makietę do PNG,
 *  ten spadu w niej nie zostawia.
 */
async function plotnoZObrazu(zrodlo) {
  const url = typeof zrodlo === 'string' ? zrodlo : URL.createObjectURL(zrodlo);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const plotno = document.createElement('canvas');
    plotno.width = img.naturalWidth;
    plotno.height = img.naturalHeight;
    plotno.getContext('2d').drawImage(img, 0, 0);
    return plotno;
  } finally {
    if (typeof zrodlo !== 'string') URL.revokeObjectURL(url);
  }
}

function teksturaZPlotna(plotno) {
  const tekstura = new THREE.CanvasTexture(plotno);
  tekstura.colorSpace = THREE.SRGBColorSpace;
  tekstura.anisotropy = 8;
  return tekstura;
}

async function planszaZObrazu(zrodlo) {
  const plotno = await plotnoZObrazu(zrodlo);
  const szer = (ostatni && ostatni.plansza && ostatni.plansza.szer) || 3000;
  const wys = Math.round((szer * plotno.height) / plotno.width);
  return {
    tekstura: teksturaZPlotna(plotno), szer, wys,
    arkuszSzer: szer, arkuszWys: wys, spad: 0, skalaPliku: 1,
    plikSzer: szer, plikWys: wys,
    obrazPx: [plotno.width, plotno.height],
  };
}

async function ladaZObrazu(zrodlo, udzialy) {
  return tnijPanele(await plotnoZObrazu(zrodlo), udzialy);
}

/** Dzieli rozwinięcie na panele w proporcjach lady: bok · front · bok. */
function tnijPanele(plotno, udzialy) {
  const suma = udzialy.reduce((a, b) => a + b, 0);
  let x = 0;
  const panele = udzialy.map((udzial) => {
    const szerokosc = Math.round((udzial / suma) * plotno.width);
    const kawalek = document.createElement('canvas');
    kawalek.width = szerokosc;
    kawalek.height = plotno.height;
    kawalek.getContext('2d').drawImage(plotno, x, 0, szerokosc, plotno.height,
                                       0, 0, szerokosc, plotno.height);
    x += szerokosc;
    return teksturaZPlotna(kawalek);
  });
  return { lewy: panele[0], front: panele[1], prawy: panele[2] };
}

/** Czy plik albo adres jest obrazem, a nie PDF-em. */
function toObraz(co) {
  return typeof co === 'string'
    ? /\.(png|jpe?g|webp)(\?|$)/i.test(co)
    : (co && typeof co.type === 'string' && co.type.startsWith('image/'));
}

/* ---------------------------------------------------------------- lada */

/** Grafika lady z rozwinięcia: bok lewy · front · bok prawy na jednym arkuszu.
 *
 *  Lada oklejana jest jednym wydrukiem owijającym trzy ściany, więc plik jest
 *  jeden, a podział wynika z proporcji samej lady — nie musi go nieść PDF.
 *  Każdy panel wycinamy do osobnej tekstury, bo trafia na inną ścianę bryły.
 */
async function ladaZPdf(zrodlo, udzialy) {
  const dokument = await pdfjs.getDocument(
    typeof zrodlo === 'string' ? { url: zrodlo } : { data: zrodlo }
  ).promise;
  const strona = await dokument.getPage(1);

  const arkusz = strona.getViewport({ scale: 1 });
  const plikSzer = arkusz.width * PT_NA_MM, plikWys = arkusz.height * PT_NA_MM;
  const skalaPliku = USTAWIENIA.skala ?? wykryjSkale(plikSzer, ARKUSZ_LADY);
  const spad = Math.min(USTAWIENIA.spad / skalaPliku, plikSzer / 6, plikWys / 6);

  const szerPliku = plikSzer - 2 * spad;
  const skala = USTAWIENIA.teksturaLadyPx / (szerPliku / PT_NA_MM);
  const widok = strona.getViewport({
    scale: skala,
    offsetX: -spad / PT_NA_MM * skala,
    offsetY: -spad / PT_NA_MM * skala,
  });

  const plotno = document.createElement('canvas');
  plotno.width = Math.round(szerPliku / PT_NA_MM * skala);
  plotno.height = Math.round((plikWys - 2 * spad) / PT_NA_MM * skala);
  const ctx = plotno.getContext('2d');
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, plotno.width, plotno.height);
  await strona.render({ canvasContext: ctx, viewport: widok }).promise;

  // podział na panele w proporcjach lady: bok · front · bok
  const suma = udzialy.reduce((a, b) => a + b, 0);
  let x = 0;
  const panele = udzialy.map((udzial) => {
    const szerokosc = Math.round((udzial / suma) * plotno.width);
    const kawalek = document.createElement('canvas');
    kawalek.width = szerokosc;
    kawalek.height = plotno.height;
    kawalek.getContext('2d').drawImage(plotno, x, 0, szerokosc, plotno.height,
                                       0, 0, szerokosc, plotno.height);
    x += szerokosc;
    const tekstura = new THREE.CanvasTexture(kawalek);
    tekstura.colorSpace = THREE.SRGBColorSpace;
    tekstura.anisotropy = 8;
    return tekstura;
  });
  return tnijPanele(plotno, udzialy);
}

async function wczytajPrzebarwiony(src, kolor) {
  const img = new Image();
  img.src = src;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = img.naturalWidth || 480;
  c.height = img.naturalHeight || 100;
  const x = c.getContext('2d');
  x.drawImage(img, 0, 0, c.width, c.height);
  if (kolor) {
    x.globalCompositeOperation = 'source-in';
    x.fillStyle = kolor;
    x.fillRect(0, 0, c.width, c.height);
  }
  return c;
}

/** Zapasowa grafika lady: logotyp na bieli. Używana, dopóki nie ma pliku
 *  `lada.pdf` — pusty biały korpus wyglądałby jak niedokończony model. */
async function teksturaLady() {
  try { await document.fonts.load('800 100px "Nunito Sans"'); } catch (e) {}
  const W = 1000, H = 1000;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const x = c.getContext('2d');
  x.fillStyle = PAPER; x.fillRect(0, 0, W, H);
  try {
    // logotyp w oryginalnym kolorze — front lady jest biały, więc nie ma po co
    // go przebarwiać
    const logo = await wczytajPrzebarwiony('assets/kongreserp-logo.webp', null);
    const lw = 620;
    x.drawImage(logo, (W - lw) / 2, 420, lw, lw * (147 / 326));
  } catch (e) {}
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/* ---------------------------------------------------------------- model */

const mat = {
  navy: new THREE.MeshStandardMaterial({ color: NAVY, roughness: 0.72, metalness: 0.05 }),
  gold: new THREE.MeshStandardMaterial({ color: GOLD, roughness: 0.45, metalness: 0.3 }),
  paper: new THREE.MeshStandardMaterial({ color: PAPER, roughness: 0.85, metalness: 0 }),
  stone: new THREE.MeshStandardMaterial({ color: STONE, roughness: 0.9, metalness: 0 }),
  steel: new THREE.MeshStandardMaterial({ color: '#8d94a3', roughness: 0.38, metalness: 0.35 }),
};
Object.entries(mat).forEach(([n, m]) => (m.name = n));

const box = (name, w, h, d, material, x, y, z) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.name = name;
  m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = true;
  return m;
};
const cyl = (name, rt, rb, h, material, x, y, z, seg = 48) => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), material);
  m.name = name;
  m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = true;
  return m;
};

function hoker(label, x, z) {
  const g = new THREE.Group();
  g.name = label;
  g.add(cyl(label + '_siedzisko', 0.2, 0.2, 0.07, mat.navy, 0, 0.75, 0));
  g.add(cyl(label + '_kolumna', 0.032, 0.032, 0.72, mat.steel, 0, 0.375, 0));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.012, 16, 48), mat.steel);
  ring.name = label + '_podnozek';
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.24;
  ring.castShadow = true;
  g.add(ring);
  g.add(cyl(label + '_podstawa', 0.2, 0.21, 0.03, mat.steel, 0, 0.035, 0));
  g.position.set(x, 0.02, z);
  return g;
}

/** Stolik koktajlowy w pokrowcu stretch — ten z targowych zdjęć.
 *
 *  Pokrowiec obciska blat i rozszerza się ku podłodze, więc sylwetka nie jest
 *  walcem: rysujemy ją obrotem profilu (talia w połowie wysokości), a nie
 *  składanką cylindrów. Z trzech metrów widać właśnie ten kształt.
 */
function stolikKoktajlowy(nazwa, kolor, x, z) {
  const WYS = 1.10, PROMIEN = 0.30, HEM = 0.13;

  // Sylwetka pokrowca: blat na pełnej średnicy, mocne przewężenie tuż pod nim
  // i rozejście ku podłodze. Talia siedzi wysoko — to ona robi ten kształt,
  // nie samo zwężenie u dołu.
  const profil = [
    new THREE.Vector2(0.001, 0),
    new THREE.Vector2(PROMIEN * 1.00, 0),
    new THREE.Vector2(PROMIEN * 0.92, WYS * 0.18),
    new THREE.Vector2(PROMIEN * 0.75, WYS * 0.45),
    new THREE.Vector2(PROMIEN * 0.62, WYS * 0.70),
    new THREE.Vector2(PROMIEN * 0.72, WYS * 0.85),
    new THREE.Vector2(PROMIEN * 0.93, WYS * 0.96),
    new THREE.Vector2(PROMIEN, WYS - 0.012),
    new THREE.Vector2(PROMIEN, WYS),
    new THREE.Vector2(0.001, WYS),
  ];

  const geometria = new THREE.LatheGeometry(profil, 72);

  // Dół pokrowca nie jest równy: materiał opada na cztery narożniki, a między
  // nimi podwija się w łuki. Podnosimy więc brzeg funkcją kąta — bryła obrotowa
  // sama z siebie tego nie zrobi, bo jest symetryczna.
  const pozycje = geometria.attributes.position;
  for (let i = 0; i < pozycje.count; i++) {
    const y = pozycje.getY(i);
    if (y >= HEM * 2.2) continue;
    const kat = Math.atan2(pozycje.getZ(i), pozycje.getX(i));
    const luk = (HEM * (1 - Math.cos(4 * kat))) / 2;      // 0 na nóżkach, HEM między nimi
    pozycje.setY(i, y + luk * Math.max(0, 1 - y / (HEM * 2.2)));
  }
  geometria.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    color: kolor, roughness: 0.95, metalness: 0, side: THREE.DoubleSide,
  });
  material.name = 'pokrowiec_stolika';
  const mesh = new THREE.Mesh(geometria, material);
  mesh.name = nazwa + '_pokrowiec';
  mesh.castShadow = mesh.receiveShadow = true;

  const grupa = new THREE.Group();
  grupa.name = nazwa;
  grupa.add(mesh);
  grupa.position.set(x, 0.02, z);
  return grupa;
}

/** Rollup 100 × 200 cm: kaseta, maszt i napięta grafika.
 *  Grafika zaczyna się nad kasetą, bo dolny pas taśmy chowa się w środku. */
function rollupMesh(grafika, szer, wys, x, z) {
  const KASETA_H = 0.09, KASETA_D = 0.24;
  const grupa = new THREE.Group();
  grupa.name = 'rollup';
  grupa.add(box('rollup_kaseta', szer + 0.04, KASETA_H, KASETA_D, mat.steel, 0, KASETA_H / 2, 0));
  grupa.add(cyl('rollup_maszt', 0.012, 0.012, wys, mat.steel, szer / 2 - 0.03,
                KASETA_H + wys / 2, -KASETA_D / 4));
  const plansza = new THREE.Mesh(
    new THREE.PlaneGeometry(szer, wys),
    new THREE.MeshStandardMaterial({
      color: PAPER, roughness: 0.92, metalness: 0, map: grafika || null,
      side: THREE.DoubleSide,
    })
  );
  plansza.name = 'rollup_wydruk';
  plansza.material.name = 'wydruk_rollup';
  plansza.position.set(0, KASETA_H + wys / 2, 0.004);
  plansza.castShadow = plansza.receiveShadow = true;
  grupa.add(plansza);
  grupa.position.set(x, 0.02, z);
  return grupa;
}

/** Sześć materiałów bryły korpusu w kolejności three.js: prawa, lewa, góra,
 *  dół, front, tył. Wydruk trafia na trzy ściany widoczne z alejki; blat
 *  i tył zostają białe, bo tam oklejki nie widać. */
function materialyLady(grafika) {
  const plaski = (mapa) => new THREE.MeshStandardMaterial({
    color: PAPER, roughness: 0.85, metalness: 0, map: mapa || null,
  });
  const front = plaski(grafika ? grafika.front : null);
  front.name = 'wydruk_lada_front';
  const prawy = plaski(grafika ? grafika.prawy : null);
  prawy.name = 'wydruk_lada_bok_prawy';
  const lewy = plaski(grafika ? grafika.lewy : null);
  lewy.name = 'wydruk_lada_bok_lewy';
  const goly = plaski(null);
  goly.name = 'lada_bok';
  return [prawy, lewy, goly, goly, front, goly];
}

/** Całe stoisko: podłoga, ścianka z planszą na ramie, lada, hokery, stolik. */
function stoisko(plansza, grafikaLady) {
  const W = plansza.szer * MM, WALL_H = plansza.wys * MM, D = USTAWIENIA.glebokosc / 100;
  const WALL_T = 0.1;
  const kolumny = USTAWIENIA.kolumny ?? Math.max(1, Math.round(plansza.szer / MODUL.szer));
  const wiersze = USTAWIENIA.wiersze ?? Math.max(1, Math.round(plansza.wys / MODUL.wys));

  const grupa = new THREE.Group();
  grupa.name = 'stoisko_kongreserp';
  grupa.add(box('podloga', W, 0.02, D, mat.stone, 0, 0.01, 0));

  // ścianka: rama w kolorze marki, na niej napięta tkanina z planszy
  const wallZ = -D / 2 + WALL_T / 2;
  grupa.add(box('scianka_rama', W, WALL_H, WALL_T, mat.navy, 0, WALL_H / 2, wallZ));
  // Nadruk leży na czole ramy, czyli na dwóch niemal pokrywających się
  // płaszczyznach. Samo odsunięcie nie wystarcza: przy płaskim kącie bufor
  // głębokości nie odróżnia ich i wydruk miga paskami. Stąd większa szczelina
  // i polygonOffset, który przy rysowaniu dokłada nadrukowi pierwszeństwo.
  const tkanina = new THREE.Mesh(
    new THREE.PlaneGeometry(W - 0.02, WALL_H - 0.02),
    new THREE.MeshStandardMaterial({
      color: PAPER, roughness: 0.9, metalness: 0, map: plansza.tekstura,
      polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -8,
    })
  );
  tkanina.name = 'scianka_wydruk';
  tkanina.material.name = 'wydruk_scianka';
  tkanina.position.set(0, WALL_H / 2, wallZ + WALL_T / 2 + 0.006);
  tkanina.receiveShadow = true;
  grupa.add(tkanina);

  // aluminiowe profile ramek — to one zjadają szczeliny w grafice
  // Profil wystaje przed tkaninę wyraźnie — inaczej nadruk, który ma
  // pierwszeństwo w rysowaniu, przykryłby szczeliny między ramkami.
  const PR = 0.01, PRD = WALL_T + 0.03;
  const modulSzer = W / kolumny, modulWys = WALL_H / wiersze;
  // Profile skrajne siedzą OKRAKIEM na krawędzi ścianki, nie tuż przy niej.
  // Wsunięte do środka miały boczną ścianę dokładnie w płaszczyźnie boku ramy
  // i przy płaskim kącie obie migotały — bufor głębokości nie ma czym ich
  // rozróżnić. Okrakiem wygląda zresztą jak prawdziwa rama: profil obejmuje
  // brzeg tkaniny.
  for (let c = 0; c <= kolumny; c++) {
    grupa.add(box('profil_pion_' + c, PR, WALL_H + PR, PRD, mat.steel,
      -W / 2 + c * modulSzer, WALL_H / 2, wallZ));
  }
  for (let r = 0; r <= wiersze; r++) {
    grupa.add(box('profil_poziom_' + r, W + PR, PR, PRD, mat.steel, 0, r * modulWys, wallZ));
  }

  // lada 100 × 50 × 100 cm przy lewej krawędzi, front do alejki.
  // Każdy mebel jest osobną grupą — dzięki temu daje się złapać i przestawić
  // w całości, razem z nadrukiem na froncie.
  const CW = 1.0, CD = 0.5, CH = 1.0, CX = -W / 2 + 0.6, CZ = D / 2 - CD / 2;
  const lada = new THREE.Group();
  lada.name = 'lada';
  // Korpus niesie wydruk na trzech ścianach naraz, każdą własnym materiałem —
  // tak jak owija go prawdziwa oklejka. Osobna płaszczyzna na froncie byłaby
  // kolejną parą pokrywających się ścian.
  const korpus = new THREE.Mesh(
    new THREE.BoxGeometry(CW, CH - 0.08, CD),
    materialyLady(grafikaLady)
  );
  korpus.name = 'lada_korpus';
  korpus.position.set(0, 0.08 + (CH - 0.08) / 2, 0);
  korpus.castShadow = korpus.receiveShadow = true;
  lada.add(korpus);
  lada.add(box('lada_cokol', CW, 0.06, CD, mat.gold, 0, 0.05, 0));
  lada.add(box('lada_blat', CW + 0.04, 0.04, CD + 0.04, mat.paper, 0, CH + 0.02, 0));
  lada.position.set(CX, 0, CZ);
  grupa.add(lada);

  // strefa rozmowy: dwa hokery i stolik, wysokość blatu 105 cm
  const hoker1 = hoker('hoker_1', CX + 1.08, 0.22);
  const hoker2 = hoker('hoker_2', CX + 2.18, 0.22);
  grupa.add(hoker1, hoker2);
  const stolik = new THREE.Group();
  stolik.name = 'stolik';
  stolik.add(cyl('stolik_blat', 0.28, 0.28, 0.04, mat.navy, 0, 1.03, 0));
  stolik.add(cyl('stolik_kolumna', 0.035, 0.035, 1.01, mat.steel, 0, 0.505, 0));
  stolik.add(cyl('stolik_podstawa', 0.24, 0.26, 0.03, mat.steel, 0, 0.035, 0));
  stolik.position.set(CX + 1.63, 0.02, -0.16);
  grupa.add(stolik);

  return {
    grupa, kolumny, wiersze,
    meble: [lada, hoker1, hoker2, stolik],
    grupyMebli: { lada: [lada], stolik: [stolik], hokery: [hoker1, hoker2] },
    obszar: { W, D, sciankaZ: wallZ + WALL_T / 2 },
  };
}

/** Stoisko srebrne: 150 × 70 cm, rollup zamiast ścianki i stolik koktajlowy
 *  zamiast lady. Mniejszy pakiet na krótkie rozmowy przy alejce. */
function stoiskoSrebrne(grafikaRollupa) {
  const W = SREBRNE.szer, D = SREBRNE.glebokosc;
  const grupa = new THREE.Group();
  grupa.name = 'stoisko_kongreserp_srebrne';
  grupa.add(box('podloga', W, 0.02, D, mat.stone, 0, 0.01, 0));

  // Układ wyjściowy: rollup przy lewej krawędzi, tyłem do alejki; stolik
  // w prawym narożniku, wysunięty do przodu. Na 150 × 70 cm oba nie zmieszczą
  // się obok siebie w jednej linii, więc stolik stoi przed rollupem — tak jak
  // stoi naprawdę.
  const rollup = rollupMesh(grafikaRollupa, SREBRNE.rollupSzer, SREBRNE.rollupWys,
                            -W / 2 + SREBRNE.rollupSzer / 2, -D / 2 + 0.14);
  const stolik = stolikKoktajlowy('stolik', SREBRNE.kolorStolika,
                                  W / 2 - 0.30, D / 2 - 0.30);
  grupa.add(rollup, stolik);

  return {
    grupa, kolumny: 1, wiersze: 1,
    meble: [rollup, stolik],
    grupyMebli: { rollup: [rollup], stolik: [stolik] },
    obszar: { W, D, sciankaZ: -D / 2 },
  };
}

/* ---------------------------------------------------------------- meble */

/** Przestawianie mebli wskaźnikiem po podłodze stoiska.
 *
 * Ustawienie mebli to pierwsze pytanie, jakie pada przy stoisku: czy lada ma
 * stać przy wejściu, czy w głębi. Zamiast wersjonować to w kodzie, pozwalamy
 * przesunąć meble na scenie. Ruch jest tylko w płaszczyźnie podłogi i wyłącznie
 * w granicach stoiska — mebel nie wejdzie w ściankę ani nie wyjedzie w alejkę.
 */
function przygotujPrzesuwanie() {
  const canvas = stage.canvas;
  const promien = new THREE.Raycaster();
  const wskaznik = new THREE.Vector2();
  const podloga = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const punkt = new THREE.Vector3();
  const uchwyt = new THREE.Vector3();
  let ciagniety = null;

  // Model wymienia się przy każdej nowej planszy, a nasłuchy zakładamy raz —
  // stąd stan trzymany obok, a nie w domknięciu jednego modelu.
  let stan = null;
  const zakres = (wartosc, lo, hi) => Math.min(hi, Math.max(lo, wartosc));

  function podepnij(model) {
    stan = {
      obszar: model.obszar,
      start: new Map(model.meble.map((m) => [m, m.position.clone()])),
      zasieg: new Map(model.meble.map((m) => {
        const rozmiar = new THREE.Box3().setFromObject(m).getSize(new THREE.Vector3());
        return [m, { x: rozmiar.x / 2, z: rozmiar.z / 2 }];
      })),
      meble: model.meble,
    };
    ciagniety = null;
  }

  function celuj(e) {
    const r = canvas.getBoundingClientRect();
    wskaznik.set(((e.clientX - r.left) / r.width) * 2 - 1,
                 -((e.clientY - r.top) / r.height) * 2 + 1);
    promien.setFromCamera(wskaznik, stage.camera);
  }

  function pod(e) {
    if (!stan) return null;
    celuj(e);
    const trafienia = promien.intersectObjects(stan.meble, true);
    if (!trafienia.length) return null;
    for (let o = trafienia[0].object; o; o = o.parent) if (stan.start.has(o)) return o;
    return null;
  }

  canvas.addEventListener('pointerdown', (e) => {
    const mebel = pod(e);
    if (!mebel) return;
    ciagniety = mebel;
    stage.controls.enabled = false;
    stage.controls.autoRotate = false;
    // przechwycenie wskaźnika bywa niedostępne (zdarzenia syntetyczne,
    // starsze przeglądarki) — przeciąganie działa też bez niego
    try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
    promien.ray.intersectPlane(podloga, punkt);
    uchwyt.subVectors(mebel.position, punkt);
    canvas.style.cursor = 'grabbing';
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!ciagniety) {
      canvas.style.cursor = pod(e) ? 'grab' : '';
      return;
    }
    celuj(e);
    if (!promien.ray.intersectPlane(podloga, punkt)) return;
    punkt.add(uchwyt);
    // Trzymamy w granicach ŚRODEK mebla, nie jego obrys: lada ma dojechać
    // do samej krawędzi stoiska, a nawet wystawać poza podest, bo tak się ją
    // czasem ustawia — przy narożniku, bokiem do alejki.
    const { W, D, sciankaZ } = stan.obszar;
    ciagniety.position.x = zakres(punkt.x, -W / 2, W / 2);
    ciagniety.position.z = zakres(punkt.z, sciankaZ + stan.zasieg.get(ciagniety).z, D / 2);
  });

  const koniec = (e) => {
    if (!ciagniety) return;
    ciagniety = null;
    stage.controls.enabled = true;
    canvas.style.cursor = 'grab';
    try {
      if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    } catch (err) {}
  };
  canvas.addEventListener('pointerup', koniec);
  canvas.addEventListener('pointercancel', koniec);

  const przywroc = () => stan && stan.start.forEach((p, mebel) => mebel.position.copy(p));
  return { podepnij, przywroc };
}

/** Zawęża zakres bufora głębokości do rozmiarów stoiska.
 *
 *  Scena ustawia far sto razy dalej niż kamera stoi — z zapasem na obiekty
 *  o nieznanej skali. Tu skala jest znana i mieści się w kilku metrach, więc
 *  bliższa płaszczyzna odcięcia zostawia całą precyzję tam, gdzie nadruk
 *  spotyka się z ramą.
 */
function dociagnijGlebie() {
  const kamera = stage.camera;
  if (!kamera) return;
  const dystans = kamera.position.length();
  kamera.near = Math.max(0.2, dystans / 20);
  kamera.far = dystans * 6;
  kamera.updateProjectionMatrix();
}

/** Ustawia kamerę na zadany punkt widzenia — do kadru startowego wariantu. */
function ustawKadr(x, y, z, celX, celY, celZ) {
  const kamera = stage.camera, sterowanie = stage.controls;
  if (!kamera || !sterowanie) return;
  kamera.position.set(x, y, z);
  sterowanie.target.set(celX, celY, celZ);
  sterowanie.update();
}

/* ---------------------------------------------------------------- strona */

const elDane = document.getElementById('dane');
const elPlik = document.getElementById('plik');
const elTytul = document.getElementById('tytul');
const panel = document.getElementById('panel');
// Front z logotypem to stan wyjściowy; własna oklejka wchodzi z pliku.
const zapasowaLada = { front: await teksturaLady(), lewy: null, prawy: null };
let grafikaLady = zapasowaLada;

/** Proporcje rozwinięcia lady: bok · front · bok. */
const UDZIALY_LADY = [0.5, 1.0, 0.5];

async function wczytajLade(zrodlo, nazwa) {
  grafikaLady = toObraz(zrodlo) || toObraz(nazwa)
    ? await ladaZObrazu(zrodlo, UDZIALY_LADY) : await ladaZPdf(zrodlo, UDZIALY_LADY);
  nazwaLady = nazwa;
  if (ostatni) await pokaz(ostatni.zrodlo, ostatni.nazwa);
}
let nazwaLady = null;

const cm = (mm) => (mm / 10).toFixed(0);

/* Język: z adresu (?lang=cs), z poprzedniej wizyty albo polski. Przełącznik
   podmienia teksty w miejscu — jedna strona, trzy wersje, żaden plik nie jest
   tłumaczony dwa razy. */
let jezyk = wybierzJezyk();
let ostatni = null;        // ostatnio pokazana plansza, do przeliczenia opisu
let ostatniBlad = null;    // albo to, czego nie udało się wczytać

function wybierzJezyk() {
  const zAdresu = (param.get('lang') || '').toLowerCase();
  let zapamietany = null;
  try { zapamietany = localStorage.getItem('jezyk'); } catch (e) {}
  const kody = JEZYKI.map((j) => j.kod);
  return kody.includes(zAdresu) ? zAdresu
    : kody.includes(zapamietany) ? zapamietany : 'pl';
}

const t = () => TEKSTY[jezyk];

function zastosujJezyk() {
  const teksty = t();
  const opisJezyka = JEZYKI.find((j) => j.kod === jezyk);
  document.documentElement.lang = opisJezyka.html;
  document.title = teksty.tytulStrony;
  document.querySelectorAll('[data-t]').forEach((el) => {
    const wartosc = teksty[el.dataset.t];
    if (typeof wartosc === 'string') el.textContent = wartosc;
  });
  document.querySelectorAll('#jezyki button').forEach((b) => {
    b.setAttribute('aria-current', String(b.dataset.jezyk === jezyk));
  });
  if (stage.setLabels) {
    stage.setLabels({ note: teksty.sterowanie, obj: teksty.eksportObj, glb: teksty.eksportGlb });
  }
  if (wariant === 'srebrny' && model) opiszSrebrne();
  else if (ostatni) opisz(ostatni.plansza, ostatni.model, ostatni.nazwa);
  else if (ostatniBlad) {
    bladPliku(ostatniBlad.nazwa, ostatniBlad.brakPliku);
    elTytul.textContent = teksty.tytulBezPlanszy;
  } else elTytul.textContent = teksty.tytulDomyslny;
}

function opisz(plansza, model, nazwa, zrodlo) {
  ostatni = { plansza, model, nazwa, zrodlo: zrodlo ?? (ostatni && ostatni.zrodlo) };
  ostatniBlad = null;
  const teksty = t();
  elTytul.textContent = teksty.tytulScianki(cm(plansza.szer), cm(plansza.wys));
  elDane.innerHTML = [
    [teksty.ramki, teksty.ramkiWartosc(model.kolumny * model.wiersze,
      cm(plansza.szer / model.kolumny), cm(plansza.wys / model.wiersze))],
    [teksty.powierzchnia, `${cm(plansza.szer)} × ${USTAWIENIA.glebokosc} cm`],
    [teksty.lada, teksty.ladaWartosc],
    [teksty.siedziska, teksty.siedziskaWartosc],
  ].map(([etykieta, wartosc]) => `<div><span>${etykieta}</span><b>${wartosc}</b></div>`).join('');
  elPlik.classList.remove('blad');
  elPlik.innerHTML = teksty.plansza(nazwa) + '<br>' +
    (plansza.obrazPx
      ? teksty.obraz(plansza.obrazPx[0], plansza.obrazPx[1])
      : teksty.arkusz(cm(plansza.arkuszSzer), cm(plansza.arkuszWys), plansza.spad)) +
    (plansza.skalaPliku === 1 ? ''
      : '<br>' + teksty.skala(plansza.skalaPliku,
          Math.round(plansza.plikSzer), Math.round(plansza.plikWys))) +
    (nazwaLady ? '<br>' + teksty.ladaPlik(nazwaLady) : '');
}

function bladPliku(nazwa, brakPliku) {
  ostatni = null;
  ostatniBlad = { nazwa, brakPliku };
  const teksty = t();
  elPlik.classList.add('blad');
  elPlik.innerHTML = teksty.blad(nazwa, brakPliku ? teksty.powodBrak : teksty.powodOtwarcie)
    + '<br>' + teksty.bladRada;
}

const przesuwanie = przygotujPrzesuwanie();

/* Wyposażenie da się zdjąć ze stoiska — pusta ścianka pokazuje samą planszę,
   a to jej dotyczy większość rozmów o projekcie. Wybór trzyma się między
   planszami, bo przy każdej nowej model powstaje od zera. */
const widoczne = { lada: true, stolik: true, hokery: true, rollup: true };
let model = null;

/* Dwa pakiety stoiska: złoty (ścianka 300 × 250 i lada) oraz srebrny
   (rollup 100 × 200 i stolik koktajlowy na 150 × 70 cm). Wybór zostaje
   w przeglądarce, bo zwykle ogląda się jeden z nich przez całą rozmowę. */
let wariant = wybierzWariant();
let grafikaRollupa = null;
let nazwaRollupa = null;

function wybierzWariant() {
  const zAdresu = (param.get('wariant') || '').toLowerCase();
  let zapamietany = null;
  try { zapamietany = localStorage.getItem('wariant'); } catch (e) {}
  return ['zloty', 'srebrny'].includes(zAdresu) ? zAdresu
    : ['zloty', 'srebrny'].includes(zapamietany) ? zapamietany : 'zloty';
}

function zastosujWidocznosc() {
  if (!model) return;
  for (const [nazwa, meble] of Object.entries(model.grupyMebli)) {
    meble.forEach((m) => (m.visible = widoczne[nazwa]));
  }
}

async function pokaz(zrodlo, nazwa) {
  const plansza = toObraz(zrodlo) || toObraz(nazwa)
    ? await planszaZObrazu(zrodlo) : await planszaZPdf(zrodlo);
  model = stoisko(plansza, grafikaLady);
  stage.setObject(model.grupa);
  dociagnijGlebie();
  przesuwanie.podepnij(model);
  zastosujWidocznosc();
  opisz(plansza, model, nazwa, zrodlo);
}

function opiszSrebrne() {
  const teksty = t();
  const cmv = (m) => (m * 100).toFixed(0);
  elTytul.textContent = teksty.tytulRollupa(cmv(SREBRNE.rollupSzer), cmv(SREBRNE.rollupWys));
  elDane.innerHTML = [
    [teksty.rollup, `${cmv(SREBRNE.rollupSzer)} × ${cmv(SREBRNE.rollupWys)} cm`],
    [teksty.powierzchnia, `${cmv(SREBRNE.szer)} × ${cmv(SREBRNE.glebokosc)} cm`],
    [teksty.stolikEtykieta, teksty.stolikWartosc],
  ].map(([etykieta, wartosc]) => `<div><span>${etykieta}</span><b>${wartosc}</b></div>`).join('');
  elPlik.classList.remove('blad');
  elPlik.innerHTML = nazwaRollupa
    ? teksty.rollupPlik(nazwaRollupa)
    : teksty.rollupBrak;
}

async function pokazSrebrne() {
  model = stoiskoSrebrne(grafikaRollupa);
  stage.setObject(model.grupa);
  dociagnijGlebie();
  // Kadr startowy z prawej strony: stolik stoi przed rollupem, więc widok
  // wprost zasłaniałby grafikę. Scena kadruje sama, ale nie wie, co tu jest
  // ważniejsze.
  ustawKadr(2.45, 1.85, 3.25, 0.05, 1.0, 0);
  przesuwanie.podepnij(model);
  zastosujWidocznosc();
  ostatni = null;
  opiszSrebrne();
}

async function wczytajRollup(zrodlo, nazwa) {
  const grafika = toObraz(zrodlo) || toObraz(nazwa)
    ? await planszaZObrazu(zrodlo) : await planszaZPdf(zrodlo);
  grafikaRollupa = grafika.tekstura;
  nazwaRollupa = nazwa;
  if (wariant === 'srebrny') await pokazSrebrne();
}

async function przelaczWariant(nowy) {
  wariant = nowy;
  try { localStorage.setItem('wariant', nowy); } catch (e) {}
  document.body.classList.toggle('wariant-srebrny', nowy === 'srebrny');
  document.body.classList.toggle('wariant-zloty', nowy === 'zloty');
  document.querySelectorAll('[data-wariant]').forEach((b) => {
    b.setAttribute('aria-current', String(b.dataset.wariant === nowy));
  });
  if (nowy === 'srebrny') await pokazSrebrne();
  else await pokaz(USTAWIENIA.plik, USTAWIENIA.plik).catch(() => {});
}

async function pokazPlik(plik) {
  try {
    await pokaz(toObraz(plik) ? plik : new Uint8Array(await plik.arrayBuffer()), plik.name);
  } catch (err) {
    bladPliku(plik.name, false);
  }
}

const przelacznikJezykow = document.getElementById('jezyki');
przelacznikJezykow.innerHTML = JEZYKI.map((j) =>
  `<button type="button" data-jezyk="${j.kod}" aria-current="false">${j.etykieta}</button>`).join('');
przelacznikJezykow.addEventListener('click', (e) => {
  const kod = e.target.dataset && e.target.dataset.jezyk;
  if (!kod || kod === jezyk) return;
  jezyk = kod;
  try { localStorage.setItem('jezyk', kod); } catch (err) {}
  zastosujJezyk();
});
zastosujJezyk();

// Oklejka lady jest opcjonalna: bez pliku zostaje front z logotypem.
try {
  grafikaLady = toObraz(USTAWIENIA.lada)
    ? await ladaZObrazu(USTAWIENIA.lada, UDZIALY_LADY)
    : await ladaZPdf(USTAWIENIA.lada, UDZIALY_LADY);
  nazwaLady = USTAWIENIA.lada;
} catch (e) {
  grafikaLady = zapasowaLada;
}

try {
  const grafika = await planszaZPdf(USTAWIENIA.rollup);
  grafikaRollupa = grafika.tekstura;
  nazwaRollupa = USTAWIENIA.rollup;
} catch (e) {
  grafikaRollupa = null;
}

document.querySelectorAll('[data-wariant]').forEach((b) => {
  b.addEventListener('click', () => przelaczWariant(b.dataset.wariant));
});
document.body.classList.add(wariant === 'srebrny' ? 'wariant-srebrny' : 'wariant-zloty');
document.querySelectorAll('[data-wariant]').forEach((b) => {
  b.setAttribute('aria-current', String(b.dataset.wariant === wariant));
});

if (wariant === 'srebrny') {
  await pokazSrebrne();
}

try {
  if (wariant === 'zloty') await pokaz(USTAWIENIA.plik, USTAWIENIA.plik);
} catch (e) {
  bladPliku(USTAWIENIA.plik, e && e.name === 'MissingPDFException');
  // ścianka bez grafiki, żeby było widać samą konstrukcję
  const zastepcza = { tekstura: null, szer: 3000, wys: 2500, arkuszSzer: 3000, arkuszWys: 2500, spad: 0 };
  model = stoisko(zastepcza, grafikaLady);
  stage.setObject(model.grupa);
  przesuwanie.podepnij(model);
  zastosujWidocznosc();
  elTytul.textContent = t().tytulBezPlanszy;
}

/* Wybór pliku z dysku — to samo co upuszczenie, tylko dla tych, którzy wolą kliknąć. */
const wybor = document.getElementById('wybor');
document.getElementById('wczytaj').addEventListener('click', () => wybor.click());
wybor.addEventListener('change', () => {
  if (wybor.files[0]) pokazPlik(wybor.files[0]);
});

const wyborLady = document.getElementById('wyborLady');
document.getElementById('wczytajLade').addEventListener('click', () => wyborLady.click());
wyborLady.addEventListener('change', async () => {
  const plik = wyborLady.files[0];
  if (!plik) return;
  try {
    await wczytajLade(toObraz(plik) ? plik : new Uint8Array(await plik.arrayBuffer()), plik.name);
  } catch (err) {
    bladPliku(plik.name, false);
  }
});

const wyborRollupa = document.getElementById('wyborRollupa');
document.getElementById('wczytajRollup').addEventListener('click', () => wyborRollupa.click());
wyborRollupa.addEventListener('change', async () => {
  const plik = wyborRollupa.files[0];
  if (!plik) return;
  try {
    await wczytajRollup(toObraz(plik) ? plik : new Uint8Array(await plik.arrayBuffer()), plik.name);
  } catch (err) {
    bladPliku(plik.name, false);
  }
});

document.getElementById('przywroc').addEventListener('click', () => przesuwanie.przywroc());

document.querySelectorAll('[data-mebel]').forEach((chip) => {
  chip.addEventListener('click', () => {
    const nazwa = chip.dataset.mebel;
    widoczne[nazwa] = !widoczne[nazwa];
    chip.setAttribute('aria-pressed', String(widoczne[nazwa]));
    zastosujWidocznosc();
  });
});

document.getElementById('przelacznik').addEventListener('click', (e) => {
  const otwarty = panel.classList.toggle('otwarty');
  e.currentTarget.setAttribute('aria-expanded', String(otwarty));
});

/* Podgląd innej planszy bez wdrożenia: upuszczenie PDF-a na stronę. */
const koniecPrzeciagania = () => document.body.classList.remove('przeciaga');
document.addEventListener('dragover', (e) => {
  e.preventDefault();
  document.body.classList.add('przeciaga');
});
document.addEventListener('dragleave', (e) => { if (!e.relatedTarget) koniecPrzeciagania(); });
document.addEventListener('drop', async (e) => {
  e.preventDefault();
  koniecPrzeciagania();
  const plik = [...(e.dataTransfer?.files || [])]
    .find((f) => f.type === 'application/pdf' || toObraz(f));
  if (plik) await pokazPlik(plik);
});
