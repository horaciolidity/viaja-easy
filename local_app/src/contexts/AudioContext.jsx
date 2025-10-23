import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';

const AudioContext = createContext(null);

export const useAudio = () => {
  const ctx = useContext(AudioContext);
  if (!ctx) throw new Error('useAudio debe usarse dentro de un AudioProvider');
  return ctx;
};

/* ---------------------- 🎵 Definición de sonidos ---------------------- */
const soundFiles = {
  viaje_nuevo: '/sounds/viaje_nuevo.mp3',
  message: '/sounds/mensaje.mp3',
  alert: '/sounds/alert.mp3',
  success: '/sounds/success.mp3',
  notification: '/sounds/notification.mp3',
  swoosh: '/sounds/swoosh.mp3',
  driver_arrived: '/sounds/driver_arrived.mp3',
  ride_completed: '/sounds/ride_completed.mp3',
  default: '/sounds/notification.mp3',
};

const loadedSounds = {};

/* ---------------------- 🎧 Carga de sonidos ---------------------- */
const loadSound = (key, src) =>
  new Promise((resolve, reject) => {
    const audio = new Audio(src);
    audio.preload = 'auto';
    audio.addEventListener('canplaythrough', () => {
      loadedSounds[key] = audio;
      if (import.meta.env.DEV) console.log(`✅ Sonido cargado: ${key}`);
      resolve();
    });
    audio.addEventListener('error', (e) => {
      const error = e.target.error;
      console.error(
        `Audio Fallido: '${key}' desde '${src}'. Código: ${error?.code}, Mensaje: ${error?.message}`
      );
      reject(new Error(`Failed to load ${key}`));
    });
  });

Object.entries(soundFiles).forEach(([key, src]) =>
  loadSound(key, src).catch((e) => console.error(e))
);

/* ---------------------- 🔊 Reproducción ---------------------- */
export const playNotificationSound = (soundKey = 'default') => {
  const soundTemplate = loadedSounds[soundKey] || loadedSounds.default;
  if (soundTemplate) {
    const soundToPlay = soundTemplate.cloneNode();
    soundToPlay
      .play()
      .catch((err) => console.error(`Error al reproducir '${soundKey}':`, err));
  } else {
    console.warn(`⚠️ El sonido '${soundKey}' no está cargado.`);
  }
};

/* ---------------------- 🎚️ Contexto principal ---------------------- */
export const AudioProvider = ({ children }) => {
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);

  const unlockAudio = useCallback(() => {
    if (isAudioUnlocked) return;
    setIsAudioUnlocked(true);

    // Desbloquea audio context en iOS y navegadores móviles
    const silent = new Audio(
      'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU2LjM2LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV6aW1vbW9tb21vbW9tb21vbW9tb21vb21vb21vb21vb21vb21vb21vb21vb21vb////////AAAAAExhdmM1Ni40MQ=='
    );
    silent.play().catch(() => {});
    if (import.meta.env.DEV) console.log('🔓 AudioContext desbloqueado.');
  }, [isAudioUnlocked]);

  useEffect(() => {
    document.addEventListener('click', unlockAudio, { once: true });
    document.addEventListener('touchstart', unlockAudio, { once: true });

    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };
  }, [unlockAudio]);

  const playSound = useCallback(
    (soundKey = 'default') => {
      if (!isAudioUnlocked) {
        toast({
          title: 'Audio bloqueado',
          description:
            'Haz clic en cualquier lugar de la página para habilitar los sonidos de notificación.',
          variant: 'destructive',
        });
        return;
      }
      playNotificationSound(soundKey);
    },
    [isAudioUnlocked]
  );

  const value = { playSound, isAudioUnlocked, unlockAudio };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
};
