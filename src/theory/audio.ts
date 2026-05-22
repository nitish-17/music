import { midiToFrequency } from './notes';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    // Standard audio context initialization
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  
  return audioCtx;
}

export interface PlayNoteOptions {
  durationSec?: number;
  type?: OscillatorType; // 'sine' | 'square' | 'sawtooth' | 'triangle'
  volume?: number; // 0 to 1
}

/**
 * Plays a single note using Web Audio API synthesis.
 * Returns a function to stop the note early if needed.
 */
export function playNote(midiNumber: number, options: PlayNoteOptions = {}): () => void {
  try {
    const ctx = getAudioContext();
    const frequency = midiToFrequency(midiNumber);
    const duration = options.durationSec ?? 0.4;
    const waveType = options.type ?? 'triangle';
    const volume = options.volume ?? 0.3;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = waveType;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);

    // Audio envelope: Attack-Decay-Release
    const now = ctx.currentTime;
    
    // Start at 0 volume
    gainNode.gain.setValueAtTime(0, now);
    
    // Attack: ramp up to volume in 0.01 seconds
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.01);
    
    // Decay/Sustain: decay slightly to 70% of target volume over 0.15s
    gainNode.gain.exponentialRampToValueAtTime(volume * 0.7, now + 0.16);

    // Release: fade to 0 starting at duration - 0.08 and ending at duration
    const fadeStart = now + Math.max(0.05, duration - 0.08);
    const fadeEnd = now + duration;
    
    gainNode.gain.setValueAtTime(volume * 0.7, fadeStart);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, fadeEnd);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(fadeEnd);

    // Return a stop handle to shut off the oscillator immediately if needed
    return () => {
      try {
        gainNode.gain.cancelScheduledValues(ctx.currentTime);
        gainNode.gain.setValueAtTime(gainNode.gain.value, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);
        setTimeout(() => {
          osc.disconnect();
          gainNode.disconnect();
        }, 100);
      } catch (err) {
        // Ignore context errors
      }
    };
  } catch (error) {
    console.error('Failed to play note:', error);
    return () => {};
  }
}
