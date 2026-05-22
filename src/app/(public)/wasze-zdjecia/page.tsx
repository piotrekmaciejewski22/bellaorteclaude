export const dynamic = 'force-dynamic';

import { createServerClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';
import { getApprovedCommunityPhotosWithUrls } from '@/lib/data/community-photos';
import { getSiteSettings } from '@/lib/data/settings';
import { CommunityGallery } from '@/components/public/CommunityGallery';
import { CommunityPhotoUploader } from '@/components/public/CommunityPhotoUploader';
import { SectionDivider } from '@/components/public/decorative/SectionDivider';
import { TricoloreRule } from '@/components/public/decorative/TricoloreRule';
import { OliveBranchIcon } from '@/components/public/decorative/ItalianIcons';

const FALLBACK_CONSENT =
  'Oświadczam, że posiadam prawa do wgrywanego zdjęcia i wyrażam zgodę na jego publikację po zatwierdzeniu.';

export default async function CommunityPhotosPage() {
  let photos: Awaited<ReturnType<typeof getApprovedCommunityPhotosWithUrls>> = [];
  let consentText = FALLBACK_CONSENT;
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
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
    <div className="bg-crema">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex items-center gap-3">
          <span className="text-eyebrow text-gold">Galeria gości</span>
          <TricoloreRule size="md" />
        </div>

        <div className="mt-5 flex items-end gap-4">
          <OliveBranchIcon size={42} className="text-olive shrink-0" />
          <h1 className="heading-display text-5xl text-ink md:text-7xl">
            Wasze <span className="italic text-terracotta">zdjęcia</span>
          </h1>
        </div>
        <p className="text-motto mt-3 text-lg md:text-xl">— il viaggio è meglio condiviso —</p>

        <p className="text-ui mt-6 max-w-2xl text-cypress/85">
          Zdjęcia od gości i znajomych — z apartamentu, z Orte, z wycieczek po
          regionie. Każde czeka na moderację, więc daj nam chwilę.
        </p>

        <SectionDivider motto="grazie per condividere" />

        <div className="grid gap-12 lg:grid-cols-[1fr,2fr]">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <CommunityPhotoUploader consentText={consentText} />
          </div>
          <div>
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
          </div>
        </div>
      </div>
    </div>
  );
}
