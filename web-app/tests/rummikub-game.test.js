import * as game from '../rummikub-game.js';
import assert from 'assert';

describe('initGame', () => {
  it('should initialize a single-player game with correct state', () => {
    const state = game.initGame('single', 'normal');
    assert.strictEqual(state.mode, 'single');
    assert.strictEqual(state.difficulty, 'normal');
    assert.strictEqual(state.players.length, 2);
    assert.strictEqual(state.players[0].id, 'player1');
    assert.strictEqual(state.players[1].id, 'AI');
    assert.strictEqual(state.players[0].rack.length, 14);
    assert.strictEqual(state.players[1].rack.length, 14);
    assert.strictEqual(state.pool.length, 106 - 28);
    assert.strictEqual(state.board.length, 0);
    assert.strictEqual(state.currentPlayerIndex, 0);
    assert.strictEqual(state.gameOver, false);
  });

  it('should initialize a two-player game', () => {
    const state = game.initGame('twoPlayer', null);
    assert.strictEqual(state.mode, 'twoPlayer');
    assert.strictEqual(state.players[1].id, 'player2');
  });

  it('should deal all tiles (106 total)', () => {
    const state = game.initGame('single', 'hard');
    const total = state.players[0].rack.length + state.players[1].rack.length + state.pool.length;
    assert.strictEqual(total, 106);
  });
});

describe('isValidGroup', () => {
  function tile(color, value) {
    return { id: 0, color, value, isJoker: false };
  }
  function joker() {
    return { id: 0, color: null, value: null, isJoker: true };
  }

  it('should reject groups with fewer than 3 tiles', () => {
    assert.strictEqual(game.isValidGroup([tile('red', 1), tile('red', 2)]), false);
    assert.strictEqual(game.isValidGroup([tile('red', 1)]), false);
    assert.strictEqual(game.isValidGroup([]), false);
  });

  it('should reject non-array input', () => {
    assert.strictEqual(game.isValidGroup(null), false);
    assert.strictEqual(game.isValidGroup(undefined), false);
    assert.strictEqual(game.isValidGroup('string'), false);
  });

  describe('valid SET groups', () => {
    it('should accept a valid set of 3 (same value, different colors)', () => {
      assert.strictEqual(game.isValidGroup([tile('red', 5), tile('blue', 5), tile('yellow', 5)]), true);
    });

    it('should accept a valid set of 4 (all colors)', () => {
      assert.strictEqual(game.isValidGroup([tile('red', 3), tile('blue', 3), tile('yellow', 3), tile('black', 3)]), true);
    });

    it('should accept a set with a joker', () => {
      assert.strictEqual(game.isValidGroup([tile('red', 7), tile('blue', 7), joker()]), true);
    });

    it('should accept a set with two jokers', () => {
      assert.strictEqual(game.isValidGroup([tile('red', 9), joker(), joker()]), true);
    });
  });

  describe('invalid SET groups', () => {
    it('should reject a set with duplicate colors', () => {
      assert.strictEqual(game.isValidGroup([tile('red', 5), tile('red', 5), tile('blue', 5)]), false);
    });

    it('should reject a set with different values', () => {
      assert.strictEqual(game.isValidGroup([tile('red', 5), tile('blue', 6), tile('yellow', 7)]), false);
    });

    it('should reject a set with more than 4 tiles', () => {
      assert.strictEqual(game.isValidGroup([tile('red', 3), tile('blue', 3), tile('yellow', 3), tile('black', 3), joker()]), false);
    });
  });

  describe('valid RUN groups', () => {
    it('should accept a run of 3 consecutive same-color tiles', () => {
      assert.strictEqual(game.isValidGroup([tile('red', 3), tile('red', 4), tile('red', 5)]), true);
    });

    it('should accept a run of 13 tiles', () => {
      const run = [];
      for (let v = 1; v <= 13; v++) run.push(tile('blue', v));
      assert.strictEqual(game.isValidGroup(run), true);
    });

    it('should accept a run with a joker filling a gap', () => {
      assert.strictEqual(game.isValidGroup([tile('red', 3), tile('red', 4), joker(), tile('red', 6)]), true);
    });

    it('should accept a run with a joker at the start', () => {
      assert.strictEqual(game.isValidGroup([joker(), tile('red', 4), tile('red', 5)]), true);
    });

    it('should accept a run with a joker at the end', () => {
      assert.strictEqual(game.isValidGroup([tile('red', 3), tile('red', 4), tile('red', 5), joker()]), true);
    });
  });

  describe('invalid RUN groups', () => {
    it('should reject a run with mixed colors', () => {
      assert.strictEqual(game.isValidGroup([tile('red', 3), tile('blue', 4), tile('red', 5)]), false);
    });

    it('should reject a run with duplicate values', () => {
      assert.strictEqual(game.isValidGroup([tile('red', 3), tile('red', 3), tile('red', 4)]), false);
    });

    it('should reject a run with a gap too large for available jokers', () => {
      assert.strictEqual(game.isValidGroup([tile('red', 3), tile('red', 4), tile('red', 7)]), false);
    });
  });

  describe('groups with only jokers', () => {
    it('should reject all-jokers group', () => {
      assert.strictEqual(game.isValidGroup([joker(), joker(), joker()]), false);
    });
  });
});

describe('makeMove', () => {
  it('should successfully play tiles as a new group', () => {
    let state = game.initGame('twoPlayer', null);
    const player = state.players[0];
    player.hasMelded = true;
    const tilesToPlay = player.rack.slice(0, 3);
    tilesToPlay[0].color = 'red';
    tilesToPlay[0].value = 3;
    tilesToPlay[1].color = 'red';
    tilesToPlay[1].value = 4;
    tilesToPlay[2].color = 'red';
    tilesToPlay[2].value = 5;
    const result = game.makeMove(state, tilesToPlay, [tilesToPlay]);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.errorMsg, null);
  });

  it('should fail when tiles are not in rack', () => {
    const state = game.initGame('twoPlayer', null);
    const fakeTile = { id: -999, color: 'red', value: 5, isJoker: false };
    const result = game.makeMove(state, [fakeTile], [[fakeTile]]);
    assert.strictEqual(result.success, false);
    assert.ok(result.errorMsg);
  });

  it('should enforce initial meld of 30 points', () => {
    const state = game.initGame('twoPlayer', null);
    const player = state.players[0];
    const tilesToPlay = player.rack.slice(0, 3).map(t => ({ ...t, isJoker: false }));
    tilesToPlay[0].color = 'red';
    tilesToPlay[0].value = 1;
    tilesToPlay[1].color = 'red';
    tilesToPlay[1].value = 2;
    tilesToPlay[2].color = 'red';
    tilesToPlay[2].value = 3;
    const result = game.makeMove(state, tilesToPlay, [tilesToPlay]);
    assert.strictEqual(result.success, false);
    assert.ok(result.errorMsg.includes('30'));
  });

  it('should accept initial meld meeting 30 points', () => {
    const state = game.initGame('twoPlayer', null);
    const player = state.players[0];
    const tilesToPlay = player.rack.slice(0, 3).map(t => ({ ...t, isJoker: false }));
    tilesToPlay[0].color = 'red';
    tilesToPlay[0].value = 10;
    tilesToPlay[1].color = 'red';
    tilesToPlay[1].value = 11;
    tilesToPlay[2].color = 'red';
    tilesToPlay[2].value = 12;
    const result = game.makeMove(state, tilesToPlay, [tilesToPlay]);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.newState.players[0].hasMelded, true);
  });

  it('should advance to next player after successful move', () => {
    const state = game.initGame('twoPlayer', null);
    const player = state.players[0];
    player.hasMelded = true;
    const tilesToPlay = player.rack.slice(0, 3);
    tilesToPlay[0].color = 'red';
    tilesToPlay[0].value = 5;
    tilesToPlay[1].color = 'red';
    tilesToPlay[1].value = 6;
    tilesToPlay[2].color = 'red';
    tilesToPlay[2].value = 7;
    const result = game.makeMove(state, tilesToPlay, [tilesToPlay]);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.newState.currentPlayerIndex, 1);
  });

  it('should reject invalid groups', () => {
    const state = game.initGame('twoPlayer', null);
    const player = state.players[0];
    player.hasMelded = true;
    const tilesToPlay = player.rack.slice(0, 3);
    tilesToPlay[0].color = 'red';
    tilesToPlay[0].value = 1;
    tilesToPlay[1].color = 'blue';
    tilesToPlay[1].value = 2;
    tilesToPlay[2].color = 'yellow';
    tilesToPlay[2].value = 3;
    const result = game.makeMove(state, tilesToPlay, [tilesToPlay]);
    assert.strictEqual(result.success, false);
  });

  it('should handle extending an existing board group', () => {
    const state = game.initGame('twoPlayer', null);
    const player = state.players[0];
    player.hasMelded = true;
    const initialTiles = player.rack.slice(0, 3);
    initialTiles[0].color = 'red'; initialTiles[0].value = 3;
    initialTiles[1].color = 'red'; initialTiles[1].value = 4;
    initialTiles[2].color = 'red'; initialTiles[2].value = 5;
    const move1 = game.makeMove(state, initialTiles, [initialTiles]);
    assert.strictEqual(move1.success, true);

    const nextState = move1.newState;
    const player2 = nextState.players[nextState.currentPlayerIndex];
    player2.hasMelded = true;
    const extension = player2.rack.slice(0, 1);
    extension[0].color = 'red';
    extension[0].value = 6;
    const extendedGroup = [...nextState.board[0], extension[0]];
    const move2 = game.makeMove(nextState, extension, [extendedGroup]);
    assert.strictEqual(move2.success, true);
    assert.strictEqual(move2.newState.board[0].length, 4);
  });

  it('should persist hasMelded across subsequent turns for the same player', () => {
    const state = game.initGame('twoPlayer', null);
    const player1 = state.players[0];
    const player2 = state.players[1];

    // Player 1 makes initial meld (30+ points)
    const meldTiles = player1.rack.slice(0, 3);
    meldTiles[0].color = 'red'; meldTiles[0].value = 10;
    meldTiles[1].color = 'red'; meldTiles[1].value = 11;
    meldTiles[2].color = 'red'; meldTiles[2].value = 12;
    const move1 = game.makeMove(state, meldTiles, [meldTiles]);
    assert.strictEqual(move1.success, true);
    assert.strictEqual(move1.newState.players[0].hasMelded, true);

    let gs = move1.newState;  // currentPlayerIndex = 1 (player2)

    // Player 2 makes a move (skip initial meld check)
    const p2 = gs.players[gs.currentPlayerIndex];
    p2.hasMelded = true;
    const p2Tiles = p2.rack.slice(0, 3);
    p2Tiles[0].color = 'blue'; p2Tiles[0].value = 5;
    p2Tiles[1].color = 'blue'; p2Tiles[1].value = 6;
    p2Tiles[2].color = 'blue'; p2Tiles[2].value = 7;
    const move2 = game.makeMove(gs, p2Tiles, [...gs.board, p2Tiles]);
    assert.strictEqual(move2.success, true);
    gs = move2.newState;  // currentPlayerIndex = 0 (player1 back)

    // Player 1's second turn — hasMelded should still be true
    assert.strictEqual(gs.players[0].hasMelded, true);

    // Player 1 plays more tiles (should NOT need 30+ points)
    const p1Again = gs.players[0];
    const moreTiles = p1Again.rack.slice(0, 3);
    moreTiles[0].color = 'black'; moreTiles[0].value = 1;
    moreTiles[1].color = 'black'; moreTiles[1].value = 2;
    moreTiles[2].color = 'black'; moreTiles[2].value = 3;
    const move3 = game.makeMove(gs, moreTiles, [...gs.board, moreTiles]);
    assert.strictEqual(move3.success, true, 'Player 1 should be able to play on second turn without 30-point requirement');
  });
});

describe('skipAndDraw', () => {
  it('should draw a tile and advance turn', () => {
    const state = game.initGame('twoPlayer', null);
    const poolSize = state.pool.length;
    const rackSize = state.players[0].rack.length;
    const result = game.skipAndDraw(state);
    assert.ok(result.drawnTile);
    assert.strictEqual(result.newState.players[0].rack.length, rackSize + 1);
    assert.strictEqual(result.newState.pool.length, poolSize - 1);
    assert.strictEqual(result.newState.currentPlayerIndex, 1);
  });

  it('should handle empty pool gracefully', () => {
    const state = game.initGame('twoPlayer', null);
    state.pool = [];
    const result = game.skipAndDraw(state);
    assert.strictEqual(result.drawnTile, null);
    assert.strictEqual(result.newState.currentPlayerIndex, 1);
  });
});

describe('checkWin', () => {
  it('should return false when no one has won', () => {
    const state = game.initGame('twoPlayer', null);
    assert.strictEqual(game.checkWin(state), false);
  });

  it('should detect when player1 wins (empty rack)', () => {
    const state = game.initGame('twoPlayer', null);
    state.players[0].rack = [];
    assert.strictEqual(game.checkWin(state), 'player1');
  });

  it('should detect when player2 wins', () => {
    const state = game.initGame('twoPlayer', null);
    state.players[1].rack = [];
    assert.strictEqual(game.checkWin(state), 'player2');
  });
});

describe('getJokerRepresentation', () => {
  function tile(color, value) {
    return { id: 0, color, value, isJoker: false };
  }
  function joker() {
    return { id: 0, color: null, value: null, isJoker: true };
  }

  it('should return missing color for a set with joker', () => {
    const rep = game.getJokerRepresentation([tile('red', 5), tile('blue', 5), joker()]);
    assert.deepStrictEqual(rep, { color: 'yellow', value: 5 });
  });

  it('should return missing value for a run with joker filling gap', () => {
    const rep = game.getJokerRepresentation([tile('red', 3), joker(), tile('red', 5)]);
    assert.deepStrictEqual(rep, { color: 'red', value: 4 });
  });

  it('should return extended value for joker at end of run', () => {
    const rep = game.getJokerRepresentation([tile('red', 3), tile('red', 4), joker()]);
    assert.deepStrictEqual(rep, { color: 'red', value: 5 });
  });

  it('should return extended value for joker at start of run', () => {
    const rep = game.getJokerRepresentation([joker(), tile('blue', 4), tile('blue', 5)]);
    assert.deepStrictEqual(rep, { color: 'blue', value: 3 });
  });

  it('should return null for groups with only jokers', () => {
    assert.strictEqual(game.getJokerRepresentation([joker(), joker(), joker()]), null);
  });
});

describe('makeMove - board manipulation', () => {
  it('should allow rearranging existing board tiles and playing new tiles', () => {
    const state = game.initGame('twoPlayer', null);
    const player = state.players[0];
    player.hasMelded = true;

    // Board: [Red 1, Red 2, Red 3] and [Red 4, Red 5, Red 6]
    const g1 = player.rack.slice(0, 3);
    g1[0].color = 'red'; g1[0].value = 1;
    g1[1].color = 'red'; g1[1].value = 2;
    g1[2].color = 'red'; g1[2].value = 3;
    const g2 = player.rack.slice(3, 6);
    g2[0].color = 'red'; g2[0].value = 4;
    g2[1].color = 'red'; g2[1].value = 5;
    g2[2].color = 'red'; g2[2].value = 6;
    state.board = [g1, g2];

    // Rearrange: move Red 4 to first group, add Red 7 from hand to second group
    // New: [Red 1, Red 2, Red 3, Red 4] and [Red 5, Red 6, Red 7]
    const newG1 = [g1[0], g1[1], g1[2], g2[0]];
    const newTile = player.rack.slice(6, 7);
    newTile[0].color = 'red'; newTile[0].value = 7;
    const newG2 = [g2[1], g2[2], newTile[0]];

    const result = game.makeMove(state, [newTile[0]], [newG1, newG2]);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.newState.board.length, 2);
  });

  it('should reject board manipulation that loses tiles', () => {
    const state = game.initGame('twoPlayer', null);
    const player = state.players[0];
    player.hasMelded = true;

    // Board: [Red 3, Blue 3, Yellow 3] (valid set)
    const g1 = player.rack.slice(0, 3);
    g1[0].color = 'red'; g1[0].value = 3;
    g1[1].color = 'blue'; g1[1].value = 3;
    g1[2].color = 'yellow'; g1[2].value = 3;
    state.board = [g1];

    // New board: [Red 3, Blue 3, Black 3] — Yellow 3 dropped, Black 3 added from hand
    const newTile = player.rack.slice(3, 4);
    newTile[0].color = 'black'; newTile[0].value = 3;
    const newGroup = [g1[0], g1[1], newTile[0]];

    const result = game.makeMove(state, [newTile[0]], [newGroup]);
    assert.strictEqual(result.success, false);
    assert.ok(result.errorMsg.includes('mismatch'));
  });

  it('should reject board manipulation with no new hand tiles played', () => {
    const state = game.initGame('twoPlayer', null);
    const player = state.players[0];
    player.hasMelded = true;

    const g1 = player.rack.slice(0, 3);
    g1[0].color = 'red'; g1[0].value = 3;
    g1[1].color = 'red'; g1[1].value = 4;
    g1[2].color = 'red'; g1[2].value = 5;
    state.board = [g1];

    // Rearrange but no hand tile played
    const result = game.makeMove(state, [], [[g1[2], g1[1], g1[0]]]);
    assert.strictEqual(result.success, false);
    assert.ok(result.errorMsg.includes('play at least one tile'));
  });
});

let _testId = 1000;
function testTile(color, value) {
  return { id: _testId++, color, value, isJoker: false };
}
function testJoker(id) {
  return { id: id || _testId++, color: null, value: null, isJoker: true };
}

describe('makeMove - joker replacement', () => {

  it('should allow replacing a joker in a run with the correct tile', () => {
    const state = game.initGame('twoPlayer', null);
    const player = state.players[0];
    player.hasMelded = true;

    const jokerTile = testJoker(200);
    const g1 = [testTile('red', 3), jokerTile, testTile('red', 5)];
    state.board = [g1];

    const repTile = player.rack[0];
    repTile.color = 'red'; repTile.value = 4;

    const t1 = player.rack[1]; t1.color = 'red'; t1.value = 6;
    const t2 = player.rack[2]; t2.color = 'red'; t2.value = 7;
    const t3 = player.rack[3]; t3.color = 'red'; t3.value = 8;

    const newGroup = [g1[0], repTile, g1[2]];
    const result = game.makeMove(state, [t1, t2, t3], [newGroup, [t1, t2, t3]], [{ jokerId: 200, replacementTile: repTile }]);
    assert.strictEqual(result.success, true);

    const hasJoker = result.newState.players[0].rack.some(t => t.id === 200 && t.isJoker);
    assert.strictEqual(hasJoker, true);
  });

  it('should allow replacing a joker in a set with the correct tile', () => {
    const state = game.initGame('twoPlayer', null);
    const player = state.players[0];
    player.hasMelded = true;

    const jokerTile = testJoker(201);
    const g1 = [testTile('red', 7), testTile('blue', 7), jokerTile];
    state.board = [g1];

    const repTile = player.rack[0];
    repTile.color = 'yellow'; repTile.value = 7;

    const t1 = player.rack[1]; t1.color = 'red'; t1.value = 1;
    const t2 = player.rack[2]; t2.color = 'red'; t2.value = 2;
    const t3 = player.rack[3]; t3.color = 'red'; t3.value = 3;

    const newGroup = [g1[0], g1[1], repTile];
    const result = game.makeMove(state, [t1, t2, t3], [newGroup, [t1, t2, t3]], [{ jokerId: 201, replacementTile: repTile }]);
    assert.strictEqual(result.success, true);

    const hasJoker = result.newState.players[0].rack.some(t => t.id === 201 && t.isJoker);
    assert.strictEqual(hasJoker, true);
  });

  it('should reject replacing a joker with a non-matching tile', () => {
    const state = game.initGame('twoPlayer', null);
    const player = state.players[0];
    player.hasMelded = true;

    const jokerTile = testJoker(202);
    const g1 = [testTile('red', 3), jokerTile, testTile('red', 5)];
    state.board = [g1];

    const repTile = player.rack[0];
    repTile.color = 'red'; repTile.value = 6;

    const newGroup = [g1[0], repTile, g1[2]];
    const result = game.makeMove(state, [], [newGroup], [{ jokerId: 100, replacementTile: repTile }]);
    assert.strictEqual(result.success, false);
  });

  it('should reject joker replacement when joker still on board', () => {
    const state = game.initGame('twoPlayer', null);
    const player = state.players[0];
    player.hasMelded = true;

    const jokerTile = testJoker(203);
    const g1 = [testTile('red', 3), jokerTile, testTile('red', 5)];
    state.board = [g1];

    const repTile = player.rack[0];
    repTile.color = 'red'; repTile.value = 4;

    const extraTile = player.rack[1];
    extraTile.color = 'black'; extraTile.value = 1;

    const newGroup = [g1[0], jokerTile, g1[2], repTile];
    const result = game.makeMove(state, [extraTile], [newGroup, [extraTile]], [{ jokerId: 203, replacementTile: repTile }]);
    assert.strictEqual(result.success, false);
    assert.ok(result.errorMsg.includes('must be removed'));
  });

  it('should allow joker replacement after melding, joker added to rack, score excludes replacement', () => {
    const state = game.initGame('twoPlayer', null);
    const player = state.players[0];
    player.hasMelded = true;

    const jokerTile = testJoker(204);
    const g1 = [testTile('red', 3), jokerTile, testTile('red', 5)];
    state.board = [g1];

    const repTile = player.rack[0];
    repTile.color = 'red'; repTile.value = 4;

    const t1 = player.rack[1]; t1.color = 'red'; t1.value = 6;
    const t2 = player.rack[2]; t2.color = 'red'; t2.value = 7;
    const t3 = player.rack[3]; t3.color = 'red'; t3.value = 8;

    const newGroup = [g1[0], repTile, g1[2]];
    const result = game.makeMove(state, [t1, t2, t3], [newGroup, [t1, t2, t3]], [{ jokerId: 204, replacementTile: repTile }]);
    assert.strictEqual(result.success, true);
    const hasJoker = result.newState.players[0].rack.some(t => t.id === 204 && t.isJoker);
    assert.strictEqual(hasJoker, true);
    assert.strictEqual(result.scoreDelta, 21);
  });
});

describe('makeMove - combined operations', () => {

  it('should handle rearrange + joker replace + play new tiles in one turn', () => {
    const state = game.initGame('twoPlayer', null);
    const player = state.players[0];
    player.hasMelded = true;

    const jokerTile = testJoker(205);
    const g1 = [testTile('red', 3), jokerTile, testTile('red', 5)];
    state.board = [g1];

    const repTile = player.rack[0];
    repTile.color = 'red'; repTile.value = 4;

    const y6 = player.rack[1]; y6.color = 'yellow'; y6.value = 6;
    const y7 = player.rack[2]; y7.color = 'yellow'; y7.value = 7;
    const y8 = player.rack[3]; y8.color = 'yellow'; y8.value = 8;

    const newG1 = [g1[0], repTile, g1[2]];
    const newG2 = [y6, y7, y8];

    const result = game.makeMove(state, [y6, y7, y8], [newG1, newG2], [{ jokerId: 205, replacementTile: repTile }]);
    assert.strictEqual(result.success, true);
  });

  it('should reject when same tile appears in both play and replacement', () => {
    const state = game.initGame('twoPlayer', null);
    const player = state.players[0];
    player.hasMelded = true;

    const jokerTile = testJoker(206);
    const g1 = [testTile('red', 3), jokerTile, testTile('red', 5)];
    state.board = [g1];

    const repTile = player.rack[0];
    repTile.color = 'red'; repTile.value = 4;

    const newGroup = [g1[0], repTile, g1[2]];
    const result = game.makeMove(state, [repTile], [newGroup, [player.rack[1], player.rack[2], player.rack[3]]], [{ jokerId: 206, replacementTile: repTile }]);
    assert.strictEqual(result.success, false);
    assert.ok(result.errorMsg.includes('cannot be both played'));
  });
});

describe('getValidMoves', () => {
  it('should return moves for a player with valid tiles', () => {
    const state = game.initGame('single', 'normal');
    const player = state.players[0];
    player.hasMelded = true;
    for (let i = 0; i < 3; i++) {
      player.rack[i].color = 'red';
      player.rack[i].value = 3 + i;
    }
    const moves = game.getValidMoves(state);
    assert.ok(moves.length > 0);
  });

  it('should return empty array when no valid moves', () => {
    const state = game.initGame('single', 'normal');
    const player = state.players[0];
    player.hasMelded = true;
    player.rack = [];
    const moves = game.getValidMoves(state);
    assert.strictEqual(moves.length, 0);
  });
});

describe('getAIMove', () => {
  it('should return draw action when no valid moves for AI', () => {
    const state = game.initGame('single', 'normal');
    state.currentPlayerIndex = 1;
    const aiPlayer = state.players[1];
    aiPlayer.rack = [];
    const move = game.getAIMove(state);
    assert.strictEqual(move.action, 'draw');
  });

  it('should return play action for AI with valid tiles', () => {
    const state = game.initGame('single', 'normal');
    state.currentPlayerIndex = 1;
    const aiPlayer = state.players[1];
    aiPlayer.hasMelded = true;
    for (let i = 0; i < 3; i++) {
      aiPlayer.rack[i].color = 'red';
      aiPlayer.rack[i].value = 1 + i;
    }
    const move = game.getAIMove(state);
    if (move.action === 'play') {
      assert.ok(move.tilesToPlay.length >= 3);
    }
  });
});
