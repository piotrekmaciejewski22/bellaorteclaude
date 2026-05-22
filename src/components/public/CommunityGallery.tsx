"use client";

/**
 * Masonry-style gallery for "Wasze zdjęcia" with lightbox.
 */

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface CommunityPhoto {
  id: string;
  signedUrl: string;
  caption: string;
  contributorName: string;
  locationLabel: string | null;
  createdAt: string;
}

interface CommunityGalleryProps {
  photos: CommunityPhoto[];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pl-PL', {
    month: 'long',
    year: 'numeric',
  });
}

export function CommunityGallery({ photos }: CommunityGalleryProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    if (openIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpenIndex(null);
      else if (e.key === 'ArrowRight') setOpenIndex((i) => (i === null ? null : (i + 1) % photos.length));
      else if (e.key === 'ArrowLeft') setOpenIndex((i) => (i === null ? null : (i - 1 + photos.length) % photos.length));
    }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [openIndex, photos.length]);

  if (photos.length === 0) {
    return (
      <p className="rounded-2xl border border-border bg-flag-white p-6 text-sm text-muted">
        Galeria jest pusta. Bądź pierwszą osobą która prześle zdjęcie.
      </p>
    );
  }

  return (
    <>
      <div className="columns-1 gap-3 sm:columns-2 md:columns-3 lg:columns-4">
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setOpenIndex(index)}
            className="group mb-3 block w-full overflow-hidden rounded-xl border border-border bg-flag-white text-left focus-visible:outline-2 focus-visible:outline-italian-green"
          >
            <Image
              src={photo.signedUrl}
              alt={photo.caption || 'Zdjęcie od gości'}
              width={800}
              height={1067}
              unoptimized
              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="block h-auto w-full transition-transform duration-500 group-hover:scale-105"
            />
            <div className="p-3 text-xs">
              {photo.locationLabel && (
                <p className="font-display text-base text-ink">{photo.locationLabel}</p>
              )}
              {photo.caption && (
                <p className="mt-1 line-clamp-2 text-cypress/85">{photo.caption}</p>
              )}
              <p className="mt-2 text-muted">
                {photo.contributorName ? `${photo.contributorName} · ` : ''}
                {formatDate(photo.createdAt)}
              </p>
            </div>
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/85 p-4"
          onClick={() => setOpenIndex(null)}
        >
          <button
            type="button"
            aria-label="Zamknij"
            onClick={(e) => {
              e.stopPropagation();
              setOpenIndex(null);
            }}
            className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-flag-white/90 text-ink hover:bg-flag-white"
          >
            <X size={20} />
          </button>
          <button
            type="button"
            aria-label="Poprzednie zdjęcie"
            onClick={(e) => {
              e.stopPropagation();
              setOpenIndex((i) => (i === null ? null : (i - 1 + photos.length) % photos.length));
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-full bg-flag-white/90 text-ink hover:bg-flag-white"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            aria-label="Następne zdjęcie"
            onClick={(e) => {
              e.stopPropagation();
              setOpenIndex((i) => (i === null ? null : (i + 1) % photos.length));
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-full bg-flag-white/90 text-ink hover:bg-flag-white"
          >
            <ChevronRight size={22} />
          </button>

          <figure
            className="flex max-h-[88vh] max-w-5xl flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={photos[openIndex].signedUrl}
              alt={photos[openIndex].caption || 'Zdjęcie od gości'}
              width={1600}
              height={1200}
              unoptimized
              className="max-h-[80vh] w-auto rounded-lg object-contain"
            />
            <figcaption className="mt-3 text-center text-sm text-ivory/90">
              {photos[openIndex].locationLabel && (
                <span className="font-display text-lg text-ivory">
                  {photos[openIndex].locationLabel}
                </span>
              )}
              {photos[openIndex].caption && (
                <span className="ml-2">{photos[openIndex].caption}</span>
              )}
              <div className="mt-1 text-xs text-ivory/70">
                {photos[openIndex].contributorName && `${photos[openIndex].contributorName} · `}
                {formatDate(photos[openIndex].createdAt)}
              </div>
            </figcaption>
          </figure>
        </div>
      )}
    </>
  );
}
