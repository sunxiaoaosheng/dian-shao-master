/**
 * 剪贴清单。运行时只认 assets/manifest.json 里的 id、path、pivot、z。
 * path 相对 assets/，占位图就在对应文件上。
 */

declare function require(id: string): unknown;

export interface AssetItem {
  id: string;
  /** 清单里的路径，例如 ui/ui-paper-bg.png */
  path: string;
  /** 小游戏根目录下的文件，占位图按这个加载 */
  file: string;
  w: number;
  h: number;
  pivot: readonly [number, number];
  z: number;
  text: string;
}

interface ManifestFile {
  version: number;
  baseUnit: string;
  scaleDefault: number;
  items: Array<{
    id: string;
    path: string;
    w: number;
    h: number;
    pivot: number[];
    z: number;
    text?: string;
  }>;
  layers: Record<string, number>;
}

const raw = require('../../assets/manifest.json') as ManifestFile;

function readItems(file: ManifestFile): AssetItem[] {
  const items: AssetItem[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < file.items.length; i += 1) {
    const item = file.items[i];
    if (!item || !item.id || seen.has(item.id)) throw new Error('清单条目缺少 id');
    if (!item.path || item.path.indexOf('..') >= 0) throw new Error(`清单路径无效 ${item.id}`);
    if (!item.pivot || item.pivot.length < 2) throw new Error(`清单锚点无效 ${item.id}`);
    seen.add(item.id);
    items.push({
      id: item.id,
      path: item.path,
      file: `assets/${item.path}`,
      w: item.w,
      h: item.h,
      pivot: [item.pivot[0], item.pivot[1]],
      z: item.z,
      text: item.text || '',
    });
  }
  return items;
}

export const MANIFEST_VERSION = raw.version;
export const SCALE_DEFAULT = raw.scaleDefault;
export const LAYERS: Readonly<Record<string, number>> = raw.layers;
export const ASSETS: readonly AssetItem[] = readItems(raw);

const BY_ID = new Map<string, AssetItem>();
for (let i = 0; i < ASSETS.length; i += 1) BY_ID.set(ASSETS[i].id, ASSETS[i]);

export function assetById(id: string): AssetItem {
  const item = BY_ID.get(id);
  if (!item) throw new Error(`清单里没有 ${id}`);
  return item;
}

export function assetsByPrefix(prefix: string): AssetItem[] {
  const list: AssetItem[] = [];
  for (let i = 0; i < ASSETS.length; i += 1) {
    if (ASSETS[i].id.indexOf(prefix) === 0) list.push(ASSETS[i]);
  }
  return list;
}

/** 锅里的主料。底锅、油光和葱花由画面按各自的 z 另放。 */
export function foodIdForLevel(level: number, seed: number): string {
  if (level >= 4) return 'food.plateDone';
  if (level === 3) return 'food.chili';
  if (level === 2) return seed % 2 === 0 ? 'food.meatSlice' : 'food.egg';
  return seed % 2 === 0 ? 'food.vegGreen' : 'food.scallion';
}
