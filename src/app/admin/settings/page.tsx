/**
 * `/admin/settings` — site-wide settings editor.
 *
 * Wymagania pokryte: 37, 43.
 */

import { createServerClient } from '@/lib/supabase/server';
import { getSiteSettings } from '@/lib/data/settings';
import { publicSiteMediaUrl } from '@/lib/data/apartments';
import { SettingsForm } from '@/components/admin/SettingsForm';
import { HeroUploader } from '@/components/admin/HeroUploader';

const FALLBACK = {
  id: 1 as const,
  contactEmail: 'kontakt@bellaorte.example',
  contactPhone: '',
  footerAddress: 'Orte, Prowincja Viterbo, Włochy',
  privacyPolicyMd: '',
  consentTextBooking: '',
  consentTextReview: '',
  consentTextPhoto: '',
  heroImagePath: null,
  updatedAt: new Date().toISOString(),
};

export default async function AdminSettingsPage() {
  const client = await createServerClient();
  let settings = await getSiteSettings(client).catch(() => null);
  if (!settings) settings = FALLBACK;
  const heroUrl = settings.heroImagePath ? publicSiteMediaUrl(settings.heroImagePath) : null;

  return (
    <div className="space-y-10">
      <header>
        <p className="text-eyebrow">Ustawienia</p>
        <h1 className="heading-display mt-2 text-3xl text-ink">
          Ustawienia witryny
        </h1>
        <p className="text-ui mt-2 max-w-2xl text-cypress/80">
          Kontakt, stopka, polityka prywatności oraz teksty zgód RODO
          renderowane w formularzach. Zmiany pojawiają się publicznie po
          zapisaniu.
        </p>
      </header>

      <section>
        <h2 className="heading-section text-2xl text-ink">Tło hero strony głównej</h2>
        <p className="text-ui mt-2 max-w-2xl text-sm text-cypress/80">
          Zdjęcie wyświetlane na samej górze strony głównej. Najlepiej
          panoramiczne (proporcje 16:9), JPEG/PNG/WebP, do 8 MB.
        </p>
        <div className="mt-4">
          <HeroUploader currentUrl={heroUrl} />
        </div>
      </section>

      <SettingsForm initial={settings} />
    </div>
  );
}
