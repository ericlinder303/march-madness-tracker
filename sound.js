// Sound Effects Module
// Uses Web Audio API to generate elimination buzzer sound

const SOUND_PREFS_KEY = 'march-madness-sound-enabled';
const SEEN_ELIMINATIONS_KEY = 'march-madness-seen-eliminations';

let audioContext = null;
let soundEnabled = false;
let seenEliminations = new Set();

/**
 * Initialize sound system
 */
export function initSound() {
  // Load preferences
  soundEnabled = localStorage.getItem(SOUND_PREFS_KEY) === 'true';

  // Load seen eliminations
  try {
    const seen = localStorage.getItem(SEEN_ELIMINATIONS_KEY);
    if (seen) {
      seenEliminations = new Set(JSON.parse(seen));
    }
  } catch (e) {
    console.warn('Failed to load seen eliminations:', e);
  }

  return soundEnabled;
}

/**
 * Toggle sound on/off
 */
export function toggleSound() {
  soundEnabled = !soundEnabled;
  localStorage.setItem(SOUND_PREFS_KEY, soundEnabled.toString());

  // Initialize audio context on first enable (requires user interaction)
  if (soundEnabled && !audioContext) {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported:', e);
    }
  }

  return soundEnabled;
}

/**
 * Check if sound is enabled
 */
export function isSoundEnabled() {
  return soundEnabled;
}

/**
 * Play elimination buzzer sound
 */
export function playEliminationSound() {
  if (!soundEnabled) return;

  // Initialize audio context if needed
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported:', e);
      return;
    }
  }

  // Resume context if suspended (browser autoplay policy)
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  try {
    // Create a buzzer sound (descending tone)
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Buzzer characteristics
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.3);

    // Volume envelope
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);

    // Play
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.4);

    // Play a second tone for emphasis
    setTimeout(() => {
      if (!audioContext) return;
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      osc2.connect(gain2);
      gain2.connect(audioContext.destination);
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(300, audioContext.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(150, audioContext.currentTime + 0.3);
      gain2.gain.setValueAtTime(0.25, audioContext.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      osc2.start(audioContext.currentTime);
      osc2.stop(audioContext.currentTime + 0.5);
    }, 200);

  } catch (e) {
    console.warn('Failed to play sound:', e);
  }
}

/**
 * Check for new eliminations and play sound if any
 * Returns the list of new eliminations
 */
export function checkNewEliminations(eliminations) {
  const newEliminations = [];

  for (const elim of eliminations) {
    const elimId = `${elim.team}-${elim.gameId}`;
    if (!seenEliminations.has(elimId)) {
      seenEliminations.add(elimId);
      newEliminations.push(elim);
    }
  }

  // Save seen eliminations
  if (newEliminations.length > 0) {
    try {
      localStorage.setItem(SEEN_ELIMINATIONS_KEY, JSON.stringify([...seenEliminations]));
    } catch (e) {
      console.warn('Failed to save seen eliminations:', e);
    }

    // Play sound for new eliminations
    if (soundEnabled && newEliminations.length > 0) {
      playEliminationSound();
    }
  }

  return newEliminations;
}

/**
 * Clear seen eliminations (for testing)
 */
export function clearSeenEliminations() {
  seenEliminations.clear();
  localStorage.removeItem(SEEN_ELIMINATIONS_KEY);
}
