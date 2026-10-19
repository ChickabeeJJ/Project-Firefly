// CrazyGames SDK v3 integration, isolated behind one adapter. Every call is guarded so the game
// runs normally when the SDK is missing (local dev, blocked network) or disabled.

interface CGGame {
  gameplayStart(): void;
  gameplayStop(): void;
  loadingStart(): void;
  loadingStop(): void;
  happytime(): void;
  settings?: { muteAudio?: boolean };
  addSettingsChangeListener?(cb: (s: { muteAudio?: boolean }) => void): void;
}

interface CGData {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

interface CGAdCallbacks {
  adStarted?: () => void;
  adFinished?: () => void;
  adError?: (error: unknown) => void;
}

interface CGAd {
  requestAd(type: 'midgame' | 'rewarded', callbacks: CGAdCallbacks): void;
}

interface CGSdk {
  init(): Promise<void>;
  environment?: string;
  game: CGGame;
  data?: CGData;
  ad?: CGAd;
}

declare global {
  interface Window {
    CrazyGames?: { SDK?: CGSdk };
  }
}

class PlatformAdapter {
  private sdk: CGSdk | null = null;
  private inGameplay = false;
  private loading = false;
  private muteListeners: ((muted: boolean) => void)[] = [];

  /** Awaits SDK init with a timeout; never throws. */
  async init(timeoutMs = 2500): Promise<void> {
    const candidate = window.CrazyGames?.SDK;
    if (!candidate) return;
    try {
      await Promise.race([
        candidate.init(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('SDK init timeout')), timeoutMs)),
      ]);
      if (candidate.environment === 'disabled') return;
      this.sdk = candidate;
      this.sdk.game.addSettingsChangeListener?.((s) => this.emitMute(!!s.muteAudio));
    } catch (err) {
      console.warn('[platform] CrazyGames SDK unavailable, continuing offline.', err);
      this.sdk = null;
    }
  }

  get available(): boolean {
    return this.sdk !== null;
  }

  get muted(): boolean {
    return !!this.sdk?.game.settings?.muteAudio;
  }

  onMuteChange(cb: (muted: boolean) => void): void {
    this.muteListeners.push(cb);
  }

  private emitMute(m: boolean): void {
    for (const cb of this.muteListeners) cb(m);
  }

  private call(fn: (sdk: CGSdk) => void): void {
    if (!this.sdk) return;
    try {
      fn(this.sdk);
    } catch (err) {
      console.warn('[platform] SDK call failed', err);
    }
  }

  loadingStart(): void {
    if (this.loading) return;
    this.loading = true;
    this.call((s) => s.game.loadingStart());
  }

  loadingStop(): void {
    if (!this.loading) return;
    this.loading = false;
    this.call((s) => s.game.loadingStop());
  }

  private firstPlay: (() => void)[] = [];
  private played = false;

  /** Runs once, the first time the player is actually playing (or at once if they already have). */
  onFirstGameplay(cb: () => void): void {
    if (this.played) cb();
    else this.firstPlay.push(cb);
  }

  /** Only called when the player is actually in an interactive battle. */
  gameplayStart(): void {
    if (this.inGameplay) return;
    this.inGameplay = true;
    this.call((s) => s.game.gameplayStart());
    if (!this.played) {
      this.played = true;
      for (const cb of this.firstPlay.splice(0)) cb();
    }
  }

  gameplayStop(): void {
    if (!this.inGameplay) return;
    this.inGameplay = false;
    this.call((s) => s.game.gameplayStop());
  }

  happytime(): void {
    this.call((s) => s.game.happytime());
  }

  // ------------------------------------------------------------------ ads

  private lastMidgame = 0;
  private adListeners: ((playing: boolean) => void)[] = [];

  /** Called with true when an ad takes the screen (mute, pause) and false when it hands it back. */
  onAd(cb: (playing: boolean) => void): void {
    this.adListeners.push(cb);
  }

  get adsAvailable(): boolean {
    return !!this.sdk?.ad;
  }

  private showAd(type: 'midgame' | 'rewarded'): Promise<boolean> {
    const ad = this.sdk?.ad;
    if (!ad) return Promise.resolve(false);
    return new Promise((resolve) => {
      let started = false;
      const end = (ok: boolean) => {
        if (started) for (const cb of this.adListeners) cb(false);
        resolve(ok);
      };
      try {
        ad.requestAd(type, {
          adStarted: () => {
            started = true;
            for (const cb of this.adListeners) cb(true);
          },
          adFinished: () => end(true),
          adError: () => end(false),
        });
      } catch {
        resolve(false);
      }
    });
  }

  /**
   * A between-battles break. Never more than once every three minutes, never in the first two
   * minutes of a session; resolves when play may continue (whether or not an ad showed).
   */
  async midgameAd(): Promise<void> {
    const now = performance.now();
    if (now < 120000 || now - this.lastMidgame < 180000) return;
    this.lastMidgame = now;
    await this.showAd('midgame');
  }

  /** A player-chosen ad for a reward. Resolves true only if the ad was watched to the end. */
  rewardedAd(): Promise<boolean> {
    return this.showAd('rewarded');
  }

  getItem(key: string): string | null {
    if (this.sdk?.data) {
      try {
        return this.sdk.data.getItem(key);
      } catch {
        /* fall through to local storage */
      }
    }
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  setItem(key: string, value: string): void {
    if (this.sdk?.data) {
      try {
        this.sdk.data.setItem(key, value);
        return;
      } catch {
        /* fall through */
      }
    }
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* storage unavailable (private mode); progress lives for this session only */
    }
  }
}

export const platform = new PlatformAdapter();
