import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/**
 * tailwind-merge has to be told about custom scale keys, or it silently drops
 * classes.
 *
 * It resolves conflicts by grouping utilities, and it infers the group from the
 * class name. `text-*` is ambiguous — it is both font-size and text-colour — so
 * tailwind-merge decides using its list of KNOWN font-size keys. Our semantic
 * steps (`text-h2`, `text-body`, …) are not on that list, so it classified them
 * as colours and let `text-ink` win:
 *
 *     cn('font-heading text-h2 font-medium text-ink')  ->  'font-heading font-medium text-ink'
 *
 * Every section heading on the site was rendering at inherited body size as a
 * result. The failure is silent in both directions: no error, and the class is
 * present in the source so a grep looks fine.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        { text: ["h1", "h2", "h3", "h4", "body", "small", "eyebrow"] },
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
