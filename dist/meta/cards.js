"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emptyAlbum = emptyAlbum;
exports.hasCard = hasCard;
exports.grantCard = grantCard;
exports.parseAlbum = parseAlbum;
exports.serializeAlbum = serializeAlbum;
function emptyAlbum() {
    return { cards: [] };
}
function hasCard(album, recipeId) {
    for (let i = 0; i < album.cards.length; i += 1) {
        if (album.cards[i].recipeId === recipeId)
            return true;
    }
    return false;
}
function grantCard(album, card) {
    if (hasCard(album, card.recipeId))
        return { album, isNew: false };
    return { album: { cards: album.cards.concat([card]) }, isNew: true };
}
function parseAlbum(raw) {
    if (!raw)
        return emptyAlbum();
    try {
        const value = JSON.parse(raw);
        if (!value || !Array.isArray(value.cards))
            return emptyAlbum();
        const cards = [];
        for (let i = 0; i < value.cards.length; i += 1) {
            const card = value.cards[i];
            if (!card || typeof card.recipeId !== 'string' || typeof card.name !== 'string')
                continue;
            cards.push({
                recipeId: card.recipeId,
                name: card.name,
                region: typeof card.region === 'string' ? card.region : '',
                blurb: typeof card.blurb === 'string' ? card.blurb : '',
                unlockedAt: typeof card.unlockedAt === 'number' ? card.unlockedAt : 0,
            });
        }
        return { cards };
    }
    catch (_a) {
        return emptyAlbum();
    }
}
function serializeAlbum(album) {
    return JSON.stringify(album);
}
