/**
 * `PATCH /api/admin/settings` — update the singleton site_settings row.
 *
 * Wymagania pokryte: 37.
 */

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/lib/auth/require-admin';
import { createServiceClient } from '@/lib/supabase/admin';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface PatchBody {
  contactEmail?: string;
  contactPhone?: string | null;
  footerAddress?: string;
  privacyPolicyMd?: string;
  consentTextBooking?: string;
  consentTextReview?: string;
  consentTextPhoto?: string;
}

export async function PATCH(request: Request) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: 'Nieprawidłowy JSON' }, { status: 400 });
  }

  if (body.contactEmail !== undefined && !EMAIL_RE.test(body.contactEmail)) {
    return NextResponse.json(
      { errors: [{ field: 'contactEmail', message: 'Nieprawidłowy email' }] },
      { status: 400 },
    );
  }

  const update: Record<string, unknown> = {};
  if (body.contactEmail !== undefined) update.contact_email = body.contactEmail;
  if (body.contactPhone !== undefined) update.contact_phone = body.contactPhone;
  if (body.footerAddress !== undefined) update.footer_address = body.footerAddress;
  if (body.privacyPolicyMd !== undefined) update.privacy_policy_md = body.privacyPolicyMd;
  if (body.consentTextBooking !== undefined) update.consent_text_booking = body.consentTextBooking;
  if (body.consentTextReview !== undefined) update.consent_text_review = body.consentTextReview;
  if (body.consentTextPhoto !== undefined) update.consent_text_photo = body.consentTextPhoto;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Brak pól do zmiany' }, { status: 400 });
  }

  const client = createServiceClient();
  const { error } = await client.from('site_settings').update(update).eq('id', 1);
  if (error) {
    return NextResponse.json(
      { error: `Nie udało się zapisać ustawień: ${error.message}` },
      { status: 500 },
    );
  }

  revalidatePath('/', 'layout');

  return NextResponse.json({ ok: true });
}
