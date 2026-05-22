/**
 * Seed apartamentów — wgrywa zdjęcia hero apartamentów z folderu
 * `C:\Users\macie\Downloads\ORTE ZDJECIA\apartament1.jpg` i `apartament2.jpg`
 * do bucketa `site-media` i dodaje wiersze do `gallery_photos` z
 * `source_kind = 'interior_real'` aby pojawiły się jako pierwsze zdjęcia
 * w galeriach apartamentów (Wym. 40 — gdy istnieje co najmniej jedno
 * `interior_real`, galeria pokazuje tylko prawdziwe wnętrza).
 *
 * Uruchom: `npx tsx scripts/seed-apartments.ts`
 */

import { createClient } from '@supabase/supabase-js';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';

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

const SOURCE_DIR = 'C:\\Users\\macie\\Downloads\\ORTE ZDJECIA';

interface ApartmentSeed {
  slug: string;
  filename: string;
  alt: string;
  galleryId: string;
}

const APARTMENTS: ApartmentSeed[] = [
  {
    slug: 'casa-orte-uno',
    filename: 'apartament1.jpg',
    alt: 'Wnętrze Casa Orte Uno',
    galleryId: 'aaaaaaaa-1111-4111-8111-111111111101',
  },
  {
    slug: 'casa-orte-due',
    filename: 'apartament2.jpg',
    alt: 'Wnętrze Casa Orte Due',
    galleryId: 'aaaaaaaa-2222-4222-8222-222222222202',
  },
];

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Seed apartamentów — Bellaorte');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  for (const apt of APARTMENTS) {
    console.log(`\n— Apartament: ${apt.slug}`);

    const localPath = path.join(SOURCE_DIR, apt.filename);
    if (!existsSync(localPath)) {
      console.error(`  ✗ Brak pliku: ${localPath}`);
      process.exit(1);
    }

    const buffer = await readFile(localPath);
    const storagePath = `apartments/${apt.slug}/interior-real-${Date.now()}.jpg`;

    // 1. Upload zdjęcia
    const uploadResult = await supabase.storage
      .from('site-media')
      .upload(storagePath, buffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadResult.error) {
      console.error(`  ✗ Upload nie powiódł się: ${uploadResult.error.message}`);
      process.exit(1);
    }
    console.log(`  ✓ Uploaded: ${apt.filename} → ${storagePath}`);

    // 2. Pobierz id apartamentu
    const apartmentResult = await supabase
      .from('apartments')
      .select('id')
      .eq('slug', apt.slug)
      .maybeSingle();

    if (apartmentResult.error || !apartmentResult.data) {
      console.error(
        `  ✗ Nie znaleziono apartamentu o slug="${apt.slug}": ${apartmentResult.error?.message ?? 'brak wiersza'}`,
      );
      process.exit(1);
    }
    const apartmentId = (apartmentResult.data as { id: string }).id;

    // 3. Upsert w gallery_photos jako interior_real, display_order=0 (pierwsze)
    const upsertResult = await supabase.from('gallery_photos').upsert(
      {
        id: apt.galleryId,
        apartment_id: apartmentId,
        storage_path: storagePath,
        alt: apt.alt,
        source_kind: 'interior_real',
        display_order: 0,
      },
      { onConflict: 'id' },
    );

    if (upsertResult.error) {
      console.error(`  ✗ Wpis w gallery_photos nie powiódł się: ${upsertResult.error.message}`);
      process.exit(1);
    }
    console.log(`  ✓ Wpis w gallery_photos zapisany jako interior_real`);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Gotowe. Sprawdź /apartments na stronie.');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
