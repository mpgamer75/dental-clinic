import { PageHeader } from '@/components/admin/page-header';
import { SettingsForm } from '@/components/admin/settings-form';
import { ErrorPanel } from '@/components/admin/states';

import { getSiteSettings } from '../../_lib/queries';

/* ============================================================================
   /admin/settings
   ----------------------------------------------------------------------------
   `app.site_settings` is one row of four booleans. This page reads and writes
   it; the public site honours it (src/lib/site-settings.ts), and the save
   action revalidates every public page so a change shows on the next request.

   It is deliberately short. A settings screen that grows a tab bar is a
   settings screen where the important switch — the one that takes the public
   site down — is three clicks from anywhere, and this practice has exactly four
   things to decide.
   ========================================================================== */

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const settings = await getSiteSettings();

  return (
    <>
      <PageHeader
        eyebrow="Ajustes"
        title="Configuración del sitio"
        description="Qué puede hacer un visitante en el sitio público. Cada cambio queda registrado con la cuenta que lo hizo."
      />

      <div className="max-w-3xl">
        {settings.ok ? (
          <SettingsForm settings={settings.data} />
        ) : (
          <ErrorPanel
            title="No se pudo leer la configuración del sitio"
            detail={settings.detail}
          />
        )}
      </div>
    </>
  );
}
