/* =========================================================
   PROFESSIONAL DISASTER ALERT AUDIO ENGINE
   Web Audio API
   ========================================================= */

let audioCtx = null;
let masterGain = null;

let sirenOscillator = null;
let sirenGain = null;
let sirenLfo = null;
let sirenLfoGain = null;
let sirenStopTimer = null;

let warningTimer = null;
let isMuted = false;
let masterVolume = 0.65;

/* =========================================================
   CONFIGURATION
   ========================================================= */

const AUDIO_CONFIG = {
  siren: {
    type: "sawtooth",
    minFrequency: 520,
    maxFrequency: 950,
    volume: 0.18,
    sweepTime: 0.9,
  },

  warning: {
    frequency: 880,
    duration: 0.35,
    volume: 0.14,
  },

  success: {
    notes: [523.25, 659.25, 783.99],
    spacing: 0.09,
    noteDuration: 0.3,
    volume: 0.12,
  },

  emergency: {
    notes: [440, 660, 880],
    spacing: 0.14,
    noteDuration: 0.22,
    volume: 0.16,
  },
};

/* =========================================================
   AUDIO CONTEXT
   ========================================================= */

function getAudioContext() {
  if (typeof window === "undefined") {
    return null;
  }

  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
      console.warn("Web Audio API is not supported.");
      return null;
    }

    try {
      audioCtx = new AudioContextClass();

      masterGain = audioCtx.createGain();

      masterGain.gain.setValueAtTime(masterVolume, audioCtx.currentTime);

      masterGain.connect(audioCtx.destination);
    } catch (error) {
      console.warn("Failed to initialize audio:", error);
      return null;
    }
  }

  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {
      console.warn("Unable to resume AudioContext.");
    });
  }

  return audioCtx;
}

/* =========================================================
   INITIALIZE AUDIO
   ========================================================= */

export async function initializeAudio() {
  const ctx = getAudioContext();

  if (!ctx) {
    return false;
  }

  try {
    if (ctx.state === "suspended") {
      await ctx.resume();
    }

    return ctx.state === "running";
  } catch (error) {
    console.warn("Audio initialization failed:", error);
    return false;
  }
}

/* =========================================================
   MASTER VOLUME
   ========================================================= */

export function setMasterVolume(volume) {
  const ctx = getAudioContext();

  const safeVolume = Math.min(Math.max(Number(volume) || 0, 0), 1);

  masterVolume = safeVolume;

  if (masterGain && ctx) {
    const now = ctx.currentTime;

    masterGain.gain.cancelScheduledValues(now);

    masterGain.gain.linearRampToValueAtTime(
      isMuted ? 0 : masterVolume,
      now + 0.08,
    );
  }
}

export function getMasterVolume() {
  return masterVolume;
}

/* =========================================================
   MUTE / UNMUTE
   ========================================================= */

export function muteAudio() {
  isMuted = true;

  if (!masterGain || !audioCtx) {
    return;
  }

  const now = audioCtx.currentTime;

  masterGain.gain.cancelScheduledValues(now);

  masterGain.gain.linearRampToValueAtTime(0, now + 0.08);
}

export function unmuteAudio() {
  isMuted = false;

  if (!masterGain || !audioCtx) {
    return;
  }

  const now = audioCtx.currentTime;

  masterGain.gain.cancelScheduledValues(now);

  masterGain.gain.linearRampToValueAtTime(masterVolume, now + 0.08);
}

export function toggleMute() {
  if (isMuted) {
    unmuteAudio();
  } else {
    muteAudio();
  }

  return isMuted;
}

export function isAudioMuted() {
  return isMuted;
}

/* =========================================================
   UTILITY: SAFE OSCILLATOR
   ========================================================= */

function createTone({
  frequency,
  type = "sine",
  volume = 0.1,
  startTime,
  duration = 0.3,
}) {
  const ctx = getAudioContext();

  if (!ctx || !masterGain || isMuted) {
    return null;
  }

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;

  const start = startTime ?? ctx.currentTime;
  const end = start + duration;

  osc.frequency.setValueAtTime(frequency, start);

  gain.gain.setValueAtTime(0.0001, start);

  gain.gain.exponentialRampToValueAtTime(
    Math.max(volume, 0.001),
    start + 0.025,
  );

  gain.gain.exponentialRampToValueAtTime(0.0001, end);

  osc.connect(gain);
  gain.connect(masterGain);

  osc.start(start);
  osc.stop(end);

  osc.onended = () => {
    try {
      osc.disconnect();
      gain.disconnect();
    } catch {
      // Ignore cleanup errors.
    }
  };

  return osc;
}

/* =========================================================
   EMERGENCY SIREN
   ========================================================= */

export function playEmergencySiren(durationSeconds = 8) {
  try {
    const ctx = getAudioContext();

    if (!ctx || !masterGain || isMuted) {
      return false;
    }

    stopEmergencySiren();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    /*
     * LFO controls the frequency sweep smoothly.
     * This is better than setInterval() for audio timing.
     */
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();

    osc.type = AUDIO_CONFIG.siren.type;

    const now = ctx.currentTime;

    osc.frequency.setValueAtTime(AUDIO_CONFIG.siren.minFrequency, now);

    /*
     * Frequency center.
     */
    const centerFrequency =
      (AUDIO_CONFIG.siren.minFrequency + AUDIO_CONFIG.siren.maxFrequency) / 2;

    const frequencyDepth =
      (AUDIO_CONFIG.siren.maxFrequency - AUDIO_CONFIG.siren.minFrequency) / 2;

    osc.frequency.setValueAtTime(centerFrequency, now);

    lfo.type = "sine";

    lfo.frequency.setValueAtTime(1 / AUDIO_CONFIG.siren.sweepTime, now);

    lfoGain.gain.setValueAtTime(frequencyDepth, now);

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    gain.gain.setValueAtTime(0.0001, now);

    gain.gain.exponentialRampToValueAtTime(
      AUDIO_CONFIG.siren.volume,
      now + 0.12,
    );

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(now);
    lfo.start(now);

    sirenOscillator = osc;
    sirenGain = gain;
    sirenLfo = lfo;
    sirenLfoGain = lfoGain;

    sirenStopTimer = window.setTimeout(
      () => {
        stopEmergencySiren();
      },
      Math.max(1, durationSeconds) * 1000,
    );

    return true;
  } catch (error) {
    console.warn("Emergency siren unavailable:", error);

    return false;
  }
}

/* =========================================================
   STOP SIREN
   ========================================================= */

export function stopEmergencySiren() {
  if (sirenStopTimer) {
    clearTimeout(sirenStopTimer);
    sirenStopTimer = null;
  }

  if (!audioCtx) {
    return;
  }

  const now = audioCtx.currentTime;

  try {
    if (sirenGain) {
      sirenGain.gain.cancelScheduledValues(now);

      sirenGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    }

    window.setTimeout(() => {
      try {
        if (sirenOscillator) {
          sirenOscillator.stop();
          sirenOscillator.disconnect();
        }

        if (sirenLfo) {
          sirenLfo.stop();
          sirenLfo.disconnect();
        }

        if (sirenLfoGain) {
          sirenLfoGain.disconnect();
        }

        if (sirenGain) {
          sirenGain.disconnect();
        }
      } catch {
        // Already stopped.
      }

      sirenOscillator = null;
      sirenGain = null;
      sirenLfo = null;
      sirenLfoGain = null;
    }, 120);
  } catch {
    sirenOscillator = null;
    sirenGain = null;
    sirenLfo = null;
    sirenLfoGain = null;
  }
}

/* =========================================================
   WARNING BEEP
   ========================================================= */

export function playWarningBeep() {
  try {
    if (warningTimer) {
      clearTimeout(warningTimer);
      warningTimer = null;
    }

    const ctx = getAudioContext();

    if (!ctx || !masterGain || isMuted) {
      return false;
    }

    createTone({
      frequency: AUDIO_CONFIG.warning.frequency,
      type: "sine",
      volume: AUDIO_CONFIG.warning.volume,
      duration: AUDIO_CONFIG.warning.duration,
    });

    return true;
  } catch (error) {
    console.warn("Warning beep unavailable:", error);

    return false;
  }
}

/* =========================================================
   SUCCESS CHIME
   ========================================================= */

export function playSuccessChime() {
  try {
    const ctx = getAudioContext();

    if (!ctx || !masterGain || isMuted) {
      return false;
    }

    const now = ctx.currentTime;

    AUDIO_CONFIG.success.notes.forEach((frequency, index) => {
      createTone({
        frequency,
        type: "triangle",
        volume: AUDIO_CONFIG.success.volume,
        startTime: now + index * AUDIO_CONFIG.success.spacing,
        duration: AUDIO_CONFIG.success.noteDuration,
      });
    });

    return true;
  } catch (error) {
    console.warn("Success chime unavailable:", error);

    return false;
  }
}

/* =========================================================
   EMERGENCY ALERT TONE
   ========================================================= */

export function playEmergencyAlert() {
  try {
    const ctx = getAudioContext();

    if (!ctx || !masterGain || isMuted) {
      return false;
    }

    const now = ctx.currentTime;

    AUDIO_CONFIG.emergency.notes.forEach((frequency, index) => {
      createTone({
        frequency,
        type: "square",
        volume: AUDIO_CONFIG.emergency.volume,
        startTime: now + index * AUDIO_CONFIG.emergency.spacing,
        duration: AUDIO_CONFIG.emergency.noteDuration,
      });
    });

    return true;
  } catch (error) {
    console.warn("Emergency alert unavailable:", error);

    return false;
  }
}

/* =========================================================
   DISASTER ALERT PRESETS
   ========================================================= */

export function playDisasterAlert(type = "general") {
  switch (String(type).toLowerCase()) {
    case "earthquake":
      playEmergencyAlert();
      setTimeout(() => {
        playEmergencySiren(6);
      }, 450);
      break;

    case "flood":
      playWarningBeep();
      setTimeout(() => {
        playEmergencySiren(7);
      }, 450);
      break;

    case "landslide":
      playEmergencyAlert();
      setTimeout(() => {
        playEmergencySiren(6);
      }, 500);
      break;

    case "cyclone":
      playWarningBeep();
      setTimeout(() => {
        playEmergencySiren(8);
      }, 500);
      break;

    case "wildfire":
      playEmergencyAlert();
      setTimeout(() => {
        playEmergencySiren(8);
      }, 450);
      break;

    default:
      playEmergencyAlert();

      setTimeout(() => {
        playEmergencySiren(6);
      }, 450);
  }
}

/* =========================================================
   STOP ALL AUDIO
   ========================================================= */

export function stopAllAudio() {
  stopEmergencySiren();

  if (warningTimer) {
    clearTimeout(warningTimer);
    warningTimer = null;
  }
}

/* =========================================================
   SHUTDOWN AUDIO ENGINE
   ========================================================= */

export async function shutdownAudio() {
  try {
    stopAllAudio();

    if (masterGain) {
      masterGain.disconnect();
      masterGain = null;
    }

    if (audioCtx) {
      await audioCtx.close();
      audioCtx = null;
    }
  } catch (error) {
    console.warn("Audio shutdown failed:", error);

    audioCtx = null;
    masterGain = null;
  }
}

/* =========================================================
   AUDIO STATUS
   ========================================================= */

export function getAudioStatus() {
  return {
    supported:
      typeof window !== "undefined" &&
      !!(window.AudioContext || window.webkitAudioContext),

    contextState: audioCtx?.state ?? "not-initialized",

    muted: isMuted,

    volume: masterVolume,

    sirenActive: sirenOscillator !== null,
  };
}
