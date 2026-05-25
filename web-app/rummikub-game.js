/**
 * @module rummikub-game
 */

let _nextId = 0;
const COLORS = ['red', 'blue', 'yellow', 'black'];
const INITIAL_MELD_SCORE = 30;
const INITIAL_TILES = 14;

function createTile(color, value, isJoker = false) {
  return { id: _nextId++, color, value, isJoker };
}

function createDeck() {
  const deck = [];
  for (const color of COLORS) {
    for (let value = 1; value <= 13; value++) {
      deck.push(createTile(color, value, false));
      deck.push(createTile(color, value, false));
    }
  }
  deck.push(createTile(null, null, true));
  deck.push(createTile(null, null, true));
  return deck;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function tileValue(t) {
  return t.isJoker ? 30 : t.value;
}

function groupScore(group) {
  return group.reduce((s, t) => {
    if (t.isJoker) {
      const repr = getJokerRepresentation(group);
      return s + (repr ? repr.value : 0);
    }
    return s + t.value;
  }, 0);
}

function tileEqual(a, b) {
  return a.id === b.id;
}

function tilesEqualSet(a, b) {
  if (a.length !== b.length) return false;
  const used = new Array(b.length).fill(false);
  for (const ta of a) {
    let found = false;
    for (let i = 0; i < b.length; i++) {
      if (!used[i] && tileEqual(ta, b[i])) { used[i] = true; found = true; break; }
    }
    if (!found) return false;
  }
  return true;
}

function removeTiles(tiles, toRemove) {
  const remaining = [...tiles];
  for (const r of toRemove) {
    const idx = remaining.findIndex(t => tileEqual(t, r));
    if (idx !== -1) remaining.splice(idx, 1);
  }
  return remaining;
}

function containsTiles(tiles, subset) {
  const remaining = [...tiles];
  for (const s of subset) {
    const idx = remaining.findIndex(t => tileEqual(t, s));
    if (idx === -1) return false;
    remaining.splice(idx, 1);
  }
  return true;
}

function flatten(groups) {
  const result = [];
  for (const g of groups) result.push(...g);
  return result;
}

/**
 * Check if a group of tiles forms a valid Rummikub set or run.
 * @param {Array} group - array of tile objects {id, color, value, isJoker}
 * @returns {boolean}
 */
export function isValidGroup(group) {
  if (!Array.isArray(group) || group.length < 3) return false;

  const nonJokers = group.filter(t => !t.isJoker);
  const jokerCount = group.filter(t => t.isJoker).length;

  if (nonJokers.length === 0) return false;

  const allSameValue = nonJokers.every(t => t.value === nonJokers[0].value);
  const allSameColor = nonJokers.every(t => t.color === nonJokers[0].color);

  if (allSameValue) {
    if (group.length > 4) return false;
    const colors = new Set(nonJokers.map(t => t.color));
    if (colors.size !== nonJokers.length) return false;
    return true;
  }

  if (allSameColor) {
    const values = nonJokers.map(t => t.value);
    if (new Set(values).size !== values.length) return false;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min + 1;
    if (range > group.length) return false;
    return true;
  }

  return false;
}

function allGroupsValid(groups) {
  return groups.every(g => isValidGroup(g));
}

const COLOR_ORDER = ['red', 'blue', 'yellow', 'black'];
export function sortGroup(group) {
  if (group.length <= 1) return group;
  const nonJokers = group.filter(t => !t.isJoker);
  if (nonJokers.length === 0) return group;
  const allSameValue = nonJokers.every(t => t.value === nonJokers[0].value);
  if (allSameValue) {
    return [...group].sort((a, b) => {
      if (a.isJoker) return 1; if (b.isJoker) return -1;
      return COLOR_ORDER.indexOf(a.color) - COLOR_ORDER.indexOf(b.color);
    });
  }
  return [...group].sort((a, b) => {
    if (a.isJoker) return 1; if (b.isJoker) return -1;
    return a.value - b.value;
  });
}

/**
 * Initialize a new game.
 * @param {string} mode - 'single' or 'twoPlayer'
 * @param {string} difficulty - 'normal' or 'hard' (single mode only)
 * @returns {object} game state
 */
export function initGame(mode, difficulty) {
  _nextId = 0;
  const deck = shuffle(createDeck());
  const pool = [...deck];

  const players = [
    { id: 'player1', rack: pool.splice(0, INITIAL_TILES), hasMelded: false },
  ];

  if (mode === 'single') {
    players.push({ id: 'AI', rack: pool.splice(0, INITIAL_TILES), hasMelded: false });
  } else {
    players.push({ id: 'player2', rack: pool.splice(0, INITIAL_TILES), hasMelded: false });
  }

  return {
    mode,
    difficulty: mode === 'single' ? difficulty : null,
    players,
    board: [],
    pool,
    currentPlayerIndex: 0,
    turn: 0,
    gameOver: false,
    winner: null,
  };
}

/**
 * Determine what tile a joker represents in its current group.
 * @param {Array} group - array of tile objects containing one or more jokers
 * @returns {object|null} { color, value } or null if cannot determine
 */
export function getJokerRepresentation(group) {
  if (!Array.isArray(group) || group.length < 3) return null;
  const nonJokers = group.filter(t => !t.isJoker);
  const jokers = group.filter(t => t.isJoker);
  if (nonJokers.length === 0 || jokers.length === 0) return null;

  const allSameValue = nonJokers.every(t => t.value === nonJokers[0].value);
  const allSameColor = nonJokers.every(t => t.color === nonJokers[0].color);

  if (allSameValue && !allSameColor) {
    const usedColors = new Set(nonJokers.map(t => t.color));
    for (const c of COLORS) {
      if (!usedColors.has(c)) return { color: c, value: nonJokers[0].value };
    }
    return null;
  }

  if (allSameColor) {
    const values = nonJokers.map(t => t.value).sort((a, b) => a - b);
    const min = values[0];
    const max = values[values.length - 1];

    for (let i = 0; i < values.length - 1; i++) {
      if (values[i + 1] - values[i] === 2) {
        return { color: nonJokers[0].color, value: values[i] + 1 };
      }
    }

    const firstNonJokerIdx = group.findIndex(t => !t.isJoker);
    const firstJokerIdx = group.findIndex(t => t.isJoker);
    if (firstJokerIdx < firstNonJokerIdx) {
      return { color: nonJokers[0].color, value: min - 1 };
    }
    return { color: nonJokers[0].color, value: max + 1 };
  }

  return null;
}

/**
 * Player attempts to make a move.
 * Supports board tile manipulation (rearranging existing board tiles),
 * joker replacement (swapping a board joker with a matching tile from hand),
 * and standard new group play.
 *
 * @param {object} gameState
 * @param {Array} tilesToPlay - tiles from player's rack played as new groups/extensions
 * @param {Array} manipulatedGroups - final board groups after the move
 * @param {Array} jokerReplacements - [{ jokerId, replacementTile }] - jokers replaced on the board
 * @returns {object} { success, newState, errorMsg, scoreDelta }
 */
export function makeMove(gameState, tilesToPlay, manipulatedGroups, jokerReplacements = []) {
  const state = JSON.parse(JSON.stringify(gameState));
  const player = state.players[state.currentPlayerIndex];

  if (tilesToPlay.length === 0) {
    return { success: false, newState: state, errorMsg: 'Must play at least one tile from hand', scoreDelta: 0 };
  }

  const oldBoardTiles = flatten(state.board);
  const newGroupTiles = flatten(manipulatedGroups);
  const replacementTiles = jokerReplacements.map(r => r.replacementTile);

  const allFromHand = [...tilesToPlay];
  const handIds = new Set(tilesToPlay.map(t => t.id));
  for (const rt of replacementTiles) {
    if (handIds.has(rt.id)) {
      return { success: false, newState: state, errorMsg: 'Tile cannot be both played and used as joker replacement', scoreDelta: 0 };
    }
    allFromHand.push(rt);
    handIds.add(rt.id);
  }

  if (allFromHand.length > 0 && !containsTiles(player.rack, allFromHand)) {
    return { success: false, newState: state, errorMsg: 'Tiles not in rack', scoreDelta: 0 };
  }

  const replacedJokers = [];
  for (const rep of jokerReplacements) {
    const jokerTile = oldBoardTiles.find(t => t.id === rep.jokerId);
    if (!jokerTile || !jokerTile.isJoker) {
      return { success: false, newState: state, errorMsg: 'Invalid joker replacement: joker not found on board', scoreDelta: 0 };
    }
    if (newGroupTiles.some(t => tileEqual(t, jokerTile))) {
      return { success: false, newState: state, errorMsg: 'Replaced joker must be removed from board', scoreDelta: 0 };
    }
    if (!newGroupTiles.some(t => tileEqual(t, rep.replacementTile))) {
      return { success: false, newState: state, errorMsg: 'Replacement tile must be placed on board', scoreDelta: 0 };
    }
    replacedJokers.push(jokerTile);
  }

  const scoreDelta = tilesToPlay.reduce((s, t) => s + tileValue(t), 0);

  if (!player.hasMelded) {
    if (jokerReplacements.length > 0) {
      return { success: false, newState: state, errorMsg: 'Cannot replace jokers before initial meld', scoreDelta: 0 };
    }
  }

  if (!allGroupsValid(manipulatedGroups)) {
    return { success: false, newState: state, errorMsg: 'Invalid group(s) formed', scoreDelta: 0 };
  }

  const oldIds = new Set(oldBoardTiles.map(t => t.id));
  const newIds = new Set(newGroupTiles.map(t => t.id));
  const replacedJokerIds = new Set(replacedJokers.map(t => t.id));

  const expectedIds = new Set();
  for (const id of oldIds) {
    if (!replacedJokerIds.has(id)) expectedIds.add(id);
  }
  for (const id of handIds) {
    expectedIds.add(id);
  }

  if (expectedIds.size !== newIds.size || ![...expectedIds].every(id => newIds.has(id))) {
    return { success: false, newState: state, errorMsg: 'Board tile mismatch', scoreDelta: 0 };
  }

  if (!player.hasMelded) {
    const actualScore = manipulatedGroups.reduce((s, g) => s + groupScore(g), 0);
    if (actualScore < INITIAL_MELD_SCORE) {
      return { success: false, newState: state, errorMsg: `Initial meld needs at least ${INITIAL_MELD_SCORE} points (got ${actualScore})`, scoreDelta: 0 };
    }
    player.hasMelded = true;
  }

  state.board = manipulatedGroups.map(g => sortGroup(g));

  player.rack = removeTiles(player.rack, allFromHand);
  for (const joker of replacedJokers) {
    player.rack.push(joker);
  }
  state.turn++;
  state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;

  return { success: true, newState: state, errorMsg: null, scoreDelta };
}

/**
 * Current player skips and draws one tile.
 * @param {object} gameState
 * @returns {object} { newState, drawnTile }
 */
export function skipAndDraw(gameState) {
  const state = JSON.parse(JSON.stringify(gameState));
  const player = state.players[state.currentPlayerIndex];

  if (state.pool.length === 0) {
    state.turn++;
    state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
    return { newState: state, drawnTile: null };
  }

  const drawnTile = state.pool.pop();
  player.rack.push(drawnTile);
  state.turn++;
  state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;

  return { newState: state, drawnTile };
}

/**
 * Check if game is over.
 * @param {object} gameState
 * @returns {boolean|string} false or winner id
 */
export function checkWin(gameState) {
  for (const player of gameState.players) {
    if (player.rack.length === 0) return player.id;
  }
  return false;
}

function findValidGroups(rack) {
  const jokers = rack.filter(t => t.isJoker);
  const regular = rack.filter(t => !t.isJoker);
  const groups = [];

  const byValue = {};
  for (const t of regular) {
    if (!byValue[t.value]) byValue[t.value] = [];
    byValue[t.value].push(t);
  }

  for (const val of Object.keys(byValue).map(Number)) {
    const tiles = byValue[val];
    const colors = [...new Set(tiles.map(t => t.color))];
    const maxSize = Math.min(4, colors.length + jokers.length);
    for (let n = 3; n <= maxSize; n++) {
      const jokersNeeded = n - colors.length;
      if (jokersNeeded >= 0 && jokersNeeded <= jokers.length) {
        const selectedColors = colors.slice(0, n - jokersNeeded);
        const groupTiles = selectedColors.map(c => tiles.find(t => t.color === c));
        for (let j = 0; j < jokersNeeded; j++) groupTiles.push(jokers[j]);
        groups.push(groupTiles);
      }
    }
  }

  const byColor = {};
  for (const t of regular) {
    if (!byColor[t.color]) byColor[t.color] = [];
    byColor[t.color].push(t.value);
  }

  for (const color of Object.keys(byColor)) {
    const vals = [...new Set(byColor[color])].sort((a, b) => a - b);
    for (let i = 0; i < vals.length; i++) {
      for (let j = i + 2; j < vals.length; j++) {
        const subVals = vals.slice(i, j + 1);
        const minV = subVals[0];
        const maxV = subVals[subVals.length - 1];
        const range = maxV - minV + 1;
        const needed = range - subVals.length;
        if (needed <= jokers.length) {
          const groupTiles = subVals.map(v => regular.find(t => t.color === color && t.value === v));
          for (let j2 = 0; j2 < needed; j2++) groupTiles.push(jokers[j2]);
          groups.push(groupTiles);
        }
      }
    }
  }

  return groups;
}

function findExtensions(rack, board) {
  const exts = [];
  for (let gi = 0; gi < board.length; gi++) {
    for (const tile of rack) {
      const testGroup = [...board[gi], tile];
      if (isValidGroup(testGroup)) {
        const newBoard = board.map((g, i) => i === gi ? testGroup : g);
        exts.push({ tile, groupIndex: gi, newBoard });
      }
    }
  }
  return exts;
}

/**
 * Find non-overlapping groups from findValidGroups whose total score reaches INITIAL_MELD_SCORE.
 * Picks groups greedily by score descending.
 */
function findCombinedMeld(groups) {
  const sorted = [...groups].sort((a, b) => {
    const sa = groupScore(a);
    const sb = groupScore(b);
    return sb - sa;
  });

  let bestScore = 0;
  let bestTiles = [];
  let bestGroupArrays = [];

  function backtrack(idx, usedIds, curTiles, curGroups, curScore) {
    if (curScore >= INITIAL_MELD_SCORE && curScore > bestScore) {
      bestScore = curScore;
      bestTiles = [...curTiles];
      bestGroupArrays = [...curGroups];
      return;
    }
    if (idx >= sorted.length) return;
    if (curScore >= INITIAL_MELD_SCORE) return;

    backtrack(idx + 1, usedIds, curTiles, curGroups, curScore);

    const group = sorted[idx];
    const gScore = groupScore(group);
    const hasOverlap = group.some(t => usedIds.has(t.id));
    if (!hasOverlap) {
      const newIds = new Set(usedIds);
      group.forEach(t => newIds.add(t.id));
      backtrack(idx + 1, newIds, [...curTiles, ...group], [...curGroups, group], curScore + gScore);
    }
  }

  backtrack(0, new Set(), [], [], 0);

  if (bestScore >= INITIAL_MELD_SCORE) {
    return { tilesToPlay: bestTiles, groups: bestGroupArrays, score: bestScore };
  }
  return null;
}

/**
 * Get all valid moves for current player.
 * @param {object} gameState
 * @returns {Array} move list
 */
export function getValidMoves(gameState) {
  const player = gameState.players[gameState.currentPlayerIndex];
  const board = gameState.board;
  const rack = player.rack;
  const moves = [];

  const newGroups = findValidGroups(rack);

  if (!player.hasMelded) {
    for (const group of newGroups) {
      const score = groupScore(group);
      if (score >= INITIAL_MELD_SCORE) {
        moves.push({ tilesToPlay: group, manipulatedGroups: [group], score });
      }
    }
    if (moves.length === 0 && newGroups.length >= 2) {
      const combined = findCombinedMeld(newGroups);
      if (combined) {
        moves.push({
          tilesToPlay: combined.tilesToPlay,
          manipulatedGroups: combined.groups,
          score: combined.score,
        });
      }
    }
  } else {
    for (const group of newGroups) {
      const score = groupScore(group);
      moves.push({ tilesToPlay: group, manipulatedGroups: [...board, group], score });
    }

    const exts = findExtensions(rack, board);
    for (const ext of exts) {
      const score = tileValue(ext.tile);
      moves.push({ tilesToPlay: [ext.tile], manipulatedGroups: ext.newBoard, score });
    }
  }

  return moves;
}

/**
 * AI automatically makes a decision.
 * @param {object} gameState
 * @returns {object} { action, tilesToPlay, manipulatedGroups }
 */
export function getAIMove(gameState) {
  if (gameState.mode !== 'single') return { action: 'none', tilesToPlay: [], manipulatedGroups: [] };

  const moves = getValidMoves(gameState);

  if (moves.length === 0) {
    return { action: 'draw', tilesToPlay: [], manipulatedGroups: [] };
  }

  if (gameState.difficulty === 'hard') {
    const best = moves.reduce((a, b) => a.score > b.score ? a : (a.tilesToPlay.length > b.tilesToPlay.length ? a : b));
    return { action: 'play', tilesToPlay: best.tilesToPlay, manipulatedGroups: best.manipulatedGroups };
  }

  const move = moves[0];
  return { action: 'play', tilesToPlay: move.tilesToPlay, manipulatedGroups: move.manipulatedGroups };
}
