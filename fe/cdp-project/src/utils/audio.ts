// Web Audio API Sound Effects for POS Cashier Terminal
// Synthesizes instant sound feedback without external audio files

class POSAudio {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  constructor() {
    // Check if audio preference was saved
    try {
      const saved = localStorage.getItem("stokkita_pos_audio");
      if (saved !== null) {
        this.enabled = saved === "true";
      }
    } catch (e) {
      this.enabled = true;
    }
  }

  private getContext(): AudioContext | null {
    if (!this.enabled) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public toggleAudio(): boolean {
    this.enabled = !this.enabled;
    try {
      localStorage.setItem("stokkita_pos_audio", String(this.enabled));
    } catch (e) {}
    if (this.enabled) {
      this.playScanBeep();
    }
    return this.enabled;
  }

  // 1. High-frequency scanner beep (1760 Hz, 80ms)
  public playScanBeep() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(1760, ctx.currentTime); // High pitch (A6)

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {
      console.warn("Audio play error:", e);
    }
  }

  // 2. Cheerful Chime on Successful Payment (C5 -> E5 -> G5 chord)
  public playSuccessChime() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        const startTime = ctx.currentTime + idx * 0.08;
        const duration = 0.25;

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.12, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);
      });
    } catch (e) {
      console.warn("Audio play error:", e);
    }
  }

  // 3. Low-pitch Double Beep on Out of Stock or Error (300 Hz)
  public playErrorBeep() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      [0, 0.12].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        const startTime = ctx.currentTime + offset;
        const duration = 0.09;

        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(320, startTime);

        gain.gain.setValueAtTime(0.1, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);
      });
    } catch (e) {
      console.warn("Audio play error:", e);
    }
  }
}

export const posAudio = new POSAudio();
