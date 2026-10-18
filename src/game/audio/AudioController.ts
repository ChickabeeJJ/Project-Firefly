// Synthesised audio (Web Audio): music is a small lookahead sequencer, SFX are short procedural
// voices. Recorded files dropped into src/assets/audio/ take over per slot (see dropins.ts).
import { BGM, SFX_FILES } from './dropins';

export type Sfx =
  | 'tap' | 'back' | 'card' | 'merge' | 'cast' | 'hit' | 'crit' | 'heal' | 'shield' | 'debuff' | 'firefly'
  | 'lantern' | 'finale' | 'enemy' | 'victory' | 'defeat' | 'riteRise' | 'reveal3' | 'reveal4' | 'reveal5'
  | 'deny' | 'death' | 'snuff' | 'levelup';

export type Track = 'lobby' | 'battle' | 'boss' | 'rite';

const NOTE = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

interface TrackDef {
  bpm: number;
  beatsPerBar: number;
  /** Chords as MIDI note lists, one per bar. */
  chords: number[][];
  bass: (bar: number, beat: number, chord: number[]) => number | null;
  pad: (beat: number) => boolean;
  melody: (bar: number, beat: number, chord: number[], rnd: () => number) => number | null;
  tick?: boolean;
  /** Divisions per beat for the bass/tick voices. */
  sub: number;
}

const TRACKS: Record<Track, TrackDef> = {
  lobby: {
    bpm: 84, beatsPerBar: 3, sub: 1,
    chords: [[50, 53, 57], [46, 50, 53], [43, 46, 50], [45, 49, 52, 55]],
    bass: (_bar, beat, ch) => (beat === 0 ? ch[0] - 12 : null),
    pad: (beat) => beat > 0,
    melody: (_bar, beat, ch, rnd) => (rnd() < 0.45 ? ch[Math.floor(rnd() * ch.length)] + 24 + (beat === 2 ? 2 : 0) : null),
  },
  battle: {
    bpm: 112, beatsPerBar: 4, sub: 2, tick: true,
    chords: [[57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 56, 59]],
    bass: (_bar, step, ch) => [ch[0] - 24, null, ch[0] - 12, ch[0] - 24, ch[2] - 24, null, ch[0] - 12, ch[1] - 24][step % 8] ?? null,
    pad: (beat) => beat === 0 || beat === 2,
    melody: (_bar, beat, ch, rnd) => (beat % 2 === 1 && rnd() < 0.35 ? ch[Math.floor(rnd() * ch.length)] + 12 : null),
  },
  boss: {
    bpm: 124, beatsPerBar: 4, sub: 2, tick: true,
    chords: [[50, 53, 57], [50, 53, 57], [46, 50, 53], [49, 52, 55]],
    bass: (_bar, step, ch) => [ch[0] - 24, ch[0] - 24, ch[0] - 12, ch[0] - 24, ch[0] - 24, ch[1] - 24, ch[0] - 12, ch[2] - 24][step % 8] ?? null,
    pad: (beat) => beat === 0,
    melody: (_bar, beat, ch, rnd) => (rnd() < 0.3 ? ch[(beat + 1) % ch.length] + 12 : null),
  },
  rite: {
    bpm: 66, beatsPerBar: 4, sub: 1,
    chords: [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 64], [48, 52, 55, 59]],
    bass: (_bar, beat, ch) => (beat === 0 ? ch[0] - 12 : null),
    pad: (beat) => beat === 0,
    melody: (_bar, _beat, ch, rnd) => (rnd() < 0.7 ? ch[Math.floor(rnd() * ch.length)] + 24 : null),
  },
};

export class AudioController {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private musicBus!: GainNode;
  private sfxBus!: GainNode;
  private noiseBuf!: AudioBuffer;
  private musicVol = 0.6;
  private sfxVol = 0.8;
  private platformMuted = false;
  private hidden = false;
  private track: Track | null = null;
  private timer: number | null = null;
  private nextTime = 0;
  private step = 0;
  private seed = 1;
  private lastPlayed = new Map<Sfx, number>();
  /** Recorded music for the current track, if any (replaces the sequencer). */
  private song: HTMLAudioElement | null = null;
  private songIndex: Partial<Record<Track, number>> = {};
  private sfxBuffers = new Map<Sfx, AudioBuffer>();

  constructor() {
    document.addEventListener('visibilitychange', () => {
      this.hidden = document.hidden;
      this.applyRunning();
      if (this.song) void (this.hidden ? this.song.pause() : this.song.play().catch(() => undefined));
    });
  }

  /** Must be called from a user gesture; safe to call repeatedly. */
  unlock(): void {
    if (!this.ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.connect(this.ctx.destination);
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.ratio.value = 3;
      comp.connect(this.master);
      this.musicBus = this.ctx.createGain();
      this.sfxBus = this.ctx.createGain();
      this.musicBus.connect(comp);
      this.sfxBus.connect(comp);
      this.noiseBuf = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      this.applyVolumes();
      this.loadSfxFiles();
      if (this.track) this.startTrack();
    }
    this.applyRunning();
    if (this.song?.paused && !this.hidden) void this.song.play().catch(() => undefined);
  }

  private loadSfxFiles(): void {
    for (const [name, url] of Object.entries(SFX_FILES) as [Sfx, string][]) {
      fetch(url)
        .then((r) => r.arrayBuffer())
        .then((b) => this.ctx!.decodeAudioData(b))
        .then((buf) => this.sfxBuffers.set(name, buf))
        .catch(() => undefined);
    }
  }

  get unlocked(): boolean {
    return !!this.ctx && this.ctx.state === 'running';
  }

  setVolumes(music: number, sfx: number): void {
    this.musicVol = music;
    this.sfxVol = sfx;
    this.applyVolumes();
  }

  setPlatformMuted(muted: boolean): void {
    this.platformMuted = muted;
    this.applyVolumes();
  }

  private applyVolumes(): void {
    if (this.song) this.song.volume = this.platformMuted ? 0 : Math.min(1, this.musicVol * 0.9);
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(this.platformMuted ? 0 : 1, t, 0.05);
    this.musicBus.gain.setTargetAtTime(this.musicVol * 0.32, t, 0.05);
    this.sfxBus.gain.setTargetAtTime(this.sfxVol * 0.7, t, 0.02);
  }

  private applyRunning(): void {
    if (!this.ctx) return;
    if (this.hidden) void this.ctx.suspend();
    else void this.ctx.resume();
  }

  /** Paused gameplay (e.g. platform ads) should silence everything. */
  suspend(): void {
    void this.ctx?.suspend();
  }

  resume(): void {
    this.applyRunning();
  }

  // ------------------------------------------------------------------ music

  play(track: Track | null): void {
    if (this.track === track) return;
    this.track = track;
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
    this.stopSong();
    if (track && this.ctx) this.startTrack();
  }

  private startTrack(): void {
    if (!this.track) return;
    if (BGM[this.track].length) this.startSong(this.track);
    else this.startSequencer();
  }

  /** Plays the slot's recorded files in turn, fading in. */
  private startSong(track: Track): void {
    const list = BGM[track];
    const i = (this.songIndex[track] ?? -1) + 1;
    this.songIndex[track] = i % list.length;
    const el = new Audio(list[i % list.length]);
    el.preload = 'auto';
    el.loop = list.length === 1;
    const target = () => (this.platformMuted ? 0 : Math.min(1, this.musicVol * 0.9));
    el.volume = 0;
    el.onended = () => {
      if (this.song === el && this.track === track) this.startSong(track);
    };
    this.song = el;
    if (!this.hidden) void el.play().catch(() => undefined);
    const t0 = performance.now();
    const fade = () => {
      if (this.song !== el) return;
      const k = Math.min(1, (performance.now() - t0) / 1200);
      el.volume = target() * k;
      if (k < 1) requestAnimationFrame(fade);
    };
    requestAnimationFrame(fade);
  }

  private stopSong(): void {
    const el = this.song;
    if (!el) return;
    this.song = null;
    const v0 = el.volume;
    const t0 = performance.now();
    const fade = () => {
      const k = Math.min(1, (performance.now() - t0) / 600);
      el.volume = v0 * (1 - k);
      if (k < 1) requestAnimationFrame(fade);
      else {
        el.pause();
        el.src = '';
      }
    };
    requestAnimationFrame(fade);
  }

  private startSequencer(): void {
    if (!this.ctx || !this.track) return;
    this.nextTime = this.ctx.currentTime + 0.1;
    this.step = 0;
    this.timer = window.setInterval(() => this.schedule(), 60);
  }

  private rnd(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return this.seed / 2147483647;
  }

  private schedule(): void {
    if (!this.ctx || !this.track) return;
    const def = TRACKS[this.track];
    const stepDur = 60 / def.bpm / def.sub;
    while (this.nextTime < this.ctx.currentTime + 0.25) {
      const stepsPerBar = def.beatsPerBar * def.sub;
      const bar = Math.floor(this.step / stepsPerBar);
      const inBar = this.step % stepsPerBar;
      const beat = Math.floor(inBar / def.sub);
      const onBeat = inBar % def.sub === 0;
      const chord = def.chords[bar % def.chords.length];
      const t = this.nextTime;
      const b = def.bass(bar, def.sub > 1 ? inBar : beat, chord);
      if (b !== null && (def.sub > 1 || onBeat)) this.pluck(NOTE(b), t, def.sub > 1 ? 0.22 : 0.9, 0.5);
      if (onBeat && def.pad(beat)) for (const n of chord) this.pad(NOTE(n), t, (60 / def.bpm) * (this.track === 'rite' ? 3.8 : 0.9), 0.1);
      if (onBeat) {
        const m = def.melody(bar, beat, chord, () => this.rnd());
        if (m !== null) this.bell(NOTE(m), t, 0.12);
      }
      if (def.tick) this.noise(t, 0.03, 6000, 0.05);
      if (this.track === 'lobby' && this.rnd() < 0.08) this.noise(t + this.rnd() * 0.2, 0.01, 2500, 0.06);
      this.nextTime += stepDur;
      this.step++;
    }
  }

  // ------------------------------------------------------------------ voices

  private env(g: GainNode, t: number, peak: number, attack: number, decay: number): void {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }

  private osc(type: OscillatorType, freq: number, t: number, dur: number, peak: number, attack: number, bus: GainNode, detune = 0, freqEnd?: number): void {
    const c = this.ctx!;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
    o.detune.value = detune;
    this.env(g, t, peak, attack, dur);
    o.connect(g);
    g.connect(bus);
    o.start(t);
    o.stop(t + attack + dur + 0.05);
    o.onended = () => {
      o.disconnect();
      g.disconnect();
    };
  }

  private pluck(freq: number, t: number, dur: number, vol: number): void {
    this.osc('triangle', freq, t, dur, vol * 0.6, 0.005, this.musicBus);
    this.osc('sine', freq * 2, t, dur * 0.5, vol * 0.15, 0.005, this.musicBus);
  }

  private pad(freq: number, t: number, dur: number, vol: number): void {
    this.osc('sine', freq, t, dur, vol, 0.08, this.musicBus, -6);
    this.osc('triangle', freq, t, dur, vol * 0.4, 0.12, this.musicBus, 7);
  }

  private bell(freq: number, t: number, vol: number, bus = this.musicBus): void {
    this.osc('sine', freq, t, 1.2, vol, 0.004, bus);
    this.osc('sine', freq * 2.76, t, 0.4, vol * 0.25, 0.002, bus);
    this.osc('sine', freq * 5.4, t, 0.15, vol * 0.1, 0.002, bus);
  }

  private noise(t: number, dur: number, freq: number, vol: number, bus = this.musicBus, type: BiquadFilterType = 'highpass', sweepTo?: number): void {
    const c = this.ctx!;
    const src = c.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = c.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, t);
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
    const g = c.createGain();
    this.env(g, t, vol, 0.004, dur);
    src.connect(f);
    f.connect(g);
    g.connect(bus);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.05);
    src.onended = () => {
      src.disconnect();
      f.disconnect();
      g.disconnect();
    };
  }

  sfx(name: Sfx): void {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    // Rate-limit very frequent sounds so repeats stay pleasant.
    const last = this.lastPlayed.get(name) ?? -1;
    if (now - last < 0.035) return;
    this.lastPlayed.set(name, now);
    const t = now + 0.005;
    const B = this.sfxBus;
    const file = this.sfxBuffers.get(name);
    if (file) {
      const src = this.ctx.createBufferSource();
      src.buffer = file;
      src.connect(B);
      src.start(t);
      src.onended = () => src.disconnect();
      return;
    }
    const v = 0.9 + Math.random() * 0.2;
    switch (name) {
      case 'tap':
        this.osc('sine', 880 * v, t, 0.06, 0.25, 0.003, B, 0, 620);
        this.noise(t, 0.02, 3000, 0.08, B);
        break;
      case 'back':
        this.osc('sine', 520 * v, t, 0.08, 0.22, 0.003, B, 0, 380);
        break;
      case 'card':
        this.noise(t, 0.07, 2400 * v, 0.22, B, 'bandpass', 5200);
        this.osc('triangle', 1320 * v, t, 0.05, 0.06, 0.002, B);
        break;
      case 'merge':
        this.bell(NOTE(88), t, 0.22, B);
        this.bell(NOTE(95), t + 0.08, 0.2, B);
        this.noise(t, 0.25, 6000, 0.06, B);
        break;
      case 'cast':
        for (let i = 0; i < 4; i++) this.osc('sine', 600 * (1 + i * 0.5) * v, t + i * 0.02, 0.3, 0.06, 0.02, B, 0, 1400 * (1 + i * 0.5));
        this.noise(t, 0.3, 4000, 0.05, B, 'highpass');
        break;
      case 'hit':
        // Silent by design: drop sfx/hit.mp3 in to give attacks an impact sound.
        break;
      case 'crit':
        // Only a soft chime on crits; drop sfx/crit.mp3 in for an impact.
        this.bell(NOTE(96), t, 0.1, B);
        break;
      case 'heal':
        [72, 76, 79, 84].forEach((n, i) => this.osc('sine', NOTE(n), t + i * 0.06, 0.5, 0.12, 0.03, B));
        break;
      case 'shield':
        this.osc('triangle', 1250, t, 0.35, 0.14, 0.004, B);
        this.osc('sine', 1870, t + 0.02, 0.3, 0.08, 0.004, B);
        this.noise(t, 0.2, 7000, 0.05, B);
        break;
      case 'debuff':
        this.osc('sawtooth', 330, t, 0.35, 0.06, 0.01, B, 0, 220);
        this.osc('sine', 311, t, 0.4, 0.12, 0.01, B, 0, 200);
        break;
      case 'firefly':
        this.osc('sine', 2200 + Math.random() * 900, t, 0.12, 0.08, 0.004, B);
        break;
      case 'lantern':
        [60, 64, 67, 71, 74].forEach((n, i) => {
          this.pad(NOTE(n), t + i * 0.04, 1.6, 0.08);
          this.bell(NOTE(n + 24), t + 0.2 + i * 0.09, 0.08, B);
        });
        this.noise(t, 1.0, 400, 0.08, B, 'bandpass', 4000);
        break;
      case 'finale':
        this.noise(t, 0.6, 300, 0.25, B, 'bandpass', 5000);
        [57, 61, 64, 69].forEach((n) => this.osc('sawtooth', NOTE(n), t + 0.35, 0.9, 0.05, 0.05, B));
        this.bell(NOTE(93), t + 0.35, 0.2, B);
        break;
      case 'enemy':
        this.osc('sawtooth', 82 * v, t, 0.3, 0.12, 0.01, B, 0, 60);
        this.osc('sawtooth', 87 * v, t, 0.3, 0.1, 0.01, B, 0, 64);
        break;
      case 'snuff':
        this.osc('sine', 1600, t, 0.4, 0.12, 0.004, B, 0, 300);
        this.noise(t, 0.3, 3000, 0.1, B, 'lowpass', 300);
        break;
      case 'death':
        this.noise(t, 0.7, 2000, 0.18, B, 'lowpass', 200);
        this.osc('sine', 300, t, 0.6, 0.12, 0.01, B, 0, 80);
        break;
      case 'victory':
        [[60, 64, 67], [65, 69, 72], [67, 71, 74], [72, 76, 79, 84]].forEach((ch, i) => {
          for (const n of ch) {
            this.osc('triangle', NOTE(n), t + i * 0.22, i === 3 ? 1.4 : 0.3, 0.09, 0.01, B);
            this.osc('sawtooth', NOTE(n), t + i * 0.22, i === 3 ? 1.2 : 0.25, 0.025, 0.02, B);
          }
        });
        this.bell(NOTE(96), t + 0.66, 0.2, B);
        break;
      case 'defeat':
        [69, 65, 62, 57].forEach((n, i) => this.osc('triangle', NOTE(n), t + i * 0.3, 0.8, 0.12, 0.02, B));
        break;
      case 'riteRise':
        this.noise(t, 2.0, 200, 0.18, B, 'bandpass', 6000);
        this.osc('sine', 110, t, 2.0, 0.15, 0.6, B, 0, 440);
        break;
      case 'reveal3':
        this.bell(NOTE(84), t, 0.18, B);
        break;
      case 'reveal4':
        this.bell(NOTE(84), t, 0.18, B);
        this.bell(NOTE(91), t + 0.1, 0.18, B);
        break;
      case 'reveal5':
        [72, 76, 79, 84, 88, 91].forEach((n, i) => this.bell(NOTE(n), t + i * 0.07, 0.16, B));
        [48, 55, 60, 64].forEach((n) => this.pad(NOTE(n), t, 2.2, 0.12));
        break;
      case 'deny':
        this.osc('square', 180, t, 0.08, 0.06, 0.003, B);
        this.osc('square', 150, t + 0.1, 0.1, 0.06, 0.003, B);
        break;
      case 'levelup':
        [76, 79, 83, 88].forEach((n, i) => this.bell(NOTE(n), t + i * 0.08, 0.14, B));
        break;
    }
  }
}

export const audio = new AudioController();
