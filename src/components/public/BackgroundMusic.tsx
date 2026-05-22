"use client";

/**
 * BackgroundMusic — pływający player muzyki tła w prawym dolnym rogu.
 *
 * Reguły:
 *   - Domyślnie WYŁĄCZONY (przeglądarki blokują autoplay z dźwiękiem).
 *   - Klik włącza muzykę z fade-in.
 *   - Drugi klik wycisza (pauza).
 *   - Loop — gdy się skończy, gra od nowa.
 *   - Wybór zapisany w localStorage:
 *       'bellaorte:music' = 'on' | 'off'
 *     Jeśli kiedyś włączył — następne wejście automatycznie zacznie grać
 *     po pierwszej interakcji użytkownika (klik gdziekolwiek), żeby
 *     przeglądarka pozwoliła odtworzyć dźwięk.
 *
 * Plik: /audio/ortesound.mp3
 *
 * UX detale:
 *   - subtelna animacja gdy gra (równoległe poziome paski jak equalizer)
 *   - aria-label aktualizuje się dla czytników ekranu
 *   - na małych ekranach przycisk jest mniejszy, ale wciąż dostępny
 */

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

const STORAGE_KEY = 'bellaorte:music';
const AUDIO_SRC = '/audio/ortesound.mp3';
const VOLUME = 0.45; // dyskretne tło, nie zagłusza myślenia

const subscribeNoop = () => () => undefined;
function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
}

export function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const isClient = useIsClient();

  // Tworzenie elementu audio raz, gdy komponent jest po stronie klienta.
  useEffect(() => {
    if (!isClient) return;
    const audio = new Audio(AUDIO_SRC);
    audio.loop = true;
    audio.volume = VOLUME;
    audio.preload = 'auto';
    audioRef.current = audio;

    // Jeśli wcześniej użytkownik włączył muzykę — spróbuj autoplay
    // po pierwszym kliknięciu w stronę (przeglądarki wymagają
    // user interaction).
    const previousChoice = window.localStorage.getItem(STORAGE_KEY);
    if (previousChoice === 'on') {
      const tryPlay = () => {
        audio
          .play()
          .then(() => setPlaying(true))
          .catch(() => {
            // Cicho ignoruj — użytkownik kliknie ikonę gdy zechce.
          });
        document.removeEventListener('click', tryPlay);
        document.removeEventListener('touchstart', tryPlay);
      };
      document.addEventListener('click', tryPlay);
      document.addEventListener('touchstart', tryPlay);
    }

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [isClient]);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
      window.localStorage.setItem(STORAGE_KEY, 'off');
    } else {
      audio
        .play()
        .then(() => {
          setPlaying(true);
          window.localStorage.setItem(STORAGE_KEY, 'on');
        })
        .catch((err) => {
          console.warn('Nie mogę odtworzyć:', err);
        });
    }
  }

  if (!isClient) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={playing ? 'Wyłącz muzykę tła' : 'Włącz muzykę tła'}
      title={playing ? 'Wyłącz muzykę' : 'Włącz muzykę'}
      className="fixed bottom-6 right-6 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full border border-gold/40 bg-flag-white/95 text-cypress shadow-warm-lg backdrop-blur transition-all hover:border-gold hover:bg-gold/10 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold md:h-14 md:w-14"
    >
      {playing ? (
        <span className="relative flex items-center justify-center">
          <Volume2 size={20} className="text-olive" />
          {/* Animowane paseczki equalizera nad ikoną gdy gra */}
          <span aria-hidden="true" className="absolute -top-3 flex gap-0.5">
            <span className="bg-music-bar h-1.5 w-0.5 rounded-full bg-olive" style={{ animationDelay: '0ms' }} />
            <span className="bg-music-bar h-2 w-0.5 rounded-full bg-olive" style={{ animationDelay: '120ms' }} />
            <span className="bg-music-bar h-1 w-0.5 rounded-full bg-olive" style={{ animationDelay: '240ms' }} />
          </span>
        </span>
      ) : (
        <VolumeX size={20} className="text-stone" />
      )}
    </button>
  );
}
