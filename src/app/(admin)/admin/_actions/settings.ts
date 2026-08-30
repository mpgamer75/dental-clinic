'use server';

/* ============================================================================
   SITE SETTINGS
   ----------------------------------------------------------------------------
   `app.site_settings` has held four real feature flags since migration 0001 and
   nothing in the application has ever read or written them. This action is the
   write half; the panel's Ajustes page is the read half.

   All four booleans are written on every save, from the posted form, and none
   is inferred from what is already stored. That is deliberate: an unchecked
   checkbox posts NOTHING, so a "only update the fields that are present"
   implementation can never turn a flag off — the clinic would close its
   appointment form, see the toggle spring back, and conclude the panel is
   broken. `formFlag` reads absence as `false` for exactly this reason.
   ========================================================================== */

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';

import { recordAudit } from '@/lib/audit';
import { db } from '@/lib/db';
import { formatDatabaseFailure } from '@/lib/db-errors';
import { SITE_SETTINGS_ID, siteSettings } from '@/lib/schema';

import { SETTINGS_FIELDS } from '../_lib/form-contracts';
import {
  MUTATION_MESSAGES,
  formFlag,
  guardAdminMutation,
  type MutationResult,
} from '../_lib/mutation';

const auditColumns = {
  maintenanceMode: siteSettings.maintenanceMode,
  allowAppointments: siteSettings.allowAppointments,
  allowTestimonials: siteSettings.allowTestimonials,
  allowContactForm: siteSettings.allowContactForm,
} as const;

export async function updateSiteSettings(formData: FormData): Promise<MutationResult> {
  const guard = await guardAdminMutation(formData);
  if (!guard.ok) return guard.failure;

  const next = {
    maintenanceMode: formFlag(formData, SETTINGS_FIELDS.maintenanceMode),
    allowAppointments: formFlag(formData, SETTINGS_FIELDS.allowAppointments),
    allowTestimonials: formFlag(formData, SETTINGS_FIELDS.allowTestimonials),
    allowContactForm: formFlag(formData, SETTINGS_FIELDS.allowContactForm),
  };

  let outcome:
    | { kind: 'missing' }
    | { kind: 'ok'; before: Record<string, unknown>; after: Record<string, unknown> };

  try {
    outcome = await db.transaction(async (tx) => {
      const [before] = await tx
        .select(auditColumns)
        .from(siteSettings)
        .where(eq(siteSettings.id, SITE_SETTINGS_ID))
        .limit(1);

      /* No row means migration 0001's seed INSERT never ran here. Creating one
         on the fly would hide a half-applied migration behind a working screen,
         so this reports the fault instead. */
      if (!before) return { kind: 'missing' } as const;

      const changed = await tx
        .update(siteSettings)
        .set({
          ...next,
          updatedAt: new Date(),
          updatedBy: guard.actor.email,
        })
        .where(eq(siteSettings.id, SITE_SETTINGS_ID))
        .returning(auditColumns);

      if (changed.length === 0) return { kind: 'missing' } as const;

      return { kind: 'ok', before, after: changed[0] } as const;
    });
  } catch (error) {
    console.error('[admin] site settings update failed: %s', formatDatabaseFailure(error));
    return { ok: false, message: MUTATION_MESSAGES.database };
  }

  if (outcome.kind === 'missing') {
    return {
      ok: false,
      message:
        'No existe la fila de configuración del sitio. Aplique las migraciones de la base de datos.',
    };
  }

  /* Whole rows on both sides. There is no personal data in this table, so this
     is the one audit entry that can be a complete before-and-after — and it is
     the one where "which flag did they change?" is the whole question. */
  await recordAudit({
    action: 'site_settings.updated',
    entity: 'site_settings',
    entityId: 'site',
    before: outcome.before,
    after: outcome.after,
  });

  revalidatePath('/admin', 'layout');
  /* The flags govern the public site, so its cached pages have to be rebuilt
     the moment one changes — a maintenance banner that appears five minutes
     from now is not a maintenance banner. */
  revalidatePath('/[lang]', 'page');

  return { ok: true, message: 'Configuración guardada.' };
}
