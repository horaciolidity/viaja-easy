import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';

const AudioContext = createContext(null);

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio debe usarse dentro de un AudioProvider');
  }
  return context;
};

const soundFiles = {
  viaje_nuevo: '/sounds/viaje_nuevo.mp3',
  mensaje: '/sounds/mensaje.mp3',
  alert: '/sounds/alert.mp3',
  success: '/sounds/success.mp3',
  notification: '/sounds/notification.mp3',
  swoosh: '/sounds/swoosh.mp3',
  driver_arrived: '/sounds/driver_arrived.mp3',
  ride_completed: '/sounds/ride_completed.mp3',
  default: '/sounds/notification.mp3',
};

const loadedSounds = {};

const loadSound = (key, src) => {
  return new Promise((resolve, reject) => {
    const audio = new Audio(src);
    audio.preload = 'auto';
    audio.addEventListener('canplaythrough', () => {
      loadedSounds[key] = audio;
      resolve();
    });
    audio.addEventListener('error', (e) => {
      const error = e.target.error;
      console.error(`Audio Fallido: No se pudo cargar o decodificar el sonido '${key}' desde '${src}'. Código: ${error?.code}, Mensaje: ${error?.message}`);
      reject(new Error(`Failed to load ${key}`));
    });
  });
};

Object.entries(soundFiles).forEach(([key, src]) => {
  loadSound(key, src).catch(e => console.error(e));
});

export const playNotificationSound = (soundKey = 'default') => {
  const soundTemplate = loadedSounds[soundKey] || loadedSounds.default;
  if (soundTemplate) {
    const soundToPlay = soundTemplate.cloneNode();
    soundToPlay.play().catch(error => {
      console.error(`Error al reproducir el sonido '${soundKey}':`, error);
    });
  } else {
    console.error(`El sonido con la clave "${soundKey}" no se encontró o no está cargado.`);
  }
};


export const AudioProvider = ({ children }) => {
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  
  const unlockAudio = useCallback(() => {
    if (!isAudioUnlocked) {
      setIsAudioUnlocked(true);
      // Play a silent sound to unlock audio context on iOS/some browsers
      const silentSound = new Audio('data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU2LjM2LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV6aW1vbW9tb21vbW9tb21vbW9tb21vbW9tb21vbW9tb21vbW9tb21vbW9tb21vbW9tb21v////////AAAAAExhdmM1Ni40MQAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV6aW1vbW9tb21vbW9tb21vbW9tb21vbW9tb21vbW9tb21vbW9tb21vbW9tb21vbW9tb21v////////AAAAAExhdmM1Ni40MQAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV6aW1vbW9tb21vbW9tb21vbW9tb21vbW9tb21vbW9tb21vbW9tb21vbW9tb21vbW9tb21v////////AAAAAExhdmM1Ni40MQ');
      silentSound.play().catch(() => {});
      console.log("AudioContext desbloqueado por interacción del usuario.");
    }
  }, [isAudioUnlocked]);

  useEffect(() => {
    document.addEventListener('click', unlockAudio, { once: true });
    document.addEventListener('touchstart', unlockAudio, { once: true });

    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };
  }, [unlockAudio]);

  const playSound = useCallback((soundKey = 'default') => {
    if (!isAudioUnlocked) {
      toast({
        title: "Audio bloqueado",
        description: "Haz clic en cualquier lugar de la página para habilitar los sonidos de notificación.",
        variant: "destructive",
      });
      return;
    }
    playNotificationSound(soundKey);
  }, [isAudioUnlocked]);

  const value = { playSound, isAudioUnlocked, unlockAudio };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
};