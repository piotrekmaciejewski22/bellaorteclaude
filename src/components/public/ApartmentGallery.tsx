"use client";

/**
 * ApartmentGallery — image grid + lightbox modal.
 *
 * Per Wym. 40, the public gallery shows ONLY photos with `source_kind`
 * ∈ {placeholder_orte, placeholder_italy, placeholder_rome, exterior_real}
 * UNLESS the apartment has at least one `interior_real` photo — then
 * interior photos are also shown. Filtering is the caller's job; this
 * component just renders whatever it gets.
 *
 * Wymagania pokryte: 5, 6, 40, 46 #5, 47.
 */

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

export interface GalleryPhotoEntry {
  id: string;
  url: string;
  alt: string;
}

interface ApartmentGalleryProps {
  photos: GalleryPhotoEntry[];
}

export function ApartmentGallery({ photos }: ApartmentGalleryProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    if (openIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpenIndex(null);
      else if (e.key === 'ArrowRight') {
        setOpenIndex((idx) => (idx === null ? null : (idx + 1) % photos.length));
      } else if (e.key === 'ArrowLeft') {
        setOpenIndex((idx) =>
          idx === null ? null : (idx - 1 + photos.length) % photos.length,
        );
      }
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
        Galeria zostanie uzupełniona po dodaniu zdjęć.
      </p>
    );
  }

  return (
    <>
      <ul
        className="grid gap-3 sm:grid-cols-2 md:grid-cols-3"
        aria-label="Galeria zdjęć apartamentu"
      >
        {photos.map((photo, index) => (
          <li
            key={photo.id}
            className="overflow-hidden rounded-xl border border-border bg-flag-white"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(index)}
              className="group relative block aspect-[4/3] w-full overflow-hidden focus-visible:outline-2 focus-visible:outline-italian-green"
              aria-label={`Powiększ zdjęcie: ${photo.alt}`}
            >
              <Image
                src={photo.url}
                alt={photo.alt}
                fill
                unoptimized
                sizes="(min-width: 768px) 33vw, 50vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </button>
          </li>
        ))}
      </ul>

      {openIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Powiększone zdjęcie"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/85 p-4"
          onClick={() => setOpenIndex(null)}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpenIndex(null);
            }}
            aria-label="Zamknij podgląd"
            className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-flag-white/90 text-ink hover:bg-flag-white"
          >
            <X size={20} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpenIndex(
                (idx) => (idx === null ? null : (idx - 1 + photos.length) % photos.length),
              );
            }}
            aria-label="Poprzednie zdjęcie"
            className="absolute left-4 top-1/2 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-full bg-flag-white/90 text-ink hover:bg-flag-white"
          >
            <ChevronLeft size={22} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpenIndex((idx) => (idx === null ? null : (idx + 1) % photos.length));
            }}
            aria-label="Następne zdjęcie"
            className="absolute right-4 top-1/2 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-full bg-flag-white/90 text-ink hover:bg-flag-white"
          >
            <ChevronRight size={22} />
          </button>

          <div
            className="relative h-full max-h-[80vh] w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={photos[openIndex].url}
              alt={photos[openIndex].alt}
              fill
              unoptimized
              sizes="100vw"
              className="object-contain"
              priority
            />
            <p className="absolute -bottom-10 left-0 right-0 text-center text-sm text-ivory/90">
              {photos[openIndex].alt} · {openIndex + 1} / {photos.length}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
