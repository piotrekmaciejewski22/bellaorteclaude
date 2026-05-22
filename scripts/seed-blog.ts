/**
 * Seed bloga — wgrywa 9 zdjęć z `scripts/blog-photos/` do bucketa
 * site-media/blog/ i tworzy 4 wpisy w `blog_posts`.
 *
 * Uruchom: `npx tsx scripts/seed-blog.ts`
 *
 * Wymaga zmiennych:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 * (są w .env.local; skrypt sam je wczyta)
 */

import { createClient } from '@supabase/supabase-js';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';

// Wczytaj .env.local
loadEnv({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Brak NEXT_PUBLIC_SUPABASE_URL lub SUPABASE_SERVICE_ROLE_KEY w .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PHOTO_DIR = path.resolve(process.cwd(), 'scripts/blog-photos');

async function uploadPhoto(filename: string): Promise<string> {
  const localPath = path.join(PHOTO_DIR, filename);
  if (!existsSync(localPath)) {
    throw new Error(`Brak pliku: ${localPath}`);
  }
  const buffer = await readFile(localPath);
  const storagePath = `blog/${filename.replace(/\.jpeg$/i, '')}-${Date.now()}.jpeg`;

  const { error } = await supabase.storage
    .from('site-media')
    .upload(storagePath, buffer, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (error) {
    throw new Error(`Upload nie powiódł się dla ${filename}: ${error.message}`);
  }
  console.log(`✓ Uploaded: ${filename} → ${storagePath}`);
  return storagePath;
}

async function uploadGroup(filenames: string[]): Promise<string[]> {
  const out: string[] = [];
  for (const fn of filenames) {
    out.push(await uploadPhoto(fn));
  }
  return out;
}

interface BlogPostSeed {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  bodyMd: (extraPaths: string[]) => string;
  authorSignature: string;
  publishedAt: string;
  heroFilename: string;
  extraFilenames: string[];
}

const POSTS: BlogPostSeed[] = [
  {
    id: 'b1aaaaaa-1111-4111-8111-aaaaaaaaaa01',
    slug: 'pierwsze-rano-w-orte',
    title: 'Pierwsze rano w nowym apartamencie',
    excerpt:
      'Otwierasz okiennice, siadasz z kawą na tarasie. To ten moment, dla którego się tu przeprowadziliśmy. Trochę o pierwszych dniach w Orte.',
    authorSignature: 'Asia',
    publishedAt: '2026-04-25T21:00:00Z',
    heroFilename: 'post1-hero.jpeg',
    extraFilenames: [],
    bodyMd: () => `Wczoraj wieczorem zameldowali się pierwsi goście — mama i ciocia, jako miłe uderzenie testowe. My wciąż mieszkamy w drugim apartamencie z pudłami z Polski w połowie nieotwartych, ale czuję, że ta strona życia jakoś się układa.

## Rano

Wstajesz wcześnie, bo światło w Orte jest inne — wpada przez okiennice ostre, ciepłe, jakby ktoś specjalnie wybrał kąt. **Kawa, kanapka z ricottą, balkon.** Cały rytuał trwa może dwadzieścia minut, ale to dwadzieścia minut bez maila, bez powiadomień, bez planu.

## Co już wiemy po dwóch tygodniach

- Bar u Bruno (bez nazwy w Google) robi cappuccino za 1.20 — ale tylko do 11:00
- Sklep przy Piazza della Liberta zamyka się o 13:00, otwiera dopiero o 17:00
- Niedziela jest absolutnie martwa — zapasy robimy w sobotę
- Pociąg do Rzymu o 7:48, drugi o 8:23, trzeci o 9:11

To są drobne rzeczy, ale kiedy je wiesz, zaczynasz tu naprawdę mieszkać.

## Co dalej

W przyszłym tygodniu — sąsiedzi (mam wrażenie, że nas testują, dają obserwować). Potem wyjazdy na Bomarzo, Civita, sagra w Soriano. **Ale dziś tylko poranek na tarasie.** Tyle wystarczy.`,
  },
  {
    id: 'b1aaaaaa-1111-4111-8111-aaaaaaaaaa02',
    slug: 'wieczor-z-sasiadami-pod-porta-romana',
    title: 'Wieczór z sąsiadami pod Porta Romana',
    excerpt:
      'Pierwsza kolacja u sąsiadów. Stół na ulicy, makaron przekazywany z rąk do rąk, wino z winnicy 5 kilometrów stąd. Tak się tu mieszka.',
    authorSignature: 'Asia',
    publishedAt: '2026-04-26T20:00:00Z',
    heroFilename: 'post2-hero.jpeg',
    extraFilenames: [],
    bodyMd: () => `Po dwóch tygodniach w Orte przyszło zaproszenie z dolnego mieszkania — Marco i Giulia, on z piekarni przy Via Cavour, ona uczy włoskiego dla obcokrajowców. Wczoraj wieczorem dali znać że wystawiają stół na ulicę i mamy przyjść.

## Stół na ulicy

To **nie metafora.** Po prostu wynoszą stół na chodnik pod Porta Romana, krzesła z mieszkania, obrus, kieliszki. Sąsiadka z naprzeciwka dorzuca lampę na przedłużaczu. Inni przechodnie czasem dosiadają się na 10 minut, czasem zostają na całą kolację.

## Menu

> *Pasta cacio e pepe da Giulia, fritto misto da Marco, una bottiglia di vino dei nostri amici.*

— wszystko proste, lokalne, robione na luzie. Pasta dosłownie w kuchni za drzwiami, talerze przekazywane przez okno, ktoś krzyczy z balkonu na piętrze że dorzuca tiramisu.

## Co to dla nas zmienia

Wracamy do Polski na wakacje, ale wracamy też tu i to jest **drugi dom**. Nie znajomy AirBnB. Nie wynajmem. Po prostu mieszkamy w jakimś miejscu i ktoś się o nas martwi.

To jest to, co chcielibyśmy żeby goście Bellaorte też mogli posmakować — choć w skróconej wersji. Polecanki gdzie zjeść po polsku to jedno, ale **wprowadzenie do społeczności** to coś innego. Pracujemy nad tym.`,
  },
  {
    id: 'b1aaaaaa-1111-4111-8111-aaaaaaaaaa03',
    slug: 'sobota-w-terenie-bomarzo',
    title: 'Sobota w terenie — Bomarzo, Vasanello i kolacja przy świecach',
    excerpt:
      'Pełnowymiarowy weekend testowy. Park Potworów rano, lunch w Vasanello, wieczorny taras na Civita. Co warto, co przekombinowaliśmy.',
    authorSignature: 'Maciek',
    publishedAt: '2026-05-17T22:00:00Z',
    heroFilename: 'post3-hero.jpeg',
    extraFilenames: ['post3-2.jpeg', 'post3-3.jpeg'],
    bodyMd: (paths) => `Dziś robiliśmy szybki test "co-się-da-zwiedzić-jednego-dnia-z-naszymi-gośćmi". Trochę przekombinowaliśmy, ale wyniki ciekawe.

## 11:00 — Parco dei Mostri w Bomarzo

20 minut autem z Orte. Park manierystycznych rzeźb z XVI wieku — wielki kamienny krokodyl, krzywy domek, paszcza Orcusa. **Dzieci się gubią z zachwytem, dorośli próbują rozczytać symbolikę.** My po raz trzeci tam byliśmy i wciąż widzieliśmy nowe szczegóły.

Bilet 13 EUR, parking bezpłatny przy wejściu. **Idź wcześnie** — od 12:00 zaczynają wjeżdżać autokary z Rzymu.

![Bomarzo o poranku](${paths[0]})
*Park dopiero się obudził, jeszcze chłodno w cieniu kamiennych potworów.*

## 14:30 — Lunch w Vasanello

Trattoria Camillo, 12 minut z Bomarzo. Polecił nam ją Bruno (kawiarnia w Orte) — i miał rację. Risotto z borowikami sezonowymi, abbacchio na rożnie, dwa kieliszki Cesanese. **45 EUR za dwoje, włącznie z kawą.**

> *La fame è il miglior cuoco* — głodny żołądek to najlepszy kucharz.

Camillo wynosi talerze sam, opowiada o swojej babci która gotowała tu samą rzecz przez 60 lat. Czasy lunchowe ścisłe — od 12:30 do 14:30. Nie spóźnij się.

## 18:00 — Civita di Bagnoregio

50 minut autem z Vasanello, ale warto. **Civita to "umierające miasto"** — siedzi na tufowym wzgórzu, dostępna tylko mostem dla pieszych, traci po kawałku w każdej dekadzie. Most kosztuje 5 EUR (wstęp do Civity). Małe, kameralne miasteczko, dwa-trzy bary, jedna restauracja.

![Most do Civity przed zachodem słońca](${paths[1]})

Zostaliśmy do zachodu — światło o 19:30 zrobiło z tufu coś niesamowitego.

## 21:00 — Kolacja na tarasie w Bagnoregio

W mieście Bagnoregio (czyli przed mostem) jest kilka knajp z widokiem na Civitę. Wybraliśmy "La Loggia" — taras, świece na stolikach, talerz salumi i piec na drewno. **70 EUR za kolację dla dwojga, plus dwa szkła amaro na koniec.**

![Stolik z widokiem](${paths[2]})

## Wnioski

Trzy punkty w jeden dzień to maks. **Następnym razem zrobimy to samo, ale rozłożone na dwa dni** — Bomarzo + Vasanello jednego, Civita + kolacja drugiego. W jednym dniu wracaliśmy do Orte o 23, padając.

Ale rzeczy do polecenia gościom mamy gotowe.`,
  },
  {
    id: 'b1aaaaaa-1111-4111-8111-aaaaaaaaaa04',
    slug: 'targ-w-viterbo-co-przywiezlismy',
    title: 'Sobotni targ w Viterbo — co przywieźliśmy',
    excerpt:
      'Pełen samochód oliwy, sera, świeżych warzyw i jedna butelka limoncello od dziadka. Spis tygodniowych zakupów na targu przy Piazza San Lorenzo.',
    authorSignature: 'Asia',
    publishedAt: '2026-05-21T15:30:00Z',
    heroFilename: 'post4-hero.jpeg',
    extraFilenames: ['post4-2.jpeg', 'post4-3.jpeg', 'post4-4.jpeg'],
    bodyMd: (paths) => `Zaczęłam pisać poprzednim razem o targu w Viterbo, dziś dzień testowy z konkretami. Wyjazd 8:30, powrót 12:30, samochód pełen.

## Trasa

Orte → Viterbo, 30 km, 25 minut autem przez SS675. **Parking pod Porta Romana** (1.50 EUR/godz.) albo darmowy 5 minut spacerem na zewnątrz murów. My zaparkowaliśmy w środku, dziś niedziela więc bez problemu.

![Viterbo o 9 rano, jeszcze bez tłumu](${paths[0]})

Wejście na targ przez Via Cavour, prosto na **Piazza San Lorenzo**. Stragany rozłożone od soboty 7 rano do niedzieli 13:00.

## Co kupiliśmy

### Sery
- **Pecorino di Pienza** — 22 EUR/kg, kupiliśmy 400g (8.80 EUR). Twardy, mocny, idealny do tartego.
- **Ricotta świeża** — 8 EUR/kg, 250g (2 EUR). Na śniadanie, do gnocchi.
- **Caciotta z mleka owczego** — 18 EUR/kg, 300g (5.40 EUR). Łagodna, do kanapek.

### Oliwa i mąka
- **Oliwa z presa** — pierwsze tłoczenie z drzew z Bagnoregio, pół litra 9 EUR
- **Mąka 00 z młyna w Soriano** — 3 EUR/kg

### Warzywa i owoce
- Karczochy 4 EUR/kg (kupiliśmy 6 sztuk)
- Pomidory San Marzano 5 EUR/kg (kilo)
- Bób świeży, w strąkach, 6 EUR/kg
- Truskawki maliny — kosz 250g, 4 EUR

![Stragan z karczochami i pomidorami](${paths[1]})

### Mięso

Tu standardowy ruch — **Macelleria Antichi Sapori** w bocznej alejce za rynkiem. Wzięliśmy:
- Kawałek prosciutto crudo — 1 EUR za 25g (w sumie 8 EUR)
- Salsiczkę dziką suszoną — 6 EUR/kawałek
- Pasztet z dzika — 9 EUR/słoik

![Lada w macelleria](${paths[2]})

### Bonus

I **jedna butelka limoncello od dziadka.** 12 EUR. Robi sam, butelkuje sam, znamy go już z trzech wizyt. Dał nam degustację i pokazał zdjęcie wnuczki w Sydney.

![Stragan z limoncello i grappą](${paths[3]})

## Łącznie

**~85 EUR za pełen tydzień jedzenia dla dwóch osób.**

## Praktyczne uwagi dla gości

1. Bierzcie **gotówkę**. Tylko jeden stragan na 30 ma terminal.
2. **Torby parciane** wlicza się w cenę, plastik kosztuje extra
3. Mów po **włosku albo angielsku** — po polsku nikt nie zareaguje, ale uśmiech wszędzie działa
4. Najlepsza pora — **8:30 do 10:00**. Po 11:00 zaczynają się tłumy z autobusów

W przyszłym tygodniu — wycieczka do winnicy 7 km od Orte. Trzymajcie kciuki.`,
  },
];

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Seed bloga — Bellaorte');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  for (const post of POSTS) {
    console.log(`\n— Post: ${post.title}`);

    // 1. Upload hero
    const heroPath = await uploadPhoto(post.heroFilename);

    // 2. Upload extra zdjęć
    const extraPaths = await uploadGroup(post.extraFilenames);

    // 3. Renderowane body z linkami do zdjęć
    const bodyMd = post.bodyMd(extraPaths.map((p) => `${SUPABASE_URL}/storage/v1/object/public/site-media/${p}`));

    // 4. Upsert wpisu
    const { error } = await supabase
      .from('blog_posts')
      .upsert(
        {
          id: post.id,
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt,
          body_md: bodyMd,
          author_signature: post.authorSignature,
          hero_image_path: heroPath,
          published_at: post.publishedAt,
        },
        { onConflict: 'id' },
      );
    if (error) {
      console.error(`  ✗ Błąd zapisu wpisu: ${error.message}`);
      process.exit(1);
    }
    console.log(`  ✓ Wpis zapisany w bazie`);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Gotowe. Sprawdź /blog na stronie.');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
