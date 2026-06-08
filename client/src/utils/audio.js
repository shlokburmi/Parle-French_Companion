/**
 * Plays high-fidelity, natural French speech using Google Translate's neural TTS engine.
 * Automatically falls back to local browser SpeechSynthesis if the request fails or is offline.
 * Returns a Promise that resolves when the audio finishes playing.
 * 
 * @param {string} text The French text to pronounce
 * @param {number} speed Playback speed multiplier (default: 1.0)
 * @returns {Promise<void>} Resolves when audio playback completes
 */
export function playNativeAudio(text, speed = 1.0) {
  return new Promise((resolve) => {
    if (!text) {
      resolve();
      return;
    }

    // Call the server-side TTS proxy to bypass browser CORS blocks and use ElevenLabs if configured
    const proxyUrl = `/api/ai/tts?text=${encodeURIComponent(text)}`;
    const audio = new Audio(proxyUrl);
    
    // Set playback speed
    audio.playbackRate = speed;

    audio.onended = () => {
      resolve();
    };

    audio.onerror = (err) => {
      console.warn('[playNativeAudio] Google TTS failed, falling back to system SpeechSynthesis:', err);
      // Fallback to local browser Web Speech API
      fallbackSpeechSynthesis(text, speed, resolve);
    };

    audio.play().catch((playErr) => {
      console.warn('[playNativeAudio] HTML5 Audio play failed (user interaction policy or network), falling back:', playErr);
      fallbackSpeechSynthesis(text, speed, resolve);
    });
  });
}

/**
 * Fallback local browser SpeechSynthesis method
 */
function fallbackSpeechSynthesis(text, speed, resolve) {
  if (!('speechSynthesis' in window)) {
    console.error('[fallbackSpeechSynthesis] Browser does not support Web Speech API');
    resolve();
    return;
  }

  // Cancel any active speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'fr-FR';
  utterance.rate = speed * 0.9; // Scale rate down slightly for local voices

  // Find a French voice
  const voices = window.speechSynthesis.getVoices();
  const frenchVoice = voices.find(v => v.lang.startsWith('fr'));
  if (frenchVoice) {
    utterance.voice = frenchVoice;
  }

  utterance.onend = () => {
    resolve();
  };

  utterance.onerror = (e) => {
    console.error('[fallbackSpeechSynthesis] Local SpeechSynthesis error:', e);
    resolve();
  };

  window.speechSynthesis.speak(utterance);
}
