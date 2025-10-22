export const speechService = {
  speak: (text, lang = 'es-ES') => {
    if (!('speechSynthesis' in window) || !text) {
      console.error('Speech Synthesis not supported or no text provided.');
      return;
    }
    
    const cleanText = text.replace(/<[^>]*>?/gm, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = lang;
    utterance.rate = 0.9;
    utterance.pitch = 1;
    
    const voices = window.speechSynthesis.getVoices();
    const spanishVoice = voices.find(voice => voice.lang === lang || voice.lang.startsWith('es-'));
    if (spanishVoice) {
      utterance.voice = spanishVoice;
    }

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  },
  stop: () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
};

if ('speechSynthesis' in window && window.speechSynthesis.onvoiceschanged !== undefined) {
  window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
}