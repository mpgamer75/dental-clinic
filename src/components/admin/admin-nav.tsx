
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { adminNavItems } from '@/lib/data'; // generalUiStrings removed as not used here
import { cn } from '@/lib/utils';
// useLanguage removed as lang is hardcoded to 'es' for admin
// import { useLanguage } from '@/contexts/language-context'; 

export function AdminNav() {
  const pathname = usePathname();
  // const { lang } = useLanguage(); // Admin panel is 'es'
  const navItemsForLang = adminNavItems['es'];

  return (
    <nav className="grid items-start gap-2">
      {navItemsForLang.map((item) => {
        const Icon = item.icon;
        // Ensure item.href is defined before using it
        const isActive = item.href && pathname === item.href;
        
        return (
          <Link key={item.label} href={item.href || '#'}>
            <span // Changed from <a> to <span> as Link is the interactive element
              className={cn(
                'group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors duration-150 ease-in-out',
                isActive ? 'bg-accent text-accent-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {Icon && <Icon className="mr-3 h-5 w-5 flex-shrink-0" />}
              <span>{item.label}</span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
