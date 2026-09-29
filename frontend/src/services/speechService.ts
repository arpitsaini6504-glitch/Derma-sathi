// Multilingual Voice Assistance using Web Speech API
export const speechService = {
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  },

  speak(text: string, languageCode: string = 'en', onEnd?: () => void) {
    if (!this.isSupported()) return;

    window.speechSynthesis.cancel(); // Cancel any ongoing speech

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Map application language codes to BCP-47 speech tags
    const langMap: Record<string, string> = {
      en: 'en-IN',
      hi: 'hi-IN',
      mr: 'mr-IN',
      bn: 'bn-IN',
      ta: 'ta-IN',
      te: 'te-IN',
      ml: 'ml-IN',
      kn: 'kn-IN',
      gu: 'gu-IN',
      pa: 'pa-IN',
      as: 'as-IN',
      or: 'or-IN'
    };

    utterance.lang = langMap[languageCode] || 'en-IN';
    utterance.rate = 0.95; // Slightly slower for clear medical understanding
    utterance.pitch = 1.0;

    if (onEnd) {
      utterance.onend = onEnd;
      utterance.onerror = onEnd;
    }

    window.speechSynthesis.speak(utterance);
  },

  stop() {
    if (this.isSupported()) {
      window.speechSynthesis.cancel();
    }
  }
};
