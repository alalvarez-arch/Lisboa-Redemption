/**
 * Procedural WebAudio — original chiptune-ish motifs.
 * Inspired by the vibe of "One Way or Another" without using copyrighted audio.
 */
export class AudioSynth {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  muted = false;

  ensure() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.35;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  private tone(
    freq: number,
    start: number,
    dur: number,
    type: OscillatorType = 'square',
    vol = 0.15,
  ) {
    if (this.muted) return;
    const ctx = this.ensure();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(vol, start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(g);
    g.connect(this.master!);
    osc.start(start);
    osc.stop(start + dur + 0.05);
  }

  /** Short motif vaguely reminiscent of a catchy rock hook (original notes) */
  playOneWayMotif() {
    if (this.muted) return;
    const ctx = this.ensure();
    const t = ctx.currentTime;
    // Original descending/ascending pattern — NOT a note-for-note copy
    const notes = [392, 440, 494, 523, 494, 440, 392, 349, 392, 440, 392];
    notes.forEach((f, i) => {
      this.tone(f, t + i * 0.18, 0.16, 'square', 0.12);
      this.tone(f / 2, t + i * 0.18, 0.16, 'triangle', 0.06);
    });
  }

  shoot() {
    if (this.muted) return;
    const ctx = this.ensure();
    const t = ctx.currentTime;
    this.tone(880, t, 0.06, 'square', 0.1);
    this.tone(440, t + 0.04, 0.08, 'sawtooth', 0.06);
  }

  jump() {
    if (this.muted) return;
    const ctx = this.ensure();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(440, t + 0.12);
    g.gain.setValueAtTime(0.1, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
    osc.connect(g);
    g.connect(this.master!);
    osc.start(t);
    osc.stop(t + 0.16);
  }

  hit() {
    if (this.muted) return;
    const ctx = this.ensure();
    const t = ctx.currentTime;
    this.tone(150, t, 0.1, 'sawtooth', 0.12);
    this.tone(80, t + 0.05, 0.15, 'triangle', 0.08);
  }

  enemyDie() {
    if (this.muted) return;
    const ctx = this.ensure();
    const t = ctx.currentTime;
    this.tone(300, t, 0.08, 'square', 0.1);
    this.tone(200, t + 0.06, 0.1, 'square', 0.08);
    this.tone(100, t + 0.12, 0.15, 'triangle', 0.1);
  }

  neptuno() {
    if (this.muted) return;
    const ctx = this.ensure();
    const t = ctx.currentTime;
    [523, 659, 784, 1046].forEach((f, i) => {
      this.tone(f, t + i * 0.08, 0.2, 'sawtooth', 0.14);
    });
  }

  thunder() {
    if (this.muted) return;
    const ctx = this.ensure();
    const t = ctx.currentTime;
    const bufferSize = ctx.sampleRate * 0.4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.15));
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const g = ctx.createGain();
    g.gain.value = 0.4;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    src.connect(filter);
    filter.connect(g);
    g.connect(this.master!);
    src.start(t);
  }

  victory() {
    if (this.muted) return;
    const ctx = this.ensure();
    const t = ctx.currentTime;
    [523, 659, 784, 1046, 784, 1046].forEach((f, i) => {
      this.tone(f, t + i * 0.15, 0.2, 'square', 0.12);
    });
  }

  gameOver() {
    if (this.muted) return;
    const ctx = this.ensure();
    const t = ctx.currentTime;
    [392, 349, 330, 294, 262].forEach((f, i) => {
      this.tone(f, t + i * 0.22, 0.25, 'triangle', 0.14);
    });
  }


  forceWhoosh() {
    if (this.muted) return;
    const ctx = this.ensure();
    const t = ctx.currentTime;
    // Rising whoosh — Jedi / Force feel (original)
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(680, t + 0.14);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.14, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    osc.connect(g);
    g.connect(this.master!);
    osc.start(t);
    osc.stop(t + 0.25);
    this.tone(880, t + 0.02, 0.06, 'square', 0.06);
    this.tone(220, t + 0.08, 0.1, 'triangle', 0.05);
  }

  spark() {
    if (this.muted) return;
    const ctx = this.ensure();
    const t = ctx.currentTime;
    this.tone(1400, t, 0.04, 'square', 0.07);
    this.tone(900, t + 0.03, 0.05, 'sawtooth', 0.05);
  }

  waveAlert() {
    if (this.muted) return;
    const ctx = this.ensure();
    const t = ctx.currentTime;
    [523, 659, 784].forEach((f, i) => {
      this.tone(f, t + i * 0.07, 0.1, 'square', 0.1);
    });
  }

  click() {
    this.tone(600, this.ensure().currentTime, 0.05, 'square', 0.08);
  }
}

export const audio = new AudioSynth();
