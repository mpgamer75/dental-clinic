import { Clock, MapPin, Phone } from 'lucide-react';

import { WhatsAppIcon } from '@/components/icons/whatsapp';
import { Button } from '@/components/ui/button';
import { TEL_HREF, contactLinkLabels, whatsappHref } from '@/lib/contact';
import { contactDetails } from '@/lib/data';
import type { Language } from '@/lib/types';

const COPY = {
  es: {
    title: 'Estamos actualizando el sitio',
    body: 'Volvemos enseguida. Mientras tanto, la consulta atiende con normalidad: para pedir cita o hacer una pregunta, llámenos o escríbanos por WhatsApp.',
  },
  en: {
    title: 'We are updating the site',
    body: 'We will be back shortly. The practice is open as usual in the meantime: to book or ask a question, call us or message us on WhatsApp.',
  },
} as const;

/**
 * What every public page shows while the clinic has maintenance mode on.
 *
 * The admin panel's switch has always promised that "el sitio público muestra
 * un aviso de mantenimiento en lugar del contenido habitual" — and until the
 * site layout read the setting, nothing happened when it was flipped. The
 * notice keeps what a patient actually needs while the site is down: how to
 * reach the clinic today.
 */
export function MaintenanceNotice({ lang }: { lang: Language }) {
  const copy = COPY[lang];
  const links = contactLinkLabels(lang);

  return (
    <section className="shell py-[clamp(4rem,10vw,8rem)]">
      <div className="max-w-2xl">
        <h1 className="font-heading text-h2 font-medium text-ink">{copy.title}</h1>
        <p className="mt-5 max-w-measure text-body leading-relaxed text-ink-soft">{copy.body}</p>

        <div className="mt-9 flex flex-wrap gap-3">
          <Button asChild size="xl">
            <a href={TEL_HREF} aria-label={links.callAria}>
              <Phone className="h-5 w-5" aria-hidden="true" />
              <span className="tabular">{links.phone}</span>
            </a>
          </Button>
          <Button asChild size="xl" variant="outline">
            <a href={whatsappHref(lang)} aria-label={links.whatsappAria} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon className="h-5 w-5" />
              {links.whatsapp}
            </a>
          </Button>
        </div>

        <ul className="mt-10 space-y-4 border-t border-line pt-7 text-ink-soft">
          <li className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brass-ink" aria-hidden="true" />
            {contactDetails.address[lang]}
          </li>
          <li className="flex items-start gap-3">
            <Clock className="mt-0.5 h-5 w-5 shrink-0 text-brass-ink" aria-hidden="true" />
            {contactDetails.schedule[lang]}
          </li>
        </ul>
      </div>
    </section>
  );
}
