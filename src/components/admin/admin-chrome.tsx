'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { ExternalLink, Menu } from 'lucide-react';

import { ToothIcon } from '@/components/icons/dental';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ThemeToggleButton } from '@/components/theme-toggle-button';
import { cn } from '@/lib/utils';

import { ADMIN_NAV, isNavItemActive, type NavBadgeCounts } from './nav-items';
import { SignOutButton } from './sign-out-button';

/* ============================================================================
   THE FRAME
   ----------------------------------------------------------------------------
   A drenched rail on the left from `lg` up, a top bar and a drawer below it.
   The rail uses the sidebar-* tokens, which already ARE the drench palette (see
   globals.css) — so the panel reads as the same building as the public site's
   dark bands rather than as a second product bolted to the side of it.

   Nothing here is a layout animation. The drawer is Radix's, which translates
   and fades; the rail does not resize, collapse or push the content. A sidebar
   that animates its own width repaints the entire page on every frame of the
   transition, and on the mid-range Android the front desk actually uses that is
   the difference between a panel that feels instant and one that stutters
   before it will let you press anything.
   ========================================================================== */

function NavList({ badges, onNavigate }: { badges: NavBadgeCounts; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Secciones del panel" className="flex flex-col gap-1">
      {ADMIN_NAV.map((item) => {
        const active = isNavItemActive(item.href, pathname);
        const Icon = item.icon;
        const count = item.badge ? badges[item.badge] : undefined;
        const showBadge = typeof count === 'number' && count > 0;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'group relative flex items-center gap-3 rounded-lg px-3 py-2.5',
              'text-[0.95rem] font-medium transition-colors duration-fast ease-out-quart',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
              active
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
            )}
          >
            {/* The active marker is a real element rather than a border, so
                selecting an item never changes its box and never reflows the
                list underneath it. */}
            <span
              aria-hidden="true"
              className={cn(
                'absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-sidebar-primary',
                active ? 'opacity-100' : 'opacity-0',
              )}
            />
            <Icon className="h-[1.15rem] w-[1.15rem] shrink-0" aria-hidden="true" />
            <span className="flex-1 truncate">{item.label}</span>
            {showBadge && (
              <span className="tabular inline-flex min-w-6 items-center justify-center rounded-full bg-sidebar-primary px-1.5 py-0.5 text-[0.72rem] font-bold text-sidebar-primary-foreground">
                {count}
                <span className="sr-only"> {item.badgeNoun}</span>
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand({ clinicName }: { clinicName: string }) {
  return (
    <div className="flex items-center gap-3">
      {/* The clinic's own mark, not a generic shield: a shield-and-check glyph
          says "security product", and this is a dental practice. */}
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
        <ToothIcon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <span className="min-w-0">
        <span className="block truncate font-heading text-[1.05rem] leading-tight text-sidebar-foreground">
          {clinicName}
        </span>
        <span className="block text-eyebrow uppercase tracking-[0.09em] text-sidebar-foreground/60">
          Panel interno
        </span>
      </span>
    </div>
  );
}

/** The way back to the public site, styled for the drenched rail it sits in. */
function SiteLink() {
  return (
    <Link
      href="/es"
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-small text-sidebar-foreground/70 transition-colors duration-fast hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
    >
      <ExternalLink className="h-4 w-4" aria-hidden="true" />
      Ver el sitio público
    </Link>
  );
}

function AccountPanel({ actorEmail }: { actorEmail: string }) {
  return (
    <div className="space-y-3 border-t border-sidebar-border pt-4">
      <p className="text-small text-sidebar-foreground/70">
        Sesión iniciada como
        <span className="mt-0.5 block truncate font-medium text-sidebar-foreground" title={actorEmail}>
          {actorEmail}
        </span>
      </p>
      <SignOutButton />
    </div>
  );
}

export function AdminChrome({
  actorEmail,
  clinicName,
  badges,
  children,
}: {
  actorEmail: string;
  clinicName: string;
  badges: NavBadgeCounts;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerPath, setDrawerPath] = useState(pathname);

  /* Radix keeps the drawer open across a client-side navigation, which would
     leave the front desk staring at the menu they just used instead of the page
     they asked for. Closed DURING render when the path changes — React's
     pattern for state that follows a prop — rather than in an effect, which
     painted one frame of the open drawer over the new page first. */
  if (drawerPath !== pathname) {
    setDrawerPath(pathname);
    setDrawerOpen(false);
  }

  /* Keep the queue current without anyone pressing reload.

     The layout that computes the sidebar badges does not re-run on client
     navigation, and nothing told an open panel that a request had arrived: the
     front desk could sit on "Citas 2" all afternoon while six more came in. So
     the server data is refreshed when the tab comes back into view and every
     90 seconds while it is visible — never while it is hidden, which would
     wake the database for a screen nobody is looking at. Throttled so the
     `focus` and `visibilitychange` that both fire on one tab switch cost one
     refresh, not two. `router.refresh()` keeps client state: an open dialog,
     a half-typed search and an unsaved settings draft all survive it. */
  useEffect(() => {
    let last = Date.now();
    const refresh = () => {
      if (document.visibilityState !== 'visible') return;
      const now = Date.now();
      if (now - last < 5_000) return;
      last = now;
      router.refresh();
    };

    const timer = window.setInterval(refresh, 90_000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [router]);

  /* The waiting count in the tab title — "(3) Panel · Orthoprotesis" — so a
     panel left open in a background tab still says when someone is waiting.
     Re-applied on navigation because each page's metadata resets the title. */
  const waiting = badges.appointmentsPending ?? 0;
  useEffect(() => {
    const base = document.title.replace(/^\(\d+\)\s+/, '');
    document.title = waiting > 0 ? `(${waiting}) ${base}` : base;
  }, [waiting, pathname]);

  return (
    <div className="min-h-screen bg-canvas text-ink lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <a
        href="#admin-main"
        className="sr-only rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-modal"
      >
        Saltar al contenido
      </a>

      {/* Desktop rail */}
      <aside className="sticky top-0 hidden h-screen flex-col gap-6 bg-sidebar p-5 lg:flex">
        <Brand clinicName={clinicName} />
        <div className="min-h-0 flex-1 overflow-y-auto">
          <NavList badges={badges} />
        </div>
        <div className="space-y-3">
          <SiteLink />
          <AccountPanel actorEmail={actorEmail} />
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-col">
        {/* Solid, not translucent. A backdrop-filter on an element that is on
            screen for the whole session re-samples the blurred backdrop every
            frame, which on the phone the front desk uses costs battery for as
            long as the panel is open, for an effect nobody asked for.

            Present at every width, because the theme toggle has to be reachable
            on the desktop too and it cannot live on the drenched rail: its
            glyphs are brass, tuned against a light ground. */}
        <header className="sticky top-0 z-header flex items-center gap-2 border-b border-line bg-canvas px-4 py-3 sm:px-6 lg:px-8">
          <div className="lg:hidden">
            <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Abrir el menú del panel">
                  <Menu className="h-5 w-5" aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="flex w-[17rem] flex-col gap-6 border-sidebar-border bg-sidebar p-5"
                closeLabel="Cerrar el menú"
                closeClassName="text-sidebar-foreground hover:bg-sidebar-accent/60 focus-visible:ring-sidebar-ring focus-visible:ring-offset-sidebar"
              >
                <SheetTitle className="sr-only">Menú del panel</SheetTitle>
                <SheetDescription className="sr-only">
                  Navegación entre las secciones del panel de administración.
                </SheetDescription>
                <Brand clinicName={clinicName} />
                <div className="min-h-0 flex-1 overflow-y-auto">
                  <NavList badges={badges} onNavigate={() => setDrawerOpen(false)} />
                </div>
                <SiteLink />
                <AccountPanel actorEmail={actorEmail} />
              </SheetContent>
            </Sheet>
          </div>

          <span className="min-w-0 flex-1 truncate font-heading text-[1.05rem] lg:hidden">
            {clinicName}
          </span>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggleButton />
          </div>
        </header>

        {/* `tabIndex={-1}` so the skip link actually moves focus. Safari does
            not move the sequential-focus starting point to a fragment target
            that cannot take focus, so the next Tab went back to the header —
            the same fix the public layout carries. */}
        <main
          id="admin-main"
          tabIndex={-1}
          className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
