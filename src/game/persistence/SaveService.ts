import { platform } from '../platform/PlatformAdapter';
import { freshSave, sanitizeSave, type SaveData } from './schema';

const KEY = 'firefly-nocturne-save';

/** Single owner of the player's long-term progress. Battle state is never stored here. */
class SaveService {
  private data: SaveData = freshSave();
  private loaded = false;

  load(): SaveData {
    const raw = platform.getItem(KEY);
    let parsed: unknown = null;
    if (raw) {
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = null;
      }
    }
    this.data = sanitizeSave(parsed);
    this.loaded = true;
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
    platform.setItem(KEY, JSON.stringify(this.data));
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
}

export const saves = new SaveService();
