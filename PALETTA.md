# Színpaletta útmutató (kezdőknek)

Az oldalon **két színpaletta** van előkészítve, és **te váltasz köztük a kódban**. A látogatók nem látnak és nem tudnak átkapcsolni semmit (nincs gomb, nincs mentett beállítás a böngészőben).

| Név a kódban | Paletta | Háttér | Felület (kártyák) | Akcent | Szöveg | Halvány szöveg |
|---|---|---|---|---|---|---|
| `'violet'` | A – Graphite + Digital Violet | `#17191A` | `#292431` | `#B5A0FF` | `#E8E5F0` | `#A5A1AD` |
| `'mint'` | B – Graphite + Muted Mint | `#1B1E1D` | `#303735` | `#8DC8B2` | `#E2E7E3` | `#A6B0AA` |

## Hogyan működik? (2 perc)

Két fájl dolgozik együtt, és csak ezekhez kell hozzányúlnod:

- **`assets/config.js`** – itt **választod ki**, melyik paletta legyen aktív.
- **`assets/palettes.js`** – itt vannak a palettákban a **tényleges színkódok** (hex formában, pl. `#B5A0FF`).

Az oldal betöltésekor a `palettes.js` a kiválasztott paletta színeit CSS változókba (`--c-bg`, `--c-accent`, …) írja, és minden gomb, kártya, szegély, hover állapot és háttér ezekből dolgozik. Ezért nincs az oldalon „véletlenszerű” szín: minden a palettából jön.

---

## 1. Melyik fájlban, melyik változót írjam át a váltáshoz?

**Fájl:** `assets/config.js` (a projekt `assets` mappájában)
**Változó:** `palette`

Keresd meg ezt a sort:

```js
palette: 'violet',
```

## 2. Milyen értéket adjak meg?

Lila verzió:

```js
palette: 'violet',
```

Mentás verzió:

```js
palette: 'mint',
```

Szabályok:
- Az érték **idézőjelben** legyen (`'mint'`), kisbetűvel, és a sor végén maradjon a vessző.
- Mentés után a böngészőben nyomj **Ctrl+F5**-öt (Macen: Cmd+Shift+R), hogy ne a régi változatot lásd.
- Ha elírod a nevet (pl. `'mnt'`), az oldal **nem romlik el**: a lila palettát használja, és a böngésző konzolján (F12 → Console) ezt írja: `ODDFUSE: ismeretlen paletta (mnt), a "violet" lesz használva.`

## 3. Hogyan adok hozzá később új palettát?

1. Nyisd meg az **`assets/palettes.js`** fájlt.
2. Keresd meg a `PALETTES` részt, és **másold le az egyik blokkot**, majd írd át a nevét és a színeit. Példa, egy új „amber” paletta (a `mint` blokk után, vesszővel elválasztva):

```js
var PALETTES = {
  /* A – Graphite + Digital Violet */
  violet: {
    bg: '#17191A', surface: '#292431', accent: '#B5A0FF',
    text: '#E8E5F0', muted: '#A5A1AD', ticker: '#45494A', danger: '#E58A8A'
  },
  /* B – Graphite + Muted Mint */
  mint: {
    bg: '#1B1E1D', surface: '#303735', accent: '#8DC8B2',
    text: '#E2E7E3', muted: '#A6B0AA', ticker: '#454C49', danger: '#E58A8A'
  },
  /* C – Graphite + Amber  (ÚJ) */
  amber: {
    bg: '#1A1815', surface: '#2E2A24', accent: '#E0B15A',
    text: '#EDE8DF', muted: '#ADA698', ticker: '#4A4740', danger: '#E58A8A'
  }
};
```

3. Állítsd át a `config.js`-ben: `palette: 'amber',`

**Mit jelent a 7 szín?**

| Kulcs | Mire használja az oldal |
|---|---|
| `bg` | fő háttér |
| `surface` | kártyák, másodlagos felületek |
| `accent` | gombok, linkek, kiemelések, hover |
| `text` | fő szöveg |
| `muted` | halványabb szöveg (leírások, feliratok) |
| `ticker` | a háttérben futó szövegsáv színe (nagyon halvány, alig látszik) |
| `danger` | hibaüzenetek |

**Tippek jó palettához:** a `text` és a `bg` között legyen nagy különbség (világos szöveg sötét háttéren); az `accent` legyen jól látszó a háttéren, mert a gombok szövege a háttérszínnel íródik az akcentre; a `ticker` csak egy hajszállal legyen világosabb a háttérnél. A fenti „amber” példa kontrasztját kiszámoltam (szöveg 14,5:1, halvány szöveg 7,3:1, akcent 8,9:1 a háttéren), de a böngészőben mindig nézd meg szemmel is.

**Biztonsági háló:** ha egy színt kihagysz vagy elrontasz (pl. kimarad a `#`), az oldal nem romlik el. Az adott színnél a lila paletta értékét használja, és a konzolon figyelmeztetést kapsz, pl.: `a(z) "amber" paletta "accent" színe hiányzik vagy hibás (E0B15A), a violet értéke lesz használva.`

## 4. Hogyan cserélek ki egyetlen színt egy meglévő palettában?

Nyisd meg az `assets/palettes.js` fájlt, keresd meg a paletta blokkját, és **csak a hex kódot** írd át, az idézőjelet, a `#` jelet és a vesszőt hagyd meg.

Példa: a lila akcent legyen kicsit világosabb.

```js
/* előtte */
violet: {
  bg: '#17191A', surface: '#292431', accent: '#B5A0FF',

/* utána */
violet: {
  bg: '#17191A', surface: '#292431', accent: '#C3B2FF',
```

Hex kódot bármely színválasztóval vagy a böngésződ fejlesztői eszközével találsz (keresd: „color picker”).

> Kis kiegészítés: a `site.css` tetején van egy `:root { --c-... }` blokk, ez csak **tartalék** arra az esetre, ha a JavaScript valamiért nem futna le (ez a lila paletta). Ha a `violet` színeit átírod, és a tartalékot is egyezően szeretnéd, ott a színek **„R G B”** formában vannak (pl. `#B5A0FF` = `181 160 255`). Normál működéshez ezt nem kell módosítanod.

## 5. Hogyan próbálom ki a színeket úgy, hogy ne rontsam el az oldalt?

**a) Készíts másolatot.** Mielőtt belenyúlsz, másold le az egész projektmappát (pl. `oddfuse-mentes`), vagy ha Gittel dolgozol, commitold az aktuális állapotot. Ha valami elromlik, visszamásolod.

**b) Próbáld ki élőben, fájl módosítása nélkül.** Nyisd meg az oldalt, nyomj **F12**-t, és a **Console** fülön futtasd:

```js
document.documentElement.style.setProperty('--c-accent', '255 140 0');
```

Ettől az akcentszín azonnal narancs lesz, **de csak addig, amíg újra nem töltöd az oldalt**, a fájlokon semmi sem változik. Az érték „R G B” formátumú, szóközökkel (a `#FF8C00` = `255 140 0`; hex→RGB átváltót „hex to rgb” keresésre találsz). A többi változó neve: `--c-bg`, `--c-surface`, `--c-text`, `--c-muted`, `--c-ticker`, `--c-danger`. Ha megtetszik a szín, a hex kódját utána írd be a `palettes.js`-be.

**c) Egyszerre csak egy dolgot változtass**, mentsd el, frissítsd az oldalt (Ctrl+F5), és nézd meg mindkét oldalt (főoldal + portfólió aloldal), asztali és telefonos nézetben is (F12 → telefon ikon).

**d) Ha furcsa lett az oldal:** nyisd meg az F12 → Console fület, a figyelmeztetések megmondják, melyik szín hibás. Vagy vedd vissza a mentést (Ctrl+Z a szerkesztőben, vagy a másolatból).

**e) Ne használj itt gyors „kapcsolót” vagy URL-paramétert** (pl. `?palette=mint`) sem: ez látogatók számára is elérhető lenne. Az oldalon ez szándékosan nincs.

## Mit nem érint a paletta?

A hibaüzenetek színe (`danger`) mindkét palettában ugyanaz a visszafogott piros, mert a hibát jelezni kell. A fotók természetesen a saját színeikkel jelennek meg. Minden más (háttér, kártyák, gombok, linkek, szegélyek, hover állapotok, ticker, generált illusztrációk) a kiválasztott paletta színeit követi.
