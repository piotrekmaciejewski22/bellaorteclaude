-- =============================================================================
-- BELLAORTE — bogate dane demo
-- =============================================================================
--
-- Wrzuć w nowym query w SQL Editor (jako postgres / domyślny user).
-- Plik jest idempotentny — re-run nadpisuje treści po fixed UUID.
--
-- Zawartość:
--   • 5 wpisów blogowych (z różnymi datami publikacji)
--   • 8 komentarzy (różne statusy: approved, pending, rejected)
--   • 6 zapytań rezerwacyjnych (pending / confirmed / rejected) z
--     zachowaniem realistycznych dat
--   • 1 aktywna rezerwacja powstała z confirmed inquiry
--   • 1 ręczna blokada admina
--   • 4 dodatkowe opinie pod restauracjami / atrakcjami (status approved)
--
-- Pliki graficzne (hero bloga, "wasze zdjęcia") wgraj przez panel admina —
-- ten plik nie wstawia żadnych zdjęć.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 1. blog_posts
-- ---------------------------------------------------------------------------
insert into public.blog_posts (id, slug, title, excerpt, body_md, author_signature, published_at) values
  (
    'b0aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid,
    'pierwszy-tydzien-w-orte',
    'Pierwszy tydzień w Orte — co nas zaskoczyło',
    'Przeprowadziliśmy się tu na stałe i zaczęliśmy ogarniać dwa apartamenty. Dlaczego Orte zamiast Rzymu albo Florencji? I dlaczego od razu czujemy że to dobry wybór.',
    E'## Powitanie\n\nMieszkamy w Orte od dziesięciu dni i już wiemy, że nie chcemy stąd wracać do Polski.\n\nOrte jest **mniejsze** niż się spodziewaliśmy — dosłownie 9 tysięcy mieszkańców, dwie ulice w centrum historycznym, jedna brama miejska, jedno laboratorium piekarskie i trzy bary. Ale wszystko to w odległości sześciu minut spaceru od domu.\n\n## Co działa od razu\n\n- **Stacja kolejowa** ma bezpośredni pociąg do Roma Termini co 20 minut. Nie trzeba kombinować, nie trzeba przesiadać. Bilet 6 euro.\n- **Marek u Bruno** (lokalna kawiarnia bez nazwy w Google) robi cappuccino za 1.20 i serdecznie się denerwuje, jak zamawiamy ją po 11:00.\n- **Internet** w obu apartamentach: 100 Mbps stabilnie. Wystarczy do streamowania, calli, naszej pracy.\n\n## Co wymaga ogarnięcia\n\n- Sklepy zamykają się o 13:00 i otwierają znowu o 17:00. Pierwsze trzy dni byliśmy głodni.\n- Niedziele są martwe — trzeba zrobić zapasy w sobotę.\n- Wifi działa, ale potrafi paść jak burza — kilka razy w roku.\n\n## Plan na najbliższy miesiąc\n\nChcemy żeby BELLAORTE był miejscem dla osób które chcą poczuć Włochy bez tłumów. Bez Rzymu w trzy dni, bez "top 10 things to do". Z dobrym śniadaniem, kalendarzem dostępności online, i prawdziwymi rekomendacjami restauracji.\n\nTo pierwszy wpis. Następne będą o knajpach, o pociągach do Rzymu, i o tym co tu kwitnie sezonowo.',
    'Maciek',
    now() - interval '14 days'
  ),
  (
    'b0bbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'::uuid,
    'sobotni-targ-w-viterbo',
    'Sobotni targ w Viterbo — gdzie kupują tutejsi',
    'Pojechaliśmy 25 minut autem do Viterbo na cotygodniowy targ. Sery, oliwa, ogórki w słoiku, dziadek który robi własny limoncello. Przewodnik praktyczny.',
    E'## Dlaczego Viterbo, nie Orte\n\nOrte ma malutki targ w środę rano, ale prawdziwa akcja jest w sobotę w Viterbo. Stolica regionu Tuscia, 30 km, około 25 minut autem przez SS675.\n\n## Plan dnia\n\n1. Wyjazd 8:30. Targ otwiera się wcześniej, ale do 9:00 jeszcze nie ma tłumów.\n2. Parking pod Porta Romana (płatny, 1.50 euro za godzinę).\n3. Wejście przez Via Cavour, prosto na targ przy Piazza San Lorenzo.\n4. Powrót około 12:00 — wtedy zaczyna się ścisk.\n\n## Co kupujemy regularnie\n\n- **Pecorino di Pienza** od pana z brodą po prawej stronie wjazdu. 22 euro za kilo, ale to inna liga niż wszystko co kiedykolwiek jadłeś z marketu.\n- **Oliwę z presa** — pierwsze tłoczenie z drzew z okolic Bagnoregio. Pół litra, 9 euro.\n- **Ogórki małosolne** — Włosi też je robią, tylko nazywają inaczej. _Cetriolini in salamoia_.\n- **Limoncello od dziadka** — robi sam, butelkuje sam, zawsze ma 2-3 butelki na sprzedaż. 12 euro.\n\n## Praktyczne\n\n- Bierzcie gotówkę. Tylko jeden stragan na 30 ma terminal.\n- Torby parciane wlicza się w cenę. Plastik kosztuje.\n- Mów po włosku albo po angielsku. Po polsku nikt nie zareaguje, ale uśmiech wszędzie działa.\n\nNa następny tydzień planujemy wpis o Civita di Bagnoregio. Jedzcie spokojnie.',
    'Asia',
    now() - interval '8 days'
  ),
  (
    'b0cccccc-cccc-4ccc-8ccc-cccccccccccc'::uuid,
    'gdzie-zjesc-orte-okolica',
    'Pięć knajp w okolicy Orte, do których wracamy',
    'Zaczęliśmy od 15 miejsc, do pięciu wracamy. Reszta była dobra ale nie warta drugiej wizyty. Lista co naprawdę polecamy gościom.',
    E'## Jak to robimy\n\nW pierwszym miesiącu poszliśmy do każdej restauracji w promieniu 20 km od apartamentu. Zaznaczamy w kalendarzu, jakie miejsce, jaka cena, jakie wrażenia. Po miesiącu zostało pięć adresów do których wracamy z różnych powodów.\n\n## 1. La Locanda della Chiocciola\n\nLokal trochę za miastem, na drodze z Orte do Soriano. Robią _cucina contadina_ — tradycyjne dania z sezonowych warzyw, z otwartym ogniem na sali. Polecamy na lunch w sobotę. **Rezerwacja konieczna**.\n\n## 2. Pizzeria Eureka\n\nNie najlepsza pizza we Włoszech, ale **najlepsza w okolicy** Orte i właściciel rozpoznaje gości po drugiej wizycie. Pizza Diavola za 9 euro, z piwem 12. Otwarte do 23:00 codziennie.\n\n## 3. Campo Antico\n\nWolniejszy kierunek, jakieś 10 minut autem z Orte. Robią klasykę kuchni laziale — pasta cacio e pepe, abbacchio, grube karczochy alla romana. Świetne na drugą-trzecią wizytę z gośćmi.\n\n## 4. (Bonus) Trattoria Camillo w Vasanello\n\n15 minut z Orte, mniej znana niż wymienione, ale właściciel-szef gotuje jak jego babcia z Maremmy. Risotto z borowikami w październiku — zostaniesz tu na trzy godziny. Tylko gotówka.\n\n## 5. (Bonus) Da Pino — kebab\n\nGdy wracasz z Rzymu o północy. Trzy ulice od stacji kolejowej Orte, Pino zna wszystkich i wszystkich karmi. 7 euro za rolkę z baraniną.\n\n## Co _nie_ polecamy\n\nKilka miejsc w samym centrum Orte i Bomarzo działa głównie dla turystów. Nie damy adresów żeby nikomu nie zaszkodzić, ale jak się wahasz — pytaj nas.',
    'Maciek',
    now() - interval '5 days'
  ),
  (
    'b0dddddd-dddd-4ddd-8ddd-dddddddddddd'::uuid,
    'dzien-w-rzymie-z-pociagiem',
    'Cały dzień w Rzymie z pociągiem 7:48 z Orte',
    'Test po raz piąty: czy da się zrobić Koloseum, Forum, Watykan i kolację w Trastevere bez stresu, na jeden bilet kolejowy? Tak.',
    E'## Plan testowy\n\nGoście pytają nas regularnie: ile czasu trzeba zarezerwować na Rzym, jak macie tylko jeden dzień? Robimy ten plan z naszymi znajomymi piąty raz, działa.\n\n## Pociąg\n\n**Orte → Roma Tiburtina, 7:48**, dojazd 7:11 z naszych apartamentów. Bilet w aplikacji Trenitalia, 6.95 euro w jedną stronę, RegionExpress.\n\n## Harmonogram dnia\n\n- **9:00** — Roma Tiburtina, metro B do Colosseo (jeden przystanek od Termini).\n- **9:15** — Koloseum (rezerwacja **obowiązkowa**, bilet kupiony 3 dni wcześniej online, 18 euro).\n- **11:00** — Forum Romanum + Palatyn (te same bilety).\n- **13:00** — Lunch w Pasta Imperiale przy Largo di Torre Argentina. Trzeba zająć stolik na zewnątrz.\n- **14:30** — Spacer Pantheon → Piazza Navona → Campo de Fiori.\n- **16:30** — Watykan: Bazylika Świętego Piotra (wstęp wolny, kolejka 30-45 min).\n- **18:00** — Trastevere — kawa i odpoczynek na Piazza di Santa Maria.\n- **19:30** — Kolacja w Da Enzo al 29 (rezerwacja kilka tygodni wcześniej, mała knajpa).\n- **22:00** — Tramwaj #8 do Termini.\n- **22:35** — Pociąg do Orte. **Ostatni pociąg na dziś!**\n- **23:25** — W domu w Orte. Whisky.\n\n## Co poszło źle pierwszy raz\n\n- Próbowaliśmy zwiedzić Watykan _i_ Muzea Watykańskie. **Nie ma szans.** Wybierzcie jedno.\n- Nie zarezerwowaliśmy Koloseum. Stoisko w kolejce do biletu = 90 minut z dnia.\n- Mieliśmy wracać o 23:40 — to ostatni pociąg w niedzielę, w sobotę 22:35 jest ostatni rozsądny.\n\n## Wnioski\n\nDzień w Rzymie z Orte to jest realne. Bez stresu, bez nocowania, bez 200 euro za hotel w turystycznej dziurze. Pociąg co 20 minut, dwa kierunki.',
    'Maciek',
    now() - interval '2 days'
  ),
  (
    'b0eeeeee-eeee-4eee-8eee-eeeeeeeeeeee'::uuid,
    'maj-w-orte-co-kwitnie',
    'Maj w Orte — co kwitnie, co warto zrobić',
    'Krótki przewodnik sezonowy. Co rośnie na targach, jakie święta lokalne, jaka pogoda, gdzie chodzimy gdy gorąco.',
    E'## Pogoda\n\nMaj to nasz ulubiony miesiąc w Orte. Średnio 22°C w dzień, 12°C w nocy. Trzy-cztery deszczowe dni na cały miesiąc. Wieczory chłodne — bierz lekki sweter.\n\n## Co kwitnie\n\n- **Maki** wzdłuż całej drogi do Bomarzo. Pola **obsypane** czerwienią od 5 do 25 maja.\n- **Lawenda** zaczyna kwitnąć ostatni tydzień miesiąca. Pełnia w czerwcu.\n- **Glicynia** na większości starych domów w Orte.\n\n## Co warto zrobić w maju\n\n- **Festa di San Faustino** w Orte (drugi weekend maja). Procesja w sobotę, koncerty na piazza w niedzielę. Bezpłatne, wszyscy mówią po włosku, nikt nie zwraca uwagi że nie rozumiesz.\n- **Otwarcie sezonu w Bomarzo** — Parco dei Mostri ma rozszerzone godziny od początku maja.\n- **Pierwsze pomidory ogrodowe** na targu w Viterbo. Smakują inaczej niż wszystko co znaleźliście w Polsce w supermarkecie.\n\n## Praktyczne\n\nKlimatyzacja w obu apartamentach działa od początku maja. W nocy zwykle nie jest potrzebna, ale po południu w słońcu warto. Okiennice trzymamy zamknięte do 17:00.\n\nNastępny wpis za tydzień — tym razem o miejscach do pływania w okolicy. (Spoiler: nie tylko Tyber.)',
    'Asia',
    null  -- DRAFT — testowo nieopublikowany
  )
on conflict (id) do update set
  slug = excluded.slug,
  title = excluded.title,
  excerpt = excluded.excerpt,
  body_md = excluded.body_md,
  author_signature = excluded.author_signature,
  published_at = excluded.published_at;


-- ---------------------------------------------------------------------------
-- 2. blog_comments — różne statusy
-- ---------------------------------------------------------------------------
insert into public.blog_comments (id, post_id, signature, body, status, consent_at) values
  (
    'c0aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01'::uuid,
    'b0aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid,
    'Tomek',
    'Mocno zachęciliście mnie do odwiedzin. Mamy plan na lipiec, czy macie wolne 10-17 lipca?',
    'approved',
    now() - interval '13 days'
  ),
  (
    'c0aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa02'::uuid,
    'b0aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid,
    'Marta i Paweł',
    'Mieszkaliśmy u Was w marcu. Pamiętacie nas? Jesteśmy parą z Krakowa z dwójką dzieci. Wracamy w sierpniu — Asia obiecała nam ten przepis na lasagne. Trzymamy się!',
    'approved',
    now() - interval '12 days'
  ),
  (
    'c0bbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb01'::uuid,
    'b0bbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'::uuid,
    'Iza',
    'Świetny artykuł, dziękuję! Czy te ogórki małosolne to się je z chlebem i masłem czy raczej jako dodatek?',
    'approved',
    now() - interval '7 days'
  ),
  (
    'c0bbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb02'::uuid,
    'b0bbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'::uuid,
    'Anonim',
    'A czy ten dziadek od limoncello ma stoisko zawsze czy tylko sezonowo?',
    'pending',  -- DO MODERACJI
    now() - interval '1 days'
  ),
  (
    'c0cccccc-cccc-4ccc-8ccc-cccccccccc01'::uuid,
    'b0cccccc-cccc-4ccc-8ccc-cccccccccccc'::uuid,
    'Karolina',
    'Eureka jest naprawdę super. Jedliśmy tam kilka razy. Polecam carbonarę, choć wiem że to nieortodoksyjne w pizzerii.',
    'approved',
    now() - interval '4 days'
  ),
  (
    'c0cccccc-cccc-4ccc-8ccc-cccccccccc02'::uuid,
    'b0cccccc-cccc-4ccc-8ccc-cccccccccccc'::uuid,
    'spam-bot',
    'Buy cheap shoes from our shop www.suspicious-link.com',
    'rejected',  -- ODRZUCONY (spam)
    now() - interval '3 days'
  ),
  (
    'c0dddddd-dddd-4ddd-8ddd-dddddddddd01'::uuid,
    'b0dddddd-dddd-4ddd-8ddd-dddddddddddd'::uuid,
    'Bartek',
    'Rezerwacja Koloseum 3 dni wcześniej to czasem za mało. Ostatnio zarezerwowałem 5 dni i był już komplet o 11:00. Lepiej tydzień.',
    'approved',
    now() - interval '1 days'
  ),
  (
    'c0dddddd-dddd-4ddd-8ddd-dddddddddd02'::uuid,
    'b0dddddd-dddd-4ddd-8ddd-dddddddddddd'::uuid,
    'Klaudia',
    'Czy Da Enzo al 29 da się zarezerwować online czy tylko telefonicznie? Mamy plan na czerwiec.',
    'pending',  -- DO MODERACJI
    now() - interval '12 hours'
  )
on conflict (id) do update set
  signature = excluded.signature,
  body = excluded.body,
  status = excluded.status,
  consent_at = excluded.consent_at;


-- ---------------------------------------------------------------------------
-- 3. booking_inquiries — różne statusy
-- ---------------------------------------------------------------------------
insert into public.booking_inquiries (
  id, apartment_id, check_in, check_out, adults, children,
  guest_full_name, guest_email, guest_phone, message,
  consent_at, status, source_ip, admin_note
) values
  -- PENDING — czeka na decyzję admina
  (
    'd0aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01'::uuid,
    '11111111-1111-4111-8111-111111111111'::uuid,
    (now() + interval '20 days')::date,
    (now() + interval '24 days')::date,
    2, 0,
    'Joanna i Krzysztof Nowak',
    'joanna.nowak@example.com',
    '+48 601 234 567',
    E'Cześć! Pierwszy raz w Orte. Czy macie miejsce parkingowe blisko apartamentu? Przyjeżdżamy autem z Polski.',
    now() - interval '2 days',
    'pending',
    null,
    null
  ),
  (
    'd0aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa02'::uuid,
    '22222222-2222-4222-8222-222222222222'::uuid,
    (now() + interval '60 days')::date,
    (now() + interval '67 days')::date,
    2, 1,
    'Anna Kowalczyk',
    'a.kowalczyk@example.com',
    '+48 503 778 992',
    E'Mamy 4-letnie dziecko. Czy w mieszkaniu jest łóżeczko dla niego, czy mamy zabrać własne?',
    now() - interval '1 days',
    'pending',
    null,
    null
  ),
  (
    'd0aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa03'::uuid,
    '11111111-1111-4111-8111-111111111111'::uuid,
    (now() + interval '90 days')::date,
    (now() + interval '97 days')::date,
    4, 0,
    'Patryk Lewandowski',
    'p.lewandowski@example.com',
    null,
    'Czterech znajomych z pracy, planujemy degustację win i wycieczki rowerowe. Czy macie blisko wypożyczalnię rowerów?',
    now() - interval '6 hours',
    'pending',
    null,
    null
  ),
  -- CONFIRMED — z istniejącą rezerwacją
  (
    'd0bbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb01'::uuid,
    '11111111-1111-4111-8111-111111111111'::uuid,
    (now() + interval '40 days')::date,
    (now() + interval '47 days')::date,
    2, 0,
    'Marek Wójcik',
    'marek.wojcik@example.com',
    '+48 692 345 678',
    'Wracamy do Was drugi raz w tym roku. Tym razem chcemy zorganizować małą rocznicę ślubu.',
    now() - interval '10 days',
    'confirmed',
    null,
    'Stali goście. Wysłana zaliczka 200 EUR. Klucze odebrane będą w piątek.'
  ),
  -- REJECTED — termin niedostępny
  (
    'd0cccccc-cccc-4ccc-8ccc-cccccccccc01'::uuid,
    '11111111-1111-4111-8111-111111111111'::uuid,
    (now() + interval '40 days')::date,
    (now() + interval '45 days')::date,
    2, 0,
    'Iwona Mazur',
    'iwona.m@example.com',
    null,
    'Czy te daty są jeszcze wolne?',
    now() - interval '8 days',
    'rejected',
    null,
    'Termin pokrywa się z rezerwacją Marka Wójcika. Zaproponowany alternatywny termin 50-55 dni.'
  ),
  (
    'd0cccccc-cccc-4ccc-8ccc-cccccccccc02'::uuid,
    '22222222-2222-4222-8222-222222222222'::uuid,
    (now() - interval '5 days')::date,  -- przeszłe daty — odrzucono z innego powodu
    (now() - interval '1 days')::date,
    1, 0,
    'Kamil Szymański',
    'k.szymanski@example.com',
    null,
    'Test',
    now() - interval '14 days',
    'rejected',
    null,
    'Test bot — adres email nie odpowiada na potwierdzenia.'
  )
on conflict (id) do update set
  apartment_id = excluded.apartment_id,
  check_in = excluded.check_in,
  check_out = excluded.check_out,
  adults = excluded.adults,
  children = excluded.children,
  guest_full_name = excluded.guest_full_name,
  guest_email = excluded.guest_email,
  guest_phone = excluded.guest_phone,
  message = excluded.message,
  consent_at = excluded.consent_at,
  status = excluded.status,
  admin_note = excluded.admin_note;


-- ---------------------------------------------------------------------------
-- 4. reservations — z confirmed inquiry
-- ---------------------------------------------------------------------------
insert into public.reservations (
  id, apartment_id, inquiry_id, check_in, check_out, status, admin_note
) values
  (
    'e0aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01'::uuid,
    '11111111-1111-4111-8111-111111111111'::uuid,
    'd0bbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb01'::uuid,
    (now() + interval '40 days')::date,
    (now() + interval '47 days')::date,
    'active',
    'Marek Wójcik — rocznica ślubu. Klucze przygotowane.'
  )
on conflict (id) do update set
  apartment_id = excluded.apartment_id,
  inquiry_id = excluded.inquiry_id,
  check_in = excluded.check_in,
  check_out = excluded.check_out,
  status = excluded.status,
  admin_note = excluded.admin_note;


-- ---------------------------------------------------------------------------
-- 5. calendar_blocks — przykładowa blokada admina
-- ---------------------------------------------------------------------------
insert into public.calendar_blocks (
  id, apartment_id, start_date, end_date, reason, note
) values
  (
    'f0aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01'::uuid,
    '22222222-2222-4222-8222-222222222222'::uuid,
    (now() + interval '15 days')::date,
    (now() + interval '18 days')::date,
    'maintenance',
    'Wymiana bojlera + odświeżenie ścian w sypialni.'
  )
on conflict (id) do update set
  apartment_id = excluded.apartment_id,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  reason = excluded.reason,
  note = excluded.note;


-- ---------------------------------------------------------------------------
-- 6. reviews — dodatkowe pod restauracjami i atrakcjami
-- ---------------------------------------------------------------------------
insert into public.reviews (
  id, restaurant_id, attraction_id, signature, rating, body, status, consent_at
) values
  (
    'aa0aaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01'::uuid,
    'b1111111-1111-4111-8111-111111111111'::uuid,
    null,
    'Tomek',
    5,
    E'Najlepszy lunch w okolicy. Ravioli z gruszką i pecorino na otwartym ogniu — niesamowite. Zarezerwowaliśmy z 4-dniowym wyprzedzeniem i nie żałujemy.',
    'approved',
    now() - interval '20 days'
  ),
  (
    'aa0aaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa02'::uuid,
    'b2222222-2222-4222-8222-222222222222'::uuid,
    null,
    'Anna i dzieci',
    4,
    E'Pizza dobra, dzieci szczęśliwe. Trochę głośno w środku, ale to też część klimatu. Wracamy.',
    'approved',
    now() - interval '14 days'
  ),
  (
    'aa0aaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa03'::uuid,
    null,
    'a1111111-1111-4111-8111-aaaaaaaaaaaa'::uuid,
    'Kasia',
    5,
    E'Orte Sotterranea to absolutny must. Przewodniczka mówi po angielsku zrozumiale, godzinna trasa, chłodno przyjemnie w upale, kompletnie inny świat pod ulicami.',
    'approved',
    now() - interval '8 days'
  ),
  (
    'aa0aaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa04'::uuid,
    null,
    'a3333333-3333-4333-8333-aaaaaaaaaaaa'::uuid,
    'Filip',
    5,
    E'Civita di Bagnoregio o 8 rano przed tłumami — magicznie. Zostań trzy godziny minimum, w jednej z dwóch knajp zjedz lunch z widokiem na Calanchi. Bez tego nie ma tu sensu wracać.',
    'approved',
    now() - interval '3 days'
  ),
  (
    'aa0aaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa05'::uuid,
    'b4444444-4444-4444-8444-444444444444'::uuid,
    null,
    'Robert',
    4,
    E'W Roscioli trzeba rezerwować. Carbonara naprawdę inna niż wszystko co jadłem we Włoszech, ale ceny rzymskie — 30 euro za dwie pasta.',
    'approved',
    now() - interval '2 days'
  )
on conflict (id) do update set
  restaurant_id = excluded.restaurant_id,
  attraction_id = excluded.attraction_id,
  signature = excluded.signature,
  rating = excluded.rating,
  body = excluded.body,
  status = excluded.status,
  consent_at = excluded.consent_at;


-- =============================================================================
-- KONIEC
--
-- Po uruchomieniu sprawdź:
--
--   set local role service_role;
--   select count(*) from public.blog_posts where published_at is not null;       -- 4
--   select count(*) from public.blog_comments where status = 'pending';          -- 2
--   select count(*) from public.booking_inquiries where status = 'pending';      -- 3
--   select count(*) from public.booking_inquiries where status = 'confirmed';    -- 1
--   select count(*) from public.booking_inquiries where status = 'rejected';     -- 2
--   select count(*) from public.reservations where status = 'active';            -- 1
--   select count(*) from public.calendar_blocks;                                 -- 1
--   select count(*) from public.reviews where status = 'approved';               -- 5+ (wcześniejsze + 5 nowych)
--   reset role;
-- =============================================================================
