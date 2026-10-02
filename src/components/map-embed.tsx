'use client';

import { useState } from 'react';
import { MapPin } from 'lucide-react';

interface MapEmbedProps {
  src: string;
  title: string;
  loadLabel: string;
  note: string;
  address: string;
}

/**
 * Google Maps, loaded on request.
 *
 * The embed used to load by itself as the visitor neared the bottom of the
 * page: 12 requests and ~234 KB of third-party JavaScript, plus Google's
 * cookies, on a medical practice's site, for a map most visitors never touch.
 * The address and the "Abrir en Google Maps" link beside it answer "where is
 * it" without any of that; this facade loads the interactive map only when
 * someone asks for it.
 *
 * The placeholder holds the iframe's exact box, so pressing the button swaps
 * content without moving anything around it.
 */
export function MapEmbed({ src, title, loadLabel, note, address }: MapEmbedProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative h-64 overflow-hidden rounded-xl border border-line bg-canvas-sunk md:h-72">
      {loaded ? (
        <iframe
          src={src}
          title={title}
          className="absolute inset-0 h-full w-full border-0"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
            <MapPin className="h-6 w-6" aria-hidden="true" />
          </span>
          <p className="max-w-[34ch] text-small leading-relaxed text-ink-soft">{address}</p>
          <button
            type="button"
            onClick={() => setLoaded(true)}
            className="inline-flex h-11 items-center rounded-lg border border-line-strong bg-surface px-4 text-small font-medium text-ink transition-colors duration-fast ease-out-quart hover:border-primary/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-canvas-sunk"
          >
            {loadLabel}
          </button>
          <p className="text-small text-ink-soft">{note}</p>
        </div>
      )}
    </div>
  );
}
