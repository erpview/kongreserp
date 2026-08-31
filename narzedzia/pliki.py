#!/usr/bin/env python3
"""
Generator plików stoiska KongresERP: grafika wyjściowa i szablony do projektowania.

Cztery pliki, wszystkie w skali 1:1, wszystkie z jednego źródła prawdy — wymiarów
konstrukcji zapisanych niżej:

    plansza.pdf          granatowa ścianka z logo, punkt wyjścia wizualizacji
    lada.pdf             oklejka lady: bok · front · bok na jednym arkuszu
    szablon-planszy.pdf  podkład dla grafika: ramki, szczeliny, strefy, linia wzroku
    szablon-lady.pdf     podkład lady: panele, zagięcia, pola zakryte

    python3 narzedzia/pliki.py             # wszystkie cztery
    python3 narzedzia/pliki.py plansza     # tylko wybrany

Render idzie przez headless Chrome (`--print-to-pdf`), bo strona i tak renderuje
PDF-y w przeglądarce — ten sam silnik po obu stronach znaczy, że podgląd wygląda
jak wydruk. Rozmiar arkusza pilnuje reguła `@page`.
"""

import subprocess
import sys
import tempfile
from pathlib import Path

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
KORZEN = Path(__file__).resolve().parent.parent
LOGO = KORZEN / "assets" / "kongreserp-logo.webp"

# ---------------------------------------------------------------- marka
GRANAT = "#101b3a"       # neutralny granat ścianki
AKCENT = "#0026ff"       # niebieski z logotypu
BIEL = "#ffffff"
SZARY = "rgba(255,255,255,.62)"
FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif'

# ---------------------------------------------------------------- konstrukcja
SCIANKA = {
    "szer": 3000, "wys": 2500,      # mm
    "kolumny": 3, "wiersze": 2,      # ramki 1000 × 1250 mm
    "szczelina": 10,                 # widoczny profil aluminiowy
    "spad": 30,                      # zawinięcie w kanał silikonowy
    "bezpieczna": 60,
    "wzrok": 1600,                   # linia wzroku nad podłogą
    "zaslona": (100, 1100, 1000),    # lada i hokery: od, do, wysokość
}

LADA = {
    "front": 1000, "bok": 500, "wys": 1000,
    "spad": 30, "bezpieczna": 40,
    "cokol": 60,                     # pas akcentu u dołu, zakryty
    "blat": 40,                      # blat nachodzi na górną krawędź
}

MIN_SCIANKA_MM = 20   # próg czytelności z trzech metrów
MIN_LADA_MM = 12      # lada czytana z półtora metra


def strona(szer: float, wys: float, tresc: str) -> str:
    """Arkusz o zadanym rozmiarze w milimetrach, bez marginesu drukarki."""
    return f"""<!DOCTYPE html><html lang="pl"><head><meta charset="utf-8">
<style>
  @page {{ size: {szer}mm {wys}mm; margin: 0 }}
  html, body {{ margin: 0; padding: 0 }}
  .arkusz {{ position: relative; width: {szer}mm; height: {wys}mm; overflow: hidden;
             background: {GRANAT}; color: {BIEL}; font-family: {FONT} }}
  .arkusz * {{ box-sizing: border-box }}
</style></head><body><div class="arkusz">{tresc}</div></body></html>"""


def logo(szerokosc_mm: float, x_mm: float, y_mm: float, biel: bool = True) -> str:
    """Logotyp w podanej szerokości. Na granacie idzie w kontrze — biały —
    bo logotyp w oryginalnym niebieskim ginie na ciemnym tle."""
    filtr = "filter:brightness(0) invert(1);" if biel else ""
    return (f'<img src="{LOGO.as_uri()}" alt="KongresERP" '
            f'style="position:absolute;left:{x_mm}mm;top:{y_mm}mm;width:{szerokosc_mm}mm;'
            f'{filtr}display:block">')


def napis(x: float, y: float, tekst: str, rozmiar: float = 11, kolor: str = SZARY,
          waga: int = 800, odstep: str = ".1em") -> str:
    return (f'<div style="position:absolute;left:{x}mm;top:{y}mm;font-size:{rozmiar}mm;'
            f'font-weight:{waga};letter-spacing:{odstep};text-transform:uppercase;'
            f'color:{kolor};white-space:nowrap">{tekst}</div>')


def prostokat(x: float, y: float, szer: float, wys: float, styl: str) -> str:
    return (f'<div style="position:absolute;left:{x}mm;top:{y}mm;'
            f'width:{szer}mm;height:{wys}mm;{styl}"></div>')


def kreskowanie(x: float, y: float, szer: float, wys: float, opis: str, skok: int = 16) -> str:
    return (
        prostokat(x, y, szer, wys,
                  f'background:repeating-linear-gradient(45deg,rgba(255,255,255,.10) 0 {skok / 2}mm,'
                  f'transparent {skok / 2}mm {skok}mm);outline:.6mm solid rgba(255,255,255,.25)')
        + napis(x + 8, y + max(wys / 2 - 6, 3), opis, 10)
    )


# ---------------------------------------------------------------- ścianka
def plansza() -> str:
    g = SCIANKA
    s = g["spad"]
    modul_szer = g["szer"] / g["kolumny"]
    # Logotyp mieści się w jednej ramce i siada na linii wzroku — przez szczelinę
    # profilu nic nie przechodzi, bo tam grafika znika pod aluminium.
    szer_logo = modul_szer - 2 * g["bezpieczna"] - 40
    wys_logo = szer_logo * 147 / 326
    x = s + modul_szer + (modul_szer - szer_logo) / 2
    y = s + g["wys"] - g["wzrok"] - wys_logo / 2
    return strona(g["szer"] + 2 * s, g["wys"] + 2 * s, logo(szer_logo, x, y))


def szablon_planszy() -> str:
    g = SCIANKA
    s, m = g["spad"], g["bezpieczna"]
    modul_szer, modul_wys = g["szer"] / g["kolumny"], g["wys"] / g["wiersze"]
    el = [prostokat(s, s, g["szer"], g["wys"], "outline:1mm solid rgba(255,255,255,.45)")]

    for c in range(1, g["kolumny"]):
        el.append(prostokat(s + c * modul_szer - g["szczelina"] / 2, s,
                            g["szczelina"], g["wys"], "background:rgba(255,255,255,.3)"))
    for r in range(1, g["wiersze"]):
        el.append(prostokat(s, s + r * modul_wys - g["szczelina"] / 2,
                            g["szer"], g["szczelina"], "background:rgba(255,255,255,.3)"))

    for r in range(g["wiersze"]):
        for c in range(g["kolumny"]):
            x, y = s + c * modul_szer + m, s + r * modul_wys + m
            el.append(prostokat(x, y, modul_szer - 2 * m, modul_wys - 2 * m,
                                f"outline:1mm dashed {AKCENT}"))
            el.append(napis(s + c * modul_szer + 14, s + (r + 1) * modul_wys - 40,
                            f"R{r + 1}C{c + 1} · {modul_szer:.0f} × {modul_wys:.0f} mm"))

    od, do, wys = g["zaslona"]
    el.append(kreskowanie(s + od, s + g["wys"] - wys, do - od, wys,
                          "strefa lady i hokerów — pole martwe"))

    y_wzroku = s + g["wys"] - g["wzrok"]
    el.append(prostokat(s, y_wzroku, g["szer"], 1, f"background:{AKCENT}"))
    el.append(napis(s + g["szer"] - 520, y_wzroku - 34,
                    f'linia wzroku {g["wzrok"] / 10:.0f} cm', 11, AKCENT))

    el.append(legenda(s + modul_szer + m, s + 90, modul_szer * 2 - 2 * m,
                      f'Szablon ścianki {g["szer"] / 10:.0f} × {g["wys"] / 10:.0f} cm', [
        ("Arkusz", [
            f'{g["szer"]} × {g["wys"]} mm w skali 1:1, spad {g["spad"]} mm z każdej strony',
            f'{g["kolumny"] * g["wiersze"]} ramek {modul_szer:.0f} × {modul_wys:.0f} mm, '
            f'szczelina profilu {g["szczelina"]} mm',
            f'strefa bezpieczna {m} mm od każdej krawędzi ramki',
        ]),
        ("Zasady", [
            f"minimum {MIN_SCIANKA_MM} mm wysokości pisma — ściankę czyta się z trzech metrów",
            f'nagłówek na linii wzroku {g["wzrok"] / 10:.0f} cm nad podłogą',
            "żaden znak nie wchodzi w szczelinę profilu ani poza strefę bezpieczną",
            "dolny pas zasłania lada — zostaje spokojny",
        ]),
    ]))
    return strona(g["szer"] + 2 * s, g["wys"] + 2 * s, "".join(el))


# ---------------------------------------------------------------- lada
def lada() -> str:
    g = LADA
    s = g["spad"]
    szer = g["bok"] * 2 + g["front"]
    szer_logo = g["front"] - 2 * g["bezpieczna"] - 120
    wys_logo = szer_logo * 147 / 326
    x = s + g["bok"] + (g["front"] - szer_logo) / 2
    y = s + (g["wys"] - g["cokol"] - wys_logo) / 2
    return strona(szer + 2 * s, g["wys"] + 2 * s,
                  logo(szer_logo, x, y)
                  + prostokat(s, s + g["wys"] - g["cokol"], szer, g["cokol"],
                              f"background:{AKCENT}"))


def szablon_lady() -> str:
    g = LADA
    s, m = g["spad"], g["bezpieczna"]
    szer = g["bok"] * 2 + g["front"]
    panele = (("Bok lewy", g["bok"]), ("Front", g["front"]), ("Bok prawy", g["bok"]))
    el = [prostokat(s, s, szer, g["wys"], "outline:1mm solid rgba(255,255,255,.45)")]

    x = 0
    for nazwa, szerokosc in panele:
        el.append(prostokat(s + x + m, s + m, szerokosc - 2 * m, g["wys"] - 2 * m,
                            f"outline:1mm dashed {AKCENT}"))
        el.append(napis(s + x + m + 6, s + m + 6, f'{nazwa} · {szerokosc} × {g["wys"]} mm'))
        x += szerokosc

    for zagiecie in (g["bok"], g["bok"] + g["front"]):
        el.append(prostokat(s + zagiecie - 1, s, 2, g["wys"], f"background:{AKCENT};opacity:.85"))
        el.append(napis(s + zagiecie + 8, s + g["wys"] - 34, "zagięcie · naroże", 11, AKCENT))

    el.append(kreskowanie(s, s + g["wys"] - g["cokol"], szer, g["cokol"],
                          f'cokół {g["cokol"]} mm — pole zakryte', 8))
    el.append(kreskowanie(s, s, szer, g["blat"], f'blat {g["blat"]} mm — pole zakryte', 8))

    el.append(legenda(s + g["bok"] + m, s + g["wys"] / 2 - 70, g["front"] - 2 * m,
                      f'Szablon lady {g["front"] / 10:.0f} × {g["bok"] / 10:.0f} '
                      f'× {g["wys"] / 10:.0f} cm', [
        ("Arkusz", [
            f'rozwinięcie {szer} × {g["wys"]} mm w skali 1:1, spad {s} mm',
            f'panele: bok {g["bok"]} · front {g["front"]} · bok {g["bok"]} mm',
            f"strefa bezpieczna {m} mm od krawędzi i od zagięcia",
        ]),
        ("Zasady", [
            f"minimum {MIN_LADA_MM} mm wysokości pisma — ladę czyta się z półtora metra",
            "grafika przechodzi przez zagięcia ciągiem, tekst nigdy na narożniku",
            "logotyp raz, na froncie; boki zostają spokojne",
        ]),
    ], rozmiar_tytulu=22, rozmiar_tekstu=10))
    return strona(szer + 2 * s, g["wys"] + 2 * s, "".join(el))


# ---------------------------------------------------------------- legenda
def legenda(x: float, y: float, szerokosc: float, tytul: str, sekcje: list,
            rozmiar_tytulu: float = 30, rozmiar_tekstu: float = 12) -> str:
    kolumny = []
    for naglowek, punkty in sekcje:
        linie = "".join(
            f'<div style="margin-top:6mm;font-size:{rozmiar_tekstu}mm;line-height:1.35;'
            f'color:{SZARY};text-transform:none;letter-spacing:0">{p}</div>' for p in punkty
        )
        kolumny.append(
            f'<div style="flex:1">'
            f'<div style="font-size:{rozmiar_tekstu}mm;font-weight:800;letter-spacing:.16em;'
            f'text-transform:uppercase;color:{AKCENT}">{naglowek}</div>{linie}</div>'
        )
    return (
        f'<div style="position:absolute;left:{x}mm;top:{y}mm;width:{szerokosc}mm">'
        f'<div style="font-size:{rozmiar_tytulu}mm;font-weight:800;letter-spacing:-.01em;'
        f'margin-bottom:10mm">{tytul}</div>'
        f'<div style="display:flex;gap:{szerokosc / 12}mm">{"".join(kolumny)}</div></div>'
    )


# ---------------------------------------------------------------- render
PLIKI = {
    "plansza": ("plansza.pdf", plansza),
    "lada": ("lada.pdf", lada),
    "szablon-planszy": ("szablon-planszy.pdf", szablon_planszy),
    "szablon-lady": ("szablon-lady.pdf", szablon_lady),
}


def zbuduj(nazwa: str) -> Path:
    plik, zrob = PLIKI[nazwa]
    wynik = KORZEN / plik
    with tempfile.TemporaryDirectory() as tmp:
        html = Path(tmp) / f"{nazwa}.html"
        html.write_text(zrob(), encoding="utf-8")
        subprocess.run(
            [CHROME, "--headless", "--disable-gpu", "--no-sandbox",
             "--allow-file-access-from-files", "--virtual-time-budget=8000",
             "--no-pdf-header-footer", f"--print-to-pdf={wynik}", html.as_uri()],
            check=True, capture_output=True,
        )
    return wynik


def main() -> int:
    wybrane = sys.argv[1:] or list(PLIKI)
    nieznane = [n for n in wybrane if n not in PLIKI]
    if nieznane:
        print(f"Nie znam pliku: {', '.join(nieznane)}. Dostępne: {', '.join(PLIKI)}")
        return 2
    for nazwa in wybrane:
        wynik = zbuduj(nazwa)
        rozmiar = wynik.stat().st_size / 1024
        print(f"{wynik.name:22} {rozmiar:7.0f} kB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
