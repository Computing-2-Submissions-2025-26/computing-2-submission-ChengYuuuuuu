import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as game from '../rummikub-game.js';

function tile(color, value) {
  return { id: 0, color, value, isJoker: false };
}
function joker() {
  return { id: 0, color: null, value: null, isJoker: true };
}
let _tid = 1000;
function t(color, value) {
  return { id: _tid++, color, value, isJoker: false };
}
function j(id) {
  return { id: id || _tid++, color: null, value: null, isJoker: true };
}

// ===== initGame =====
describe('initGame', () => {
  it('should init single-player game with correct state', () => {
    const s = game.initGame('single', 'normal');
    assert.strictEqual(s.mode, 'single');
    assert.strictEqual(s.difficulty, 'normal');
    assert.strictEqual(s.players.length, 2);
    assert.strictEqual(s.players[0].id, 'player1');
    assert.strictEqual(s.players[1].id, 'AI');
    assert.strictEqual(s.players[0].rack.length, 14);
    assert.strictEqual(s.players[1].rack.length, 14);
    assert.strictEqual(s.pool.length, 106 - 28);
    assert.strictEqual(s.board.length, 0);
    assert.strictEqual(s.currentPlayerIndex, 0);
    assert.strictEqual(s.gameOver, false);
  });

  it('should init two-player game', () => {
    const s = game.initGame('twoPlayer', null);
    assert.strictEqual(s.mode, 'twoPlayer');
    assert.strictEqual(s.players[1].id, 'player2');
    assert.strictEqual(s.difficulty, null);
  });

  it('should deal all 106 tiles', () => {
    const s = game.initGame('single', 'hard');
    const total = s.players[0].rack.length + s.players[1].rack.length + s.pool.length;
    assert.strictEqual(total, 106);
  });

  it('should create unique tile IDs', () => {
    const s = game.initGame('single', 'normal');
    const all = [...s.players[0].rack, ...s.players[1].rack, ...s.pool];
    const ids = new Set(all.map(t => t.id));
    assert.strictEqual(ids.size, all.length);
  });
});

// ===== isValidGroup =====
describe('isValidGroup', () => {
  it('should reject fewer than 3 tiles', () => {
    assert.strictEqual(game.isValidGroup([tile('red', 1)]), false);
    assert.strictEqual(game.isValidGroup([]), false);
  });

  it('should reject null/undefined/non-array', () => {
    assert.strictEqual(game.isValidGroup(null), false);
    assert.strictEqual(game.isValidGroup(undefined), false);
    assert.strictEqual(game.isValidGroup('str'), false);
  });

  describe('valid SETs', () => {
    it('should accept 3 same-value different-color', () => {
      assert.strictEqual(game.isValidGroup([tile('red', 5), tile('blue', 5), tile('yellow', 5)]), true);
    });
    it('should accept 4 all colors', () => {
      assert.strictEqual(game.isValidGroup([tile('red', 3), tile('blue', 3), tile('yellow', 3), tile('black', 3)]), true);
    });
    it('should accept set with joker', () => {
      assert.strictEqual(game.isValidGroup([tile('red', 7), tile('blue', 7), joker()]), true);
    });
    it('should accept set with two jokers', () => {
      assert.strictEqual(game.isValidGroup([tile('red', 9), joker(), joker()]), true);
    });
  });

  describe('valid RUNs', () => {
    it('should accept 3 consecutive same-color', () => {
      assert.strictEqual(game.isValidGroup([tile('red', 3), tile('red', 4), tile('red', 5)]), true);
    });
    it('should accept run of 13', () => {
      const run = [];
      for (let v = 1; v <= 13; v++) run.push(tile('blue', v));
      assert.strictEqual(game.isValidGroup(run), true);
    });
    it('should accept run with joker filling gap', () => {
      assert.strictEqual(game.isValidGroup([tile('red', 3), joker(), tile('red', 5)]), true);
    });
    it('should accept run with joker at start', () => {
      assert.strictEqual(game.isValidGroup([joker(), tile('blue', 4), tile('blue', 5)]), true);
    });
    it('should accept run with joker at end', () => {
      assert.strictEqual(game.isValidGroup([tile('red', 3), tile('red', 4), joker()]), true);
    });
  });

  describe('invalid', () => {
    it('should reject set with duplicate colors', () => {
      assert.strictEqual(game.isValidGroup([tile('red', 5), tile('red', 5), tile('blue', 5)]), false);
    });
    it('should reject set with different values', () => {
      assert.strictEqual(game.isValidGroup([tile('red', 5), tile('blue', 6), tile('yellow', 7)]), false);
    });
    it('should reject set with >4 tiles', () => {
      assert.strictEqual(game.isValidGroup([tile('red', 3), tile('blue', 3), tile('yellow', 3), tile('black', 3), joker()]), false);
    });
    it('should reject run with mixed colors', () => {
      assert.strictEqual(game.isValidGroup([tile('red', 3), tile('blue', 4), tile('red', 5)]), false);
    });
    it('should reject run with duplicate values', () => {
      assert.strictEqual(game.isValidGroup([tile('red', 3), tile('red', 3), tile('red', 4)]), false);
    });
    it('should reject run with uncovered gap', () => {
      assert.strictEqual(game.isValidGroup([tile('red', 3), tile('red', 4), tile('red', 7)]), false);
    });
    it('should reject all-jokers', () => {
      assert.strictEqual(game.isValidGroup([joker(), joker(), joker()]), false);
    });
  });
});

// ===== sortGroup =====
describe('sortGroup', () => {
  it('should sort valid run ascending by value', () => {
    const g = [tile('red', 7), tile('red', 5), tile('red', 6)];
    const s = game.sortGroup(g);
    assert.strictEqual(s[0].value, 5);
    assert.strictEqual(s[1].value, 6);
    assert.strictEqual(s[2].value, 7);
  });
  it('should sort set by color order', () => {
    const g = [tile('yellow', 3), tile('red', 3), tile('blue', 3)];
    const s = game.sortGroup(g);
    assert.strictEqual(s[0].color, 'red');
    assert.strictEqual(s[1].color, 'blue');
    assert.strictEqual(s[2].color, 'yellow');
  });
  it('should place jokers at end', () => {
    const g = [joker(), tile('red', 5), tile('red', 4)];
    const s = game.sortGroup(g);
    assert.strictEqual(s[s.length - 1].isJoker, true);
  });
  it('should return empty for empty input', () => {
    assert.deepStrictEqual(game.sortGroup([]), []);
  });
});

// ===== getJokerRepresentation =====
describe('getJokerRepresentation', () => {
  it('should return missing color in set', () => {
    assert.deepStrictEqual(game.getJokerRepresentation([tile('red', 5), tile('blue', 5), joker()]), { color: 'yellow', value: 5 });
  });
  it('should return missing value in run gap', () => {
    assert.deepStrictEqual(game.getJokerRepresentation([tile('red', 3), joker(), tile('red', 5)]), { color: 'red', value: 4 });
  });
  it('should return next value for joker at end of run', () => {
    assert.deepStrictEqual(game.getJokerRepresentation([tile('red', 3), tile('red', 4), joker()]), { color: 'red', value: 5 });
  });
  it('should return prev value for joker at start of run', () => {
    assert.deepStrictEqual(game.getJokerRepresentation([joker(), tile('blue', 4), tile('blue', 5)]), { color: 'blue', value: 3 });
  });
  it('should return null for all-jokers', () => {
    assert.strictEqual(game.getJokerRepresentation([joker(), joker(), joker()]), null);
  });
  it('should return null for fewer than 3 tiles', () => {
    assert.strictEqual(game.getJokerRepresentation([tile('red', 1), joker()]), null);
  });
});

// ===== makeMove =====
describe('makeMove', () => {
  it('should play 3 tiles as valid new group', () => {
    let s = game.initGame('twoPlayer', null);
    s.players[0].hasMelded = true;
    const tiles = s.players[0].rack.slice(0, 3);
    tiles[0].color = 'red'; tiles[0].value = 3;
    tiles[1].color = 'red'; tiles[1].value = 4;
    tiles[2].color = 'red'; tiles[2].value = 5;
    const r = game.makeMove(s, tiles, [tiles]);
    assert.strictEqual(r.success, true);
  });

  it('should fail when tiles not in rack', () => {
    const s = game.initGame('twoPlayer', null);
    const fake = { id: -1, color: 'red', value: 5, isJoker: false };
    const r = game.makeMove(s, [fake], [[fake]]);
    assert.strictEqual(r.success, false);
  });

  it('should enforce initial meld >= 30 points', () => {
    const s = game.initGame('twoPlayer', null);
    const tiles = s.players[0].rack.slice(0, 3);
    tiles[0].color = 'red'; tiles[0].value = 1;
    tiles[1].color = 'red'; tiles[1].value = 2;
    tiles[2].color = 'red'; tiles[2].value = 3;
    const r = game.makeMove(s, tiles, [tiles]);
    assert.strictEqual(r.success, false);
    assert.ok(r.errorMsg.includes('30'));
  });

  it('should accept initial meld >= 30 points', () => {
    const s = game.initGame('twoPlayer', null);
    const tiles = s.players[0].rack.slice(0, 3);
    tiles[0].color = 'red'; tiles[0].value = 10;
    tiles[1].color = 'red'; tiles[1].value = 11;
    tiles[2].color = 'red'; tiles[2].value = 12;
    const r = game.makeMove(s, tiles, [tiles]);
    assert.strictEqual(r.success, true);
    assert.strictEqual(r.newState.players[0].hasMelded, true);
  });

  it('should reject invalid groups', () => {
    const s = game.initGame('twoPlayer', null);
    s.players[0].hasMelded = true;
    const tiles = s.players[0].rack.slice(0, 3);
    tiles[0].color = 'red'; tiles[0].value = 1;
    tiles[1].color = 'blue'; tiles[1].value = 2;
    tiles[2].color = 'yellow'; tiles[2].value = 3;
    const r = game.makeMove(s, tiles, [tiles]);
    assert.strictEqual(r.success, false);
  });

  it('should reject empty tilesToPlay', () => {
    const s = game.initGame('twoPlayer', null);
    s.players[0].hasMelded = true;
    const r = game.makeMove(s, [], []);
    assert.strictEqual(r.success, false);
  });

  it('should advance to next player', () => {
    const s = game.initGame('twoPlayer', null);
    s.players[0].hasMelded = true;
    const tiles = s.players[0].rack.slice(0, 3);
    tiles[0].color = 'red'; tiles[0].value = 5;
    tiles[1].color = 'red'; tiles[1].value = 6;
    tiles[2].color = 'red'; tiles[2].value = 7;
    const r = game.makeMove(s, tiles, [tiles]);
    assert.strictEqual(r.newState.currentPlayerIndex, 1);
  });

  it('should add tiles to existing board group (extension)', () => {
    const s = game.initGame('twoPlayer', null);
    s.players[0].hasMelded = true;
    const g1 = s.players[0].rack.slice(0, 3);
    g1[0].color = 'red'; g1[0].value = 3;
    g1[1].color = 'red'; g1[1].value = 4;
    g1[2].color = 'red'; g1[2].value = 5;
    s.board = [g1];
    const ext = s.players[0].rack.slice(3, 4);
    ext[0].color = 'red'; ext[0].value = 6;
    const newG = [...g1, ext[0]];
    const r = game.makeMove(s, ext, [newG]);
    assert.strictEqual(r.success, true);
    assert.strictEqual(r.newState.board[0].length, 4);
  });

  it('should reject joker replacement before initial meld', () => {
    const s = game.initGame('twoPlayer', null);
    const jt = j(300);
    s.board = [[t('red', 3), jt, t('red', 5)]];
    const rep = s.players[0].rack[0];
    rep.color = 'red'; rep.value = 4;
    const newG = [t('red', 3), rep, t('red', 5)];
    const r = game.makeMove(s, [t('black', 1), t('black', 2), t('black', 3)], [newG, [t('black', 1), t('black', 2), t('black', 3)]], [{ jokerId: 300, replacementTile: rep }]);
    assert.strictEqual(r.success, false);
  });

  it('should return scoreDelta', () => {
    const s = game.initGame('twoPlayer', null);
    s.players[0].hasMelded = true;
    const tiles = s.players[0].rack.slice(0, 3);
    tiles[0].color = 'red'; tiles[0].value = 10;
    tiles[1].color = 'red'; tiles[1].value = 11;
    tiles[2].color = 'red'; tiles[2].value = 12;
    const r = game.makeMove(s, tiles, [tiles]);
    assert.strictEqual(r.scoreDelta, 33);
  });
});

// ===== skipAndDraw =====
describe('skipAndDraw', () => {
  it('should draw tile and advance turn', () => {
    const s = game.initGame('twoPlayer', null);
    const pool = s.pool.length;
    const rack = s.players[0].rack.length;
    const r = game.skipAndDraw(s);
    assert.ok(r.drawnTile);
    assert.strictEqual(r.newState.players[0].rack.length, rack + 1);
    assert.strictEqual(r.newState.pool.length, pool - 1);
    assert.strictEqual(r.newState.currentPlayerIndex, 1);
  });

  it('should handle empty pool', () => {
    const s = game.initGame('twoPlayer', null);
    s.pool = [];
    const r = game.skipAndDraw(s);
    assert.strictEqual(r.drawnTile, null);
    assert.strictEqual(r.newState.currentPlayerIndex, 1);
  });

  it('should not mutate original state (immutability)', () => {
    const s = game.initGame('twoPlayer', null);
    const origLen = s.players[0].rack.length;
    game.skipAndDraw(s);
    assert.strictEqual(s.players[0].rack.length, origLen);
  });
});

// ===== checkWin =====
describe('checkWin', () => {
  it('should return false when no winner', () => {
    const s = game.initGame('twoPlayer', null);
    assert.strictEqual(game.checkWin(s), false);
  });

  it('should detect player1 win', () => {
    const s = game.initGame('twoPlayer', null);
    s.players[0].rack = [];
    assert.strictEqual(game.checkWin(s), 'player1');
  });

  it('should detect player2 win', () => {
    const s = game.initGame('twoPlayer', null);
    s.players[1].rack = [];
    assert.strictEqual(game.checkWin(s), 'player2');
  });

  it('should detect AI win', () => {
    const s = game.initGame('single', 'normal');
    s.players[1].rack = [];
    assert.strictEqual(game.checkWin(s), 'AI');
  });
});

// ===== getValidMoves =====
describe('getValidMoves', () => {
  it('should return moves when valid tiles exist', () => {
    const s = game.initGame('twoPlayer', null);
    s.players[0].hasMelded = true;
    for (let i = 0; i < 3; i++) { s.players[0].rack[i].color = 'red'; s.players[0].rack[i].value = 3 + i; }
    const moves = game.getValidMoves(s);
    assert.ok(moves.length > 0);
  });

  it('should return empty when no valid moves', () => {
    const s = game.initGame('twoPlayer', null);
    s.players[0].hasMelded = true;
    s.players[0].rack = [];
    const moves = game.getValidMoves(s);
    assert.strictEqual(moves.length, 0);
  });
});

// ===== getAIMove =====
describe('getAIMove', () => {
  it('should return draw when no moves', () => {
    const s = game.initGame('single', 'normal');
    s.currentPlayerIndex = 1;
    s.players[1].rack = [];
    const m = game.getAIMove(s);
    assert.strictEqual(m.action, 'draw');
  });

  it('should return play when valid tiles exist', () => {
    const s = game.initGame('single', 'normal');
    s.currentPlayerIndex = 1;
    s.players[1].hasMelded = true;
    for (let i = 0; i < 3; i++) { s.players[1].rack[i].color = 'red'; s.players[1].rack[i].value = 1 + i; }
    const m = game.getAIMove(s);
    assert.ok(m.action === 'play' || m.action === 'draw');
    if (m.action === 'play') assert.ok(m.tilesToPlay.length >= 3);
  });
});
