/* ============================================================================
   THE SHAPES A FORM AND ITS ACTION HAVE TO AGREE ON
   ----------------------------------------------------------------------------
   A `'use server'` module may export nothing but async functions — Next enforces
   it, because every export becomes a callable endpoint reference. So the field
   names and the initial state that the actions and their forms share cannot
   live beside the actions, and they live here instead.

   That constraint is worth respecting rather than working around. These values
   are a contract between two files, and a contract is easier to keep when it is
   written down in one place that neither side owns.
   ========================================================================== */

/**
 * The settings form's input names.
 *
 * Read by `updateSiteSettings` and rendered by `SettingsForm`. They must match
 * exactly: an unchecked checkbox posts nothing at all, so a toggle whose `name`
 * has drifted is indistinguishable from a toggle that is switched off — the
 * clinic would turn a flag on, save, and watch it come back off with no error
 * anywhere.
 */
export const SETTINGS_FIELDS = {
  maintenanceMode: 'maintenance_mode',
  allowAppointments: 'allow_appointments',
  allowTestimonials: 'allow_testimonials',
  allowContactForm: 'allow_contact_form',
} as const;

/**
 * What the sign-in form shows between attempts.
 *
 * `field` steers the error to the input the person can actually fix. A rejected
 * credential points at the password rather than the address, because "one of
 * these two is wrong" is not something the server is willing to be specific
 * about and the password is the one worth retyping.
 */
export type LoginState =
  | { status: 'idle' }
  | { status: 'error'; message: string; field?: 'email' | 'password' };

export const LOGIN_INITIAL_STATE: LoginState = { status: 'idle' };
