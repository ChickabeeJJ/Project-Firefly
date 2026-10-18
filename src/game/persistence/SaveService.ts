import { platform } from '../platform/PlatformAdapter';
import { freshSave, sanitizeSave, type SaveData } from './schema';

const KEY = 'firefly-nocturne-save';
/** A second copy always kept in this browser, even when the platform also stores the save. */
const LOCAL_KEY = 'firefly-nocturne-save-local';

function parse(raw: string | null): SaveData | null {
  if (!raw) return null;
  try {
    return sanitizeSave(JSON.parse(raw));
  } catch {
    return null;
  }
}

function readLocal(): string | null {
  try {
    return window.localStorage.getItem(LOCAL_KEY);
  } catch {
    return null;
  }
}

/** Single owner of the player's long-term progress. Battle state is never stored here. */
class SaveService {
  private data: SaveData = freshSave();
  private loaded = false;
  private hooked = false;

  /** Loads the newest of the platform save and the local copy. */
  load(): SaveData {
    const a = parse(platform.getItem(KEY));
    const b = parse(readLocal());
    this.data = (a && b ? (b.savedAt > a.savedAt ? b : a) : a ?? b) ?? sanitizeSave(null);
    this.loaded = true;
    this.hookAutosave();
    return this.data;
  }

  get(): SaveData {
    if (!this.loaded) this.load();
    return this.data;
  }

  get isNewPlayer(): boolean {
    return Object.keys(this.get().stars).length === 0;
  }

  commit(): void {
    this.data.savedAt = Date.now();
    const json = JSON.stringify(this.data);
    platform.setItem(KEY, json);
    try {
      window.localStorage.setItem(LOCAL_KEY, json);
    } catch {
      /* storage unavailable (private mode); progress lives for this session only */
    }
  }

  /** Last write time, for the settings panel. */
  get savedAt(): number {
    return this.get().savedAt;
  }

  hasHint(id: string): boolean {
    return this.get().hints.includes(id);
  }

  markHint(id: string): void {
    if (this.hasHint(id)) return;
    this.data.hints.push(id);
    this.commit();
  }

  /** Deliberate, confirmed reset from the settings panel. */
  reset(): void {
    this.data = freshSave();
    this.commit();
  }

  /** Downloads the save as a .json file the player can keep. */
  exportFile(): void {
    this.commit();
    const blob = new Blob([JSON.stringify(this.data, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `project-firefly-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  /** Asks for a save file and loads it. Resolves false if cancelled or unreadable. */
  importFile(): Promise<boolean> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';
      input.onchange = () => {
        const f = input.files?.[0];
        if (!f) return resolve(false);
        f.text().then((t) => {
          let raw: unknown;
          try {
            raw = JSON.parse(t);
          } catch {
            return resolve(false);
          }
          if (!raw || typeof raw !== 'object' || !('roster' in raw)) return resolve(false);
          this.data = sanitizeSave(raw);
          this.commit();
          resolve(true);
        }, () => resolve(false));
      };
      input.click();
    });
  }

  /** Writes once more when the tab is hidden or closed, so nothing in flight is lost. */
  private hookAutosave(): void {
    if (this.hooked || typeof window === 'undefined') return;
    this.hooked = true;
    const flush = () => {
      if (this.loaded) this.commit();
    };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flush();
    });
  }
}

export const saves = new SaveService();
