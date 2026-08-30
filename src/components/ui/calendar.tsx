"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

/**
 * react-day-picker, dressed in the project tokens.
 *
 * Notes on the choices that are not cosmetic:
 *
 * - Cells are 2.5rem (≈42px at this project's 17px root), not the shadcn
 *   default 2.25rem (≈38px). This is a pointer-device affordance (see
 *   appointment-form.tsx — touch gets the native picker instead), so WCAG 2.2's
 *   24px minimum is the binding one, but 38px squares in a 7-wide grid are
 *   still an uncomfortable target for anyone with a tremor.
 *
 * - `disabled` carries a strike-through as well as a colour change. A closed
 *   day is a piece of information, and colour must never be the only channel
 *   carrying it.
 *
 * - `today` is a ring, not a fill. The default is a filled tinted square, which
 *   is close enough to `selected` that "today" reads as "already chosen".
 *
 * - Nav buttons are full-opacity 2.25rem targets. The shadcn default is
 *   `h-7 w-7 opacity-50`, i.e. a 30px control at half contrast — the two
 *   controls a keyboard or low-vision user needs most to reach another month.
 *
 * v10 renamed nearly every `classNames` key from the v8 set this file used to
 * carry, and collapsed the two nav icons into one `Chevron` that receives an
 * `orientation`. The mapping is: caption→month_caption, table→month_grid,
 * head_row→weekdays, head_cell→weekday, row→week, cell→day, day→day_button,
 * and the `day_*` state keys lost their prefix (day_selected→selected, …).
 */
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-4", className)}
      classNames={{
        months: "flex flex-col gap-4 sm:flex-row sm:gap-6",
        month: "space-y-4",
        month_caption: "relative flex items-center justify-center pt-0.5",
        caption_label:
          "font-heading text-base font-medium capitalize text-ink",
        nav: "flex items-center gap-1",
        button_previous: cn(
          buttonVariants({ variant: "ghost" }),
          "absolute left-0 h-9 w-9 p-0 text-ink-soft hover:text-ink"
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost" }),
          "absolute right-0 h-9 w-9 p-0 text-ink-soft hover:text-ink"
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        /* `text-eyebrow` rather than an arbitrary size: the weekday row is
           exactly what that step is for — an uppercase micro-label whose
           tracking is already part of the token. */
        weekday: "w-10 pb-1 text-eyebrow font-medium uppercase text-ink-faint",
        week: "mt-1 flex w-full",
        day: "relative h-10 w-10 p-0 text-center focus-within:relative focus-within:z-raised",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-10 w-10 rounded-md p-0 text-base font-normal tabular aria-selected:opacity-100"
        ),
        range_end: "day-range-end",
        selected:
          "bg-terracotta text-primary-foreground shadow-e1 hover:bg-terracotta-hover hover:text-primary-foreground focus:bg-terracotta focus:text-primary-foreground",
        today: "font-medium text-terracotta ring-1 ring-inset ring-terracotta/50",
        outside: "day-outside text-ink-faint opacity-60",
        disabled:
          "text-ink-faint line-through opacity-45 hover:bg-transparent hover:text-ink-faint",
        range_middle: "aria-selected:bg-terracotta-soft aria-selected:text-ink",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, ...chevronProps }) =>
          orientation === "left" ? (
            <ChevronLeft className="h-5 w-5" {...chevronProps} />
          ) : (
            <ChevronRight className="h-5 w-5" {...chevronProps} />
          ),
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
