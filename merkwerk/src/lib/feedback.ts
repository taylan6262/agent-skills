import { getSave } from '../state/store';

/** Soundeffekte werden zur Laufzeit per Web Audio API erzeugt – keine Audiodateien. */
export type SoundId = 'tap' | 'correct' | 'wrong' | 'combo' | 'star' | 'levelup' | 'tick' | 'start' | 'flip';

type AudioCtor = typeof AudioContext;
let ctx: AudioContext | null = null;

function userHasInteracted(): boolean {
  return 'userActivation' in navigator ? navigator.userActivation.hasBeenActive : true;
}

function audio(): AudioContext | null {
  if (ctx) {
    if (ctx.state === 'suspended') void ctx.resume().catch(() => undefined);
    return ctx;
  }
  // Erst nach einer Nutzeraktion anlegen, sonst blockiert der Browser die Wiedergabe.
  if (!userHasInteracted()) return null;
  const legacy = (window as Window & { webkitAudioContext?: AudioCtor }).webkitAudioContext;
  const Ctor: AudioCtor | undefined = 'AudioContext' in window ? window.AudioContext : legacy;
  if (!Ctor) return null;
  try {
    ctx = new Ctor();
  } catch {
    return null;
  }
  return ctx;
}

interface Tone {
  freq: number;
  to?: number;
  at?: number;
  dur: number;
  type?: OscillatorType;
  gain?: number;
}

function play(tones: Tone[]): void {
  const ac = audio();
  if (!ac) return;
  const now = ac.currentTime + 0.01;
  const master = ac.createGain();
  master.gain.value = 0.18;
  master.connect(ac.destination);
  for (const t of tones) {
    const osc = ac.createOscillator();
    const env = ac.createGain();
    const start = now + (t.at ?? 0);
    osc.type = t.type ?? 'sine';
    osc.frequency.setValueAtTime(t.freq, start);
    if (t.to) osc.frequency.exponentialRampToValueAtTime(t.to, start + t.dur);
    env.gain.setValueAtTime(0.0001, start);
    env.gain.exponentialRampToValueAtTime(t.gain ?? 1, start + 0.012);
    env.gain.exponentialRampToValueAtTime(0.0001, start + t.dur);
    osc.connect(env);
    env.connect(master);
    osc.start(start);
    osc.stop(start + t.dur + 0.02);
  }
}

const SOUNDS: Record<SoundId, (step: number) => Tone[]> = {
  tap: () => [{ freq: 520, dur: 0.05, type: 'triangle', gain: 0.5 }],
  flip: () => [{ freq: 300, to: 520, dur: 0.09, type: 'triangle', gain: 0.5 }],
  tick: () => [{ freq: 880, dur: 0.04, type: 'square', gain: 0.15 }],
  start: () => [
    { freq: 392, dur: 0.1, type: 'triangle' },
    { freq: 587, at: 0.1, dur: 0.16, type: 'triangle' },
  ],
  correct: (step) => [
    { freq: 660 * 2 ** (Math.min(step, 12) / 24), dur: 0.08, type: 'triangle' },
    { freq: 990 * 2 ** (Math.min(step, 12) / 24), at: 0.07, dur: 0.12, type: 'sine' },
  ],
  wrong: () => [
    { freq: 196, to: 130, dur: 0.22, type: 'sawtooth', gain: 0.35 },
    { freq: 185, to: 123, dur: 0.22, type: 'square', gain: 0.12 },
  ],
  combo: (step) => [0, 4, 7, 12].map((semi, i) => ({ freq: 523 * 2 ** ((semi + step) / 12), at: i * 0.05, dur: 0.12, type: 'triangle' as const, gain: 0.6 })),
  star: (step) => [
    { freq: 784 * 2 ** ((step * 4) / 12), dur: 0.35, type: 'sine' },
    { freq: 1568 * 2 ** ((step * 4) / 12), dur: 0.25, type: 'triangle', gain: 0.25 },
  ],
  levelup: () => [523, 659, 784, 1047].map((freq, i) => ({ freq, at: i * 0.09, dur: 0.22, type: 'triangle' as const })),
};

export function playSound(id: SoundId, step = 0): void {
  if (!getSave().settings.sound) return;
  try {
    play(SOUNDS[id](step));
  } catch {
    // Ton ist Beiwerk – Fehler dürfen das Spiel nie stören.
  }
}

const VIBRATION: Partial<Record<SoundId, number | number[]>> = {
  correct: 12,
  wrong: [30, 40, 30],
  star: 18,
  levelup: [20, 30, 20, 30, 40],
};

export function vibrate(id: SoundId): void {
  if (!getSave().settings.haptics || !userHasInteracted()) return;
  const pattern = VIBRATION[id];
  if (pattern === undefined || typeof navigator.vibrate !== 'function') return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // ignorieren
  }
}

/** Ton und Haptik gemeinsam. */
export function feedback(id: SoundId, step = 0): void {
  playSound(id, step);
  vibrate(id);
}
