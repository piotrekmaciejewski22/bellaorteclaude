export const dynamic = 'force-dynamic';

/**
 * `/wasze-zdjecia` — galeria od gości i znajomych.
 */

import { createServerClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';
import { getApprovedCommunityPhotosWithUrls } from '@/lib/data/community-photos';
import { getSiteSettings } from '@/lib/data/settings';
import { CommunityGallery } from '@/components/public/CommunityGallery';
import { CommunityPhotoUploader } from '@/components/public/CommunityPhotoUploader';

const FALLBACK_CONSENT =
  'Oświadczam, że posiadam prawa do wgrywanego zdjęcia i wyrażam zgodę na jego publikację po zatwierdzeniu.';

export default async function CommunityPhotosPage() {
  let photos: Awaited<ReturnType<typeof getApprovedCommunityPhotosWithUrls>> = [];
  let consentText = FALLBACK_CONSENT;
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      // Service role do generowania signed URL z prywatnego bucketa
      // guest-media. Anon nie zobaczy klucza — wszystko jest serwerowe.
      const adminClient = createServiceClient();
      photos = await getApprovedCommunityPhotosWithUrls(adminClient);

      const client = await createServerClient();
      const settings = await getSiteSettings(client);
      if (settings?.consentTextPhoto) consentText = settings.consentTextPhoto;
    } catch (err) {
      console.warn('community photos:', err);
    }
  }

  return (
    <div className="bg-ivory">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-eyebrow">Galeria gości</p>
        <h1 className="heading-display mt-2 text-5xl text-ink md:text-6xl">
          Wasze zdjęcia
        </h1>
        <p className="text-ui mt-6 max-w-2xl text-cypress/80">
          Zdjęcia od gości i znajomych — z apartamentu, z Orte, z wycieczek po
          regionie. Każde czeka na moderację, więc daj nam chwilę.
        </p>

        <div className="mt-10 max-w-2xl">
          <CommunityPhotoUploader consentText={consentText} />
        </div>

        <section className="mt-14">
          <CommunityGallery
            photos={photos.map((p) => ({
              id: p.id,
              signedUrl: p.signedUrl,
              caption: p.caption,
              contributorName: p.contributorName,
              locationLabel: p.locationLabel,
              createdAt: p.createdAt,
            }))}
          />
        </section>
      </div>
    </div>
  );
}
