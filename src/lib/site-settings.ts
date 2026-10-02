import 'server-only';

import { cache } from 'react';
import { eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { formatDatabaseFailure } from '@/lib/db-errors';
import { SITE_SETTINGS_ID, siteSettings } from '@/lib/schema';

/* ============================================================================
   PUBLIC SITE SETTINGS — the switches the admin panel promises
   ----------------------------------------------------------------------------
   The panel's Configuración page has offered four switches since it was built:
   maintenance mode, and on/off for online appointment requests, the contact
   form and new testimonials. Each says what a visitor will experience when it
   is off. Until this module existed nothing outside the panel read the row, so
   a clinic that closed online requests for a holiday kept receiving them, and
   patients who sent one believed they were booked.

   Two readers, two jobs:

     - Pages read it to decide what to RENDER (the form, or "llámenos").
       They are static or ISR, and the admin save action revalidates them, so
       a change shows on the next request rather than the next deploy.
     - Server actions read it to decide what to ACCEPT. That is the control:
       a page rendered a minute before the switch was flipped still has a live
       form in somebody's browser.

   FAILS OPEN. If the row cannot be read the site behaves as if every switch is
   on. A database the settings cannot be read from is a database the form
   cannot write to either, so the visitor still gets an honest error from the
   action — whereas failing closed would silently take the clinic's booking
   form offline every time Neon is slow to wake from suspend.

   Not `@/app/(admin)/admin/_lib/queries.getSiteSettings`: that read is
   authorised for staff only, and these pages are public.
   ========================================================================== */

export interface PublicSiteSettings {
  maintenanceMode: boolean;
  allowAppointments: boolean;
  allowContactForm: boolean;
  allowTestimonials: boolean;
}

const OPEN: PublicSiteSettings = {
  maintenanceMode: false,
  allowAppointments: true,
  allowContactForm: true,
  allowTestimonials: true,
};

async function readSettings(): Promise<PublicSiteSettings> {
  try {
    const [row] = await db
      .select({
        maintenanceMode: siteSettings.maintenanceMode,
        allowAppointments: siteSettings.allowAppointments,
        allowContactForm: siteSettings.allowContactForm,
        allowTestimonials: siteSettings.allowTestimonials,
      })
      .from(siteSettings)
      .where(eq(siteSettings.id, SITE_SETTINGS_ID))
      .limit(1);

    return row ?? OPEN;
  } catch (error) {
    console.error('[settings] public read failed, failing open: %s', formatDatabaseFailure(error));
    return OPEN;
  }
}

/** Memoised per render: the layout, the page and its sections share one read. */
export const getPublicSiteSettings = cache(readSettings);
