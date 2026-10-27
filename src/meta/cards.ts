export interface CardRecord {
  recipeId: string;
  name: string;
  region: string;
  blurb: string;
  unlockedAt: number;
}

export interface AlbumState {
  cards: CardRecord[];
}

export function emptyAlbum(): AlbumState {
  return { cards: [] };
}

export function hasCard(album: AlbumState, recipeId: string): boolean {
  for (let i = 0; i < album.cards.length; i += 1) {
    if (album.cards[i].recipeId === recipeId) return true;
  }
  return false;
}

export function grantCard(album: AlbumState, card: CardRecord): { album: AlbumState; isNew: boolean } {
  if (hasCard(album, card.recipeId)) return { album, isNew: false };
  return { album: { cards: album.cards.concat([card]) }, isNew: true };
}

export function parseAlbum(raw: string | null): AlbumState {
  if (!raw) return emptyAlbum();
  try {
    const value = JSON.parse(raw) as { cards?: CardRecord[] };
    if (!value || !Array.isArray(value.cards)) return emptyAlbum();
    const cards: CardRecord[] = [];
    for (let i = 0; i < value.cards.length; i += 1) {
      const card = value.cards[i];
      if (!card || typeof card.recipeId !== 'string' || typeof card.name !== 'string') continue;
      cards.push({
        recipeId: card.recipeId,
        name: card.name,
        region: typeof card.region === 'string' ? card.region : '',
        blurb: typeof card.blurb === 'string' ? card.blurb : '',
        unlockedAt: typeof card.unlockedAt === 'number' ? card.unlockedAt : 0,
      });
    }
    return { cards };
  } catch {
    return emptyAlbum();
  }
}

export function serializeAlbum(album: AlbumState): string {
  return JSON.stringify(album);
}
