/**
 * Strona główna — magazyn BELLAORTE.
 *
 * Sekcje numerowane I-VI, każda z motto włoskim jako kursywne intro
 * (ten włoski element jest świadomy — to "vibe" magazynu, nie nawigacja).
 * Wszystkie etykiety i CTA po polsku.
 */

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Newspaper } from "lucide-react";
import { HeroSection } from "@/components/public/HeroSection";
import { ApartmentCard } from "@/components/public/ApartmentCard";
import { SectionDivider } from "@/components/public/decorative/SectionDivider";
import { RomanBadge } from "@/components/public/decorative/RomanBadge";
import { TuscanyMap } from "@/components/public/decorative/TuscanyMap";
import { TricoloreRule } from "@/components/public/decorative/TricoloreRule";
import {
  AmphoraIcon,
  AqueductIcon,
  CypressIcon,
  OliveBranchIcon,
} from "@/components/public/decorative/ItalianIcons";
import {
  MOCK_APARTMENTS,
  MOCK_APARTMENT_HERO,
  MOCK_NEXT_AVAILABLE,
} from "@/lib/mock-data";
import { createServerClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/lib/data/settings";
import { publicSiteMediaUrl, getApartments } from "@/lib/data/apartments";
import { getBlogPosts, type BlogPost } from "@/lib/data/blog";
import { getApprovedCommunityPhotosWithUrls } from "@/lib/data/community-photos";
import { createServiceClient } from "@/lib/supabase/admin";

const GUIDE_LINKS = [
  {
    href: "/restaurants",
    label: "Restauracje",
    blurb: "Trattorie i pizzerie w okolicy Orte. Sprawdzone osobiście.",
    Icon: AmphoraIcon,
    roman: "I" as const,
  },
  {
    href: "/places",
    label: "Atrakcje",
    blurb: "Orte Sotterranea, Bomarzo, Civita di Bagnoregio.",
    Icon: CypressIcon,
    roman: "II" as const,
  },
  {
    href: "/rome",
    label: "Rzym",
    blurb: "Plan dnia, transport, bilety, wskazówki praktyczne.",
    Icon: AqueductIcon,
    roman: "III" as const,
  },
  {
    href: "/wasze-zdjecia",
    label: "Wasze zdjęcia",
    blurb: "Galeria od gości i znajomych. Możesz dorzucić swoje.",
    Icon: OliveBranchIcon,
    roman: "IV" as const,
  },
] as const;

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let heroUrl: string | null = null;
  let apartments: typeof MOCK_APARTMENTS = MOCK_APARTMENTS;
  let posts: BlogPost[] = [];
  let communityPhotos: { id: string; signedUrl: string; caption: string }[] = [];

  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const client = await createServerClient();
      const settings = await getSiteSettings(client);
      if (settings?.heroImagePath) {
        heroUrl = publicSiteMediaUrl(settings.heroImagePath);
      }

      const apts = await getApartments(client);
      if (apts.length > 0) apartments = apts;

      posts = await getBlogPosts(client, { limit: 3 });
    } catch (err) {
      console.warn("home: fallback partial:", err);
    }

    try {
      const adminClient = createServiceClient();
      const photos = await getApprovedCommunityPhotosWithUrls(adminClient);
      communityPhotos = photos.slice(0, 6).map((p) => ({
        id: p.id,
        signedUrl: p.signedUrl,
        caption: p.caption,
      }));
    } catch (err) {
      console.warn("home community photos:", err);
    }
  }

  return (
    <>
      <HeroSection imageUrl={heroUrl} />

      {/* ───── II. APARTAMENTY ───────────────────────────────── */}
      <SectionDivider motto="dolce far niente" className="mx-auto max-w-6xl px-6" />

      <section
        id="apartamenty"
        className="mx-auto max-w-6xl px-6 pb-20"
        aria-labelledby="apartamenty-heading"
      >
        <div className="grid items-end gap-6 md:grid-cols-[auto,1fr,auto]">
          <RomanBadge numeral="II" size="lg" variant="gold" />
          <div>
            <p className="text-eyebrow text-gold">Apartamenty</p>
            <h2
              id="apartamenty-heading"
              className="heading-section mt-2 text-4xl text-ink md:text-6xl"
            >
              Dwa miejsca, <span className="italic text-olive">dwa charaktery</span>.
            </h2>
            <p className="heading-italic mt-3 text-lg text-stone">
              <span className="not-italic text-gold">·</span> due dimore, due caratteri
            </p>
          </div>
          <Link
            href="/apartments"
            className="link-italic font-display italic text-terracotta hover:text-wine"
          >
            Zobacz oba →
          </Link>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {apartments.map((apartment, idx) => (
            <ApartmentCard
              key={apartment.id}
              apartment={apartment}
              heroSrc={
                MOCK_APARTMENT_HERO[apartment.slug] ?? "/placeholders/orte-1.svg"
              }
              nextAvailability={MOCK_NEXT_AVAILABLE[apartment.slug]}
              numeral={idx === 0 ? "I" : "II"}
            />
          ))}
        </div>
      </section>

      {/* ───── III. PRZEWODNIK ───────────────────────────────── */}
      <SectionDivider motto="piano, piano" className="mx-auto max-w-6xl px-6" />

      <section
        className="border-y border-gold/30 bg-paper/40"
        aria-labelledby="guida-heading"
      >
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="flex items-end gap-6">
            <RomanBadge numeral="III" size="lg" variant="gold" />
            <div>
              <p className="text-eyebrow text-gold">Przewodnik</p>
              <h2
                id="guida-heading"
                className="heading-section mt-2 text-4xl text-ink md:text-6xl"
              >
                Co robić <span className="italic text-olive">w Bellaorte</span>.
              </h2>
              <p className="heading-italic mt-3 text-lg text-stone">
                <span className="not-italic text-gold">·</span> lokalne wskazówki, sprawdzone miejsca
              </p>
            </div>
          </div>

          <ul className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {GUIDE_LINKS.map(({ href, label, blurb, Icon, roman }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="group flex h-full flex-col gap-4 border border-gold/30 bg-crema p-7 transition-all hover:border-gold hover:shadow-warm-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-gold/40 text-olive">
                      <Icon size={24} />
                    </span>
                    <span className="badge-roman text-2xl text-gold/60">
                      {roman}
                    </span>
                  </div>
                  <p className="font-display text-3xl text-ink">{label}</p>
                  <p className="text-sm text-cypress/80">{blurb}</p>
                  <span className="mt-auto inline-flex items-center gap-1 font-display italic text-terracotta">
                    Otwórz
                    <ArrowRight
                      size={14}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ───── IV. BLOG ───────────────────────────────── */}
      {posts.length > 0 && (
        <>
          <SectionDivider motto="ogni giorno una storia" className="mx-auto max-w-6xl px-6" />

          <section className="mx-auto max-w-6xl px-6 py-20" aria-labelledby="diario-heading">
            <div className="flex items-end justify-between gap-6">
              <div className="flex items-end gap-6">
                <RomanBadge numeral="IV" size="lg" variant="gold" />
                <div>
                  <p className="text-eyebrow text-gold">Blog</p>
                  <h2
                    id="diario-heading"
                    className="heading-section mt-2 text-4xl text-ink md:text-6xl"
                  >
                    Notatki <span className="italic text-olive">z Orte</span>.
                  </h2>
                  <p className="heading-italic mt-3 text-lg text-stone">
                    <span className="not-italic text-gold">·</span> krótkie wpisy o tym, co u nas
                  </p>
                </div>
              </div>
              <Link
                href="/blog"
                className="link-italic hidden font-display italic text-terracotta hover:text-wine md:inline-flex"
              >
                Cały blog →
              </Link>
            </div>

            <ul className="mt-12 grid gap-8 md:grid-cols-3">
              {posts.map((post, idx) => (
                <li key={post.id}>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
                  >
                    {post.heroImagePath ? (
                      <div className="relative aspect-[4/3] overflow-hidden border border-gold/30 bg-paper">
                        <Image
                          src={publicSiteMediaUrl(post.heroImagePath)}
                          alt=""
                          fill
                          unoptimized
                          sizes="(min-width: 768px) 33vw, 100vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="flex aspect-[4/3] items-center justify-center border border-gold/30 bg-paper text-stone">
                        <Newspaper size={32} aria-hidden="true" />
                      </div>
                    )}
                    <p className="mt-5 text-eyebrow text-gold">
                      Nr {idx + 1} · {formatDate(post.publishedAt)}
                    </p>
                    <h3 className="font-display mt-2 text-2xl text-ink transition-colors group-hover:text-terracotta">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="mt-2 line-clamp-2 text-sm text-cypress/80">
                        {post.excerpt}
                      </p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-10 text-center md:hidden">
              <Link
                href="/blog"
                className="link-italic font-display italic text-terracotta hover:text-wine"
              >
                Cały blog →
              </Link>
            </div>
          </section>
        </>
      )}

      {/* ───── V. WASZE ZDJĘCIA ───────────────────────────── */}
      {communityPhotos.length > 0 && (
        <>
          <SectionDivider motto="il viaggio è meglio condiviso" className="mx-auto max-w-6xl px-6" />

          <section
            className="border-y border-gold/30 bg-cypress text-soft-green"
            aria-labelledby="galleria-heading"
          >
            <div className="mx-auto max-w-6xl px-6 py-20">
              <div className="flex items-end justify-between gap-6">
                <div className="flex items-end gap-6">
                  <RomanBadge numeral="V" size="lg" variant="terracotta" />
                  <div>
                    <p className="text-eyebrow text-gold-soft">Wasze zdjęcia</p>
                    <h2
                      id="galleria-heading"
                      className="heading-section mt-2 text-4xl text-soft-green md:text-6xl"
                    >
                      <span className="italic text-terracotta-soft">Wasze</span> spojrzenia.
                    </h2>
                    <p className="heading-italic mt-3 text-lg text-soft-green/70">
                      <span className="not-italic text-gold-soft">·</span> z apartamentu, z Orte, z wycieczek
                    </p>
                  </div>
                </div>
                <Link
                  href="/wasze-zdjecia"
                  className="link-italic font-display italic text-gold-soft hover:text-terracotta-soft"
                >
                  Cała galeria →
                </Link>
              </div>

              <ul className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {communityPhotos.map((photo) => (
                  <li
                    key={photo.id}
                    className="group relative aspect-square overflow-hidden border border-gold/20"
                  >
                    <Image
                      src={photo.signedUrl}
                      alt={photo.caption || "Zdjęcie od gości"}
                      fill
                      unoptimized
                      sizes="(min-width: 1024px) 16vw, (min-width: 640px) 33vw, 50vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </>
      )}

      {/* ───── VI. MAPA REGIONU ─────────────────────────── */}
      <SectionDivider motto="dove siamo" className="mx-auto max-w-6xl px-6" />

      <section className="mx-auto max-w-6xl px-6 py-20" aria-labelledby="mapa-heading">
        <div className="grid gap-12 md:grid-cols-[1fr,1.4fr] md:items-center">
          <div>
            <RomanBadge numeral="VI" size="lg" variant="gold" />
            <p className="text-eyebrow mt-6 text-gold">Lokalizacja</p>
            <h2
              id="mapa-heading"
              className="heading-section mt-2 text-4xl text-ink md:text-5xl"
            >
              W sercu <span className="italic text-olive">Tuscia</span>.
            </h2>
            <p className="heading-italic mt-3 text-lg text-stone">
              <span className="not-italic text-gold">·</span> kraina cyprysów i tufowych wzgórz
            </p>

            <ul className="mt-8 space-y-4 text-cypress">
              <li className="flex items-start gap-4">
                <span className="mt-1 h-2 w-2 rounded-full bg-terracotta" />
                <div>
                  <p className="font-display text-lg text-ink">Orte</p>
                  <p className="text-sm text-cypress/75">Średniowieczne miasteczko nad Tybrem, nasz dom.</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <span className="mt-1 h-2 w-2 rounded-full bg-olive" />
                <div>
                  <p className="font-display text-lg text-ink">Bomarzo i Civita di Bagnoregio</p>
                  <p className="text-sm text-cypress/75">25 i 50 minut autem — Park Potworów i „umierające miasto”.</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <span className="mt-1 h-2 w-2 rounded-full bg-gold" />
                <div>
                  <p className="font-display text-lg text-ink">Rzym</p>
                  <p className="text-sm text-cypress/75">60 minut pociągiem ze stacji Orte. Bezpośrednio.</p>
                </div>
              </li>
            </ul>

            <div className="mt-8 flex items-center gap-4">
              <TricoloreRule size="lg" />
              <p className="font-display text-sm italic text-stone">
                Provincia di Viterbo, Lazio
              </p>
            </div>
          </div>

          <div className="relative">
            <div
              aria-hidden="true"
              className="absolute -inset-4 -z-10 border border-gold/40"
            />
            <div className="bg-paper p-6 text-olive">
              <TuscanyMap className="h-auto w-full" />
            </div>
            <p className="mt-3 text-center font-display text-xs italic text-stone">
              Schematyczna mapa regionu, nie do nawigacji
            </p>
          </div>
        </div>
      </section>

      {/* ───── DOSTĘPNOŚĆ — finalny CTA ─────────────────────── */}
      <SectionDivider motto="vi aspettiamo" className="mx-auto max-w-6xl px-6" />

      <section className="mx-auto max-w-3xl px-6 pb-24 pt-4 text-center">
        <p className="text-eyebrow text-gold">Dostępność</p>
        <h2 className="heading-section mt-3 text-4xl text-ink md:text-5xl">
          Termin sprawdzasz w <span className="italic text-olive">trzydzieści sekund</span>.
        </h2>
        <p className="text-ui mt-5 text-cypress/85">
          Kalendarz pokazuje, kiedy apartament jest wolny. Zapytanie wysyłasz
          przez formularz — odpowiadamy mailem, bez płatności online.
        </p>
        <Link
          href="/booking"
          className="group mt-10 inline-flex items-center gap-3 border-2 border-olive bg-olive px-9 py-4 font-display text-base text-crema shadow-warm transition-all hover:border-olive-deep hover:bg-olive-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        >
          <span className="text-gold-soft">·</span>
          <span>Otwórz kalendarz</span>
          <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
        </Link>
      </section>
    </>
  );
}
