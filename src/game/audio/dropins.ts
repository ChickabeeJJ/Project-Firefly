import type { Sfx, Track } from './AudioController';

// Drop-in audio. Files placed in src/assets/audio/ replace the synthesised sound:
//   bgm/<anything>.mp3   music. A name containing "main menu" (or "menu"/"lobby") plays on the
//                        lobby and menus; "rite"/"summon"/"gacha" on the Lantern Rite; "boss" in
//                        boss battles; every other file is battle music. Several files per slot
//                        play in turn.
//   sfx/<name>.mp3       a sound effect, named after its id (hit, crit, cast, tap, card, …).
// mp3, ogg, m4a and wav all work. Files are served as URLs (not bundled into the script).

const bgmUrls = import.meta.glob('../../assets/audio/bgm/*.{mp3,ogg,m4a,wav}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const sfxUrls = import.meta.glob('../../assets/audio/sfx/*.{mp3,ogg,m4a,wav}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

const base = (p: string) => p.split('/').pop()!.replace(/\.[^.]+$/, '');

function slotFor(name: string): Track {
  const n = name.toLowerCase();
  if (/main ?menu|menu|lobby/.test(n)) return 'lobby';
  if (/rite|summon|gacha/.test(n)) return 'rite';
  if (/boss/.test(n)) return 'boss';
  return 'battle';
}

export const BGM: Record<Track, string[]> = { lobby: [], battle: [], boss: [], rite: [] };
for (const [path, url] of Object.entries(bgmUrls).sort(([a], [b]) => a.localeCompare(b))) BGM[slotFor(base(path))].push(url);
// Boss fights fall back to the battle playlist; the Rite falls back to the menu music.
if (!BGM.boss.length) BGM.boss = BGM.battle;
if (!BGM.rite.length) BGM.rite = BGM.lobby;

export const SFX_FILES: Partial<Record<Sfx, string>> = {};
for (const [path, url] of Object.entries(sfxUrls)) SFX_FILES[base(path) as Sfx] = url;
