/**
 * Public availability data layer.
 *
 * `getAvailability` is the SOLE read path that the public site uses to
 * learn which dates are taken for a given apartment. Internally it calls
 * the `public.get_availability(p_apartment_id, p_from, p_to)` Postgres
 * RPC (defined in `supabase/schema.sql`, task 2.2) which folds three
 * privacy-sensitive tables (`reservations`, `calendar_blocks`,
 * `booking_inquiries`) into one PII-free `(date, status)` projection
 * with priority `blocked > reserved > pending > available`.
 *
 * The function is intentionally client-agnostic: callers pass either the
 * cookies-aware server client (for Server Components / Route Handlers
 * facing `anon` traffic) or the service-role client (for admin views).
 * Picking the right client is the caller's responsibility.
 *
 * Wymagania pokryte: 7, 8, 42.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import type { DayStatus, DayStatusEntry } from '@/lib/types';

// Re-export the calendar status types so callers in this layer can stay
// on `@/lib/data/availability` without reaching into `@/lib/types`.
export type { DayStatus, DayStatusEntry };

/** Set of valid `DayStatus` values, used for runtime validation of RPC rows. */
const DAY_STATUS_VALUES: ReadonlySet<DayStatus> = new Set<DayStatus>([
  'available',
  'pending',
  'reserved',
  'blocked',
]);

/** Raw row shape returned by `public.get_availability`. */
interface GetAvailabilityRow {
  date: string;
  status: string;
}

/**
 * Fetch the day-by-day availability for an apartment in a date window.
 *
 * The window is inclusive on both ends (`from` and `to`). Both dates MUST
 * be ISO `YYYY-MM-DD` strings; the RPC enforces a max window of 366 days
 * and rejects `from > to`. Errors from the RPC are surfaced as thrown
 * errors so the caller can map them to the appropriate HTTP status.
 *
 * The returned array NEVER contains guest PII — only `{ date, status }`
 * pairs (Wymaganie 42).
 *
 * @param client       Supabase client (anon or service role).
 * @param apartmentId  UUID of the apartment.
 * @param from         Window start date, ISO `YYYY-MM-DD`, inclusive.
 * @param to           Window end date, ISO `YYYY-MM-DD`, inclusive.
 */
export async function getAvailability(
  client: SupabaseClient,
  apartmentId: string,
  from: string,
  to: string,
): Promise<DayStatusEntry[]> {
  const { data, error } = await client.rpc('get_availability', {
    p_apartment_id: apartmentId,
    p_from: from,
    p_to: to,
  });

  if (error) {
    throw new Error(
      `getAvailability: RPC get_availability failed: ${error.message}`,
    );
  }

  if (data == null) {
    return [];
  }

  if (!Array.isArray(data)) {
    throw new Error(
      'getAvailability: RPC get_availability returned a non-array payload',
    );
  }

  const rows = data as GetAvailabilityRow[];

  return rows.map((row, index) => {
    if (typeof row?.date !== 'string' || typeof row?.status !== 'string') {
      throw new Error(
        `getAvailability: row ${index} from RPC is missing date/status fields`,
      );
    }
    if (!DAY_STATUS_VALUES.has(row.status as DayStatus)) {
      throw new Error(
        `getAvailability: row ${index} has unknown status "${row.status}"`,
      );
    }
    return {
      date: row.date,
      status: row.status as DayStatus,
    };
  });
}
