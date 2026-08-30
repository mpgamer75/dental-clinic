import {
  CalendarDays,
  LayoutDashboard,
  MessagesSquare,
  Settings,
  ShieldAlert,
  type LucideIcon,
} from 'lucide-react';

/* ============================================================================
   ADMIN NAVIGATION
   ----------------------------------------------------------------------------
   Spanish only, because the panel is. `src/lib/data.ts` carries an
   `adminNavItems` map in both languages whose hrefs — /admin/appointments,
   /admin/messages, /admin/testimonials, /admin/settings — pointed at files that
   had never existed. The routes below are those hrefs, now real, so the two no
   longer contradict each other.

   `badge` names which counter from the dashboard snapshot decorates the item.
   The counter is the number of things WAITING, not the number of things: a "42"
   beside Citas that never moves is furniture, and a "3" that clears when the
   work is done is a to-do list.
   ========================================================================== */

export type NavBadge = 'appointmentsPending' | 'messagesUnread' | 'testimonialsPending';

export interface AdminNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Screen-reader suffix on the badge, e.g. "3 pendientes". */
  badgeNoun?: string;
  badge?: NavBadge;
}

export const ADMIN_NAV: readonly AdminNavItem[] = [
  { label: 'Resumen', href: '/admin', icon: LayoutDashboard },
  {
    label: 'Citas',
    href: '/admin/appointments',
    icon: CalendarDays,
    badge: 'appointmentsPending',
    badgeNoun: 'pendientes',
  },
  {
    label: 'Mensajes',
    href: '/admin/messages',
    icon: MessagesSquare,
    badge: 'messagesUnread',
    badgeNoun: 'sin leer',
  },
  {
    label: 'Testimonios',
    href: '/admin/testimonials',
    icon: ShieldAlert,
    badge: 'testimonialsPending',
    badgeNoun: 'por revisar',
  },
  { label: 'Ajustes', href: '/admin/settings', icon: Settings },
] as const;

/** Counts the sidebar renders. Kept as a loose record so the layout can pass a
 *  partial set when the count query itself failed — a missing badge is honest,
 *  a zero is a claim. */
export type NavBadgeCounts = Partial<Record<NavBadge, number>>;

/**
 * Whether a nav item is the one being viewed.
 *
 * `/admin` needs an exact match: as a prefix it would light up on every page in
 * the panel, and a navigation where everything is selected tells the reader
 * nothing about where they are.
 */
export function isNavItemActive(href: string, pathname: string): boolean {
  if (href === '/admin') return pathname === '/admin';
  return pathname === href || pathname.startsWith(`${href}/`);
}
