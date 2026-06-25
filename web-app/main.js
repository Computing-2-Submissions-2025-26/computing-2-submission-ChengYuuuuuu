import { initGame, makeMove, skipAndDraw, checkWin, isValidGroup, getAIMove, getJokerRepresentation, sortGroup, COLORS, INITIAL_MELD_SCORE, INITIAL_TILES } from './rummikub-game.js';

const COLOR_LABELS = { red: 'R', blue: 'B', yellow: 'Y', black: 'K' };

// ── Animation Durations ──
const ANIM = {
  FLY_OUT: 300,
  FLY_IN: 300,
  FLY_IN_CLEANUP_DELAY: 350,
  AI_TURN_DELAY: 600,
  AI_THINK_DELAY: 400,
  TURN_START_DELAY: 50,
  TURN_START_FALLBACK: 100,
  DRAW_CARD: 500,
  AI_MOVE_SLIDE: 500,
  AI_MOVE_FADE: 500,
  AI_MOVE_CLEANUP: 500,
  DRAW_PILE_RESET: 200,
  CONFETTI_DELAY_BASE: 1000,
  CONFETTI_DURATION_BASE: 1500,
  BARRAGE_REMOVE: 1500,
  POOL_EMPTY_GAMEOVER: 1500,
  TUTORIAL_START_DELAY: 200,
  MESSAGE_AUTO_HIDE: 3000,
};

// ── DOM Element IDs ──
const ID = {
  GAME_SCREEN: 'game-screen',
  START_SCREEN: 'start-screen',
  GAMEOVER_SCREEN: 'gameover-screen',
  BOARD_GROUPS: 'board-groups',
  RACK_TILES: 'rack-tiles',
  PLAYER_HAND: 'player-hand',
  AI_HAND: 'ai-hand',
  PLAYER1_INFO: 'player1-info',
  PLAYER2_INFO: 'player2-info',
  PASS_OVERLAY: 'pass-overlay',
  PASS_BTN: 'pass-btn',
  PASS_HIDDEN_STYLE: 'pass-hidden-style',
  PLAYER_AREA: 'player-area',
  CONTROLS: 'controls',
  SUBMIT_BTN: 'submit-btn',
  CANCEL_BTN: 'cancel-btn',
  DRAW_BTN: 'draw-btn',
  DRAW_PILE: 'draw-pile',
  TURN_INDICATOR: 'turn-indicator',
  COUNT_P1: 'count-p1',
  COUNT_P2: 'count-p2',
  AVATAR_P1: 'avatar-p1',
  AVATAR_P2: 'avatar-p2',
  NAME_P1: 'name-p1',
  NAME_P2: 'name-p2',
  MELD_STATUS: 'meld-status',
  POOL_INFO: 'pool-info',
  PILE_COUNT: 'pile-count',
  WINNER_TEXT: 'winner-text',
  MUSIC_BTN: 'music-btn',
  NEW_GAME_BTN: 'new-game-btn',
  PLAY_AGAIN_BTN: 'play-again-btn',
  TUTORIAL_OVERLAY: 'tutorial-overlay',
  TUTORIAL_DIALOG: 'tutorial-dialog',
  TUTORIAL_EMOJI: 'tutorial-emoji',
  TUTORIAL_TEXT: 'tutorial-text',
  TUTORIAL_AVATAR: 'tutorial-avatar',
  TUTORIAL_TILE_GRID: 'tutorial-tile-grid',
  TUTORIAL_CONTENT: 'tutorial-content',
  TUTORIAL_BUTTONS: 'tutorial-buttons',
  MESSAGE_AREA: 'message-area',
  PENDING_AREA: 'pending-area',
  BGM: 'bgm',
};

// ── CSS Class Names ──
const CLASS = {
  DISABLED: 'disabled',
  EMPTY: 'empty',
  SELECTED: 'selected',
  INVALID: 'invalid',
  TILE_NEW: 'tile-new',
  ACTIVE: 'active',
  FROZEN: 'frozen',
  DRAGGING: 'dragging',
  DROP_VALID: 'drop-valid',
  DROP_INVALID: 'drop-invalid',
  DRAG_ACTIVE: 'drag-active',
  DRAG_OVER_RACK: 'drag-over-rack',
  BOARD_GROUP: 'board-group',
  BOARD_EMPTY: 'board-empty',
  TILE: 'tile',
  TILE_ROW: 'tile-row',
  TILE_VALUE: 'tile-value',
  TILE_SUB: 'tile-sub',
  JOKER: 'joker',
  FLYING_CARD: 'flying-card',
  PIXEL_CONFETTI: 'pixel-confetti',
  BARRAGE_OVERLAY: 'barrage-overlay',
  BARRAGE_TEXT: 'barrage-text',
  AI_HAND_TILE: 'ai-hand-tile',
  HAS_SPOTLIGHT: 'has-spotlight',
  BOING: 'boing',
  TUTORIAL_TILE_STEP: 'tutorial-tile-step',
  JOKER_FOCUS: 'joker-focus',
  AVATAR_OPPONENT: 'avatar-opponent',
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
};

// ── Animation / Layout Offsets ──
const LAYOUT = {
  FLY_OFFSET: 200,
  DRAW_CARD_OFFSET_X: 24,
  DRAW_CARD_OFFSET_Y: 32,
  DRAW_CARD_OFFSET_RIGHT: 48,
  DRAW_PILE_SCALE_DOWN: 0.95,
  DRAW_PILE_SCALE_OVER: 1.05,
  BTN_HOVER_SCALE: 1.03,
  BTN_PRESS_SCALE: 0.97,
  BTN_HOVER_BRIGHTNESS: 1.2,
  CONFETTI_COUNT: 60,
  CONFETTI_SIZE_MIN: 4,
  CONFETTI_SIZE_RANDOM: 4,
};

// ── Message / UI Text ──
const MSG = {
  TILE_PLAYED: 'Tile played',
  TILE_MOVED: 'Tile moved',
  TILE_RETURNED: 'Tile returned to rack',
  NO_TILES_TO_PLAY: 'No tiles to play or replace',
  TURN_CANCELLED: 'Turn cancelled',
  PENDING_PLAYS: 'You have pending plays. Cancel or submit first.',
  COMPLETE_MOVE_FIRST: 'Complete the required move first!',
  DREW_AND_SKIPPED: 'Drew a tile and skipped',
  AI_ERROR: 'AI encountered an error and will skip',
  NO_TILES_ON_BOARD: 'No tiles on the board yet',
  NO_TILES: 'No tiles',
  JOKER_AMBIGUOUS: 'Joker in an ambiguous position in a run',
  RUN_ORDER: 'Run groups must be in ascending order',
};

// ── Confetti Colors ──
const CONFETTI_COLORS = ['#e74c3c', '#3498db', '#f1c40f', '#2ecc71', '#9b59b6', '#e67e22'];

// ── Emoji to Asset Map ──
const EMOJI_ASSETS = { '😊': 'normal', '🥳': 'happy', '😮': 'surprised', '🤔': 'thinking' };

// ── Player/Mode Identifiers ──
const PLAYER = { P1: 'player1', P2: 'player2', AI: 'AI' };
const MODE = { SINGLE: 'single', TWO_PLAYER: 'twoPlayer', TUTORIAL: 'tutorial' };

let gameState = null;
let pendingRack = null;
let pendingBoard = null;
let originalRackIds = null;
let selectedTileIds = new Set();
let selectedGroupIdx = -1;
let isProcessing = false;
let dragData = null;
let consecutiveEmptySkips = 0;
let aiFadeTileIds = null;
let isTutorialMode = false;
let tutorialGameStep = 1;
let awaitingInitialMeld = false;
let showAIPlayComplete = false;
let awaitingDraw = false;
let awaitingJokerPlay = false;
let isAnimatingDraw = false;
let isTransitioning = false;
let awaitingPass = false;
let _justDrewTileId = null;

const bgm = document.getElementById('bgm');
bgm.volume = 0.25;
let musicOn = false;

function toggleMusic() {
  musicOn = !musicOn;
  const btn = document.getElementById(ID.MUSIC_BTN);
  if (btn) btn.textContent = musicOn ? '🔊 Music' : '🔇 Music';
  if (musicOn) bgm.play();
  else bgm.pause();
}

function stopMusic() {
  bgm.pause();
  musicOn = false;
  const btn = document.getElementById(ID.MUSIC_BTN);
  if (btn) btn.textContent = '🔇 Music';
}

setupEventListeners();
showStartScreen();

bgm.play().then(() => {
  musicOn = true;
  const btn = document.getElementById(ID.MUSIC_BTN);
  if (btn) btn.textContent = '🔊 Music';
}).catch(() => {});

function showStartScreen() {
  stopMusic();
  hideAllScreens();
  document.getElementById(ID.START_SCREEN).style.display = 'block';
}

function hideAllScreens() {
  document.getElementById(ID.START_SCREEN).style.display = 'none';
  document.getElementById(ID.GAME_SCREEN).style.display = 'none';
  document.getElementById(ID.GAMEOVER_SCREEN).style.display = 'none';
}

function setupEventListeners() {
  document.querySelector('.cover-buttons').addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    SFX.button();
    const mode = btn.dataset.mode;
    const difficulty = btn.dataset.difficulty || null;
    if (!musicOn) toggleMusic();
    startGame(mode, difficulty);
  });

  document.getElementById(ID.NEW_GAME_BTN).addEventListener('click', () => { SFX.button(); showStartScreen(); });
  document.getElementById(ID.PLAY_AGAIN_BTN).addEventListener('click', () => { SFX.button(); showStartScreen(); });

  document.getElementById(ID.MUSIC_BTN).addEventListener('click', () => { SFX.button(); toggleMusic(); });

  document.getElementById(ID.SUBMIT_BTN).addEventListener('click', () => { SFX.button(); submitTurn(); });
  document.getElementById(ID.CANCEL_BTN).addEventListener('click', () => { SFX.button(); cancelTurn(); });
  document.getElementById(ID.DRAW_BTN).addEventListener('click', () => { SFX.button(); drawAndSkip(); });
  document.getElementById(ID.DRAW_PILE).addEventListener('click', () => { SFX.button(); drawAndSkip(); });

  document.getElementById(ID.BOARD_GROUPS).addEventListener('click', e => {
    const groupEl = e.target.closest('.board-group');
    if (!groupEl) return;
    const idx = parseInt(groupEl.dataset.index, 10);
    if (!isNaN(idx)) {
      selectBoardGroup(idx);
    }
  });

  document.getElementById(ID.RACK_TILES).addEventListener('click', e => {
    const tileEl = e.target.closest('.tile');
    if (!tileEl) return;
    const id = parseInt(tileEl.dataset.id, 10);
    if (!isNaN(id)) {
      toggleTileSelection(id);
    }
  });

  // Drag and drop event delegation
  document.addEventListener('dragstart', handleDragStart);
  document.addEventListener('dragend', handleDragEnd);
  document.getElementById(ID.BOARD_GROUPS).addEventListener('dragover', handleDragOver);
  document.getElementById(ID.BOARD_GROUPS).addEventListener('drop', handleBoardDrop);
  document.getElementById(ID.BOARD_GROUPS).addEventListener('dragenter', handleGroupDragEnter);
  document.getElementById(ID.BOARD_GROUPS).addEventListener('dragleave', handleGroupDragLeave);
  document.getElementById(ID.RACK_TILES).addEventListener('dragover', handleDragOver);
  document.getElementById(ID.RACK_TILES).addEventListener('drop', handleRackDrop);
  document.getElementById(ID.RACK_TILES).addEventListener('dragenter', () => {
    if (dragData && dragData.sourceType === 'board') {
      document.getElementById(ID.RACK_TILES).classList.add('drag-over-rack');
    }
  });
  document.getElementById(ID.RACK_TILES).addEventListener('dragleave', e => {
    if (e.target === document.getElementById(ID.RACK_TILES) || !e.currentTarget.contains(e.relatedTarget)) {
      document.getElementById(ID.RACK_TILES).classList.remove('drag-over-rack');
    }
  });
}

function findPendingTile(tileId) {
  for (const group of pendingBoard) {
    const found = group.find(t => t.id === tileId);
    if (found) return found;
  }
  return (pendingRack || []).find(t => t.id === tileId);
}

function getInsertIndex(groupEl, clientX) {
  const tileEls = groupEl.querySelectorAll('.tile');
  let pos = 0;
  for (const el of tileEls) {
    const rect = el.getBoundingClientRect();
    if (clientX < rect.left + rect.width / 2) return pos;
    pos++;
  }
  return pos;
}

function trySnapToGroup(group, tile) {
  if (group.length === 0) return 0;
  if (group.length < 3) return group.length;
  for (let i = 0; i <= group.length; i++) {
    const test = [...group.slice(0, i), tile, ...group.slice(i)];
    if (isValidGroup(test)) return i;
  }
  return group.length;
}

function handleDragStart(e) {
  const tileEl = e.target.closest('.tile');
  if (!tileEl || isProcessing || awaitingPass) return;
  const tileId = parseInt(tileEl.dataset.id, 10);
  if (isNaN(tileId)) return;

  const boardGroupEl = tileEl.closest('.board-group');
  const isFromBoard = !!boardGroupEl;
  const sourceGroupIdx = isFromBoard ? parseInt(boardGroupEl.dataset.index, 10) : -1;

  if (isFromBoard) {
    selectedTileIds.clear();
    selectedGroupIdx = -1;
    const tile = findPendingTile(tileId);
    if (!tile) return;
    dragData = { tileIds: [tileId], tiles: [tile], sourceType: 'board', sourceGroupIdx };
    e.dataTransfer.setData('text/plain', String(tileId));
  } else {
    let ids;
    if (selectedTileIds.has(tileId) && selectedTileIds.size > 1) {
      ids = [...selectedTileIds];
    } else {
      selectedTileIds.clear();
      ids = [tileId];
    }
    const tiles = ids.map(id => (pendingRack || []).find(t => t.id === id)).filter(Boolean);
    if (tiles.length === 0) return;
    selectedGroupIdx = -1;
    dragData = { tileIds: ids, tiles, sourceType: 'rack', sourceGroupIdx: -1 };
    e.dataTransfer.setData('text/plain', JSON.stringify(ids));
  }

  e.dataTransfer.effectAllowed = 'move';
  tileEl.classList.add('dragging');
  document.getElementById(ID.BOARD_GROUPS).classList.add('drag-active');
}

function handleDragEnd() {
  document.querySelectorAll('.tile.dragging').forEach(el => el.classList.remove('dragging'));
  document.querySelectorAll('.board-group.drop-valid, .board-group.drop-invalid').forEach(el => {
    el.classList.remove('drop-valid', 'drop-invalid');
  });
  document.getElementById(ID.BOARD_GROUPS).classList.remove('drag-active');
  document.getElementById(ID.RACK_TILES).classList.remove('drag-over-rack');
  dragData = null;
}

function handleGroupDragEnter(e) {
  if (!dragData) return;
  const groupEl = e.target.closest('.board-group');
  if (!groupEl) return;
  groupEl.classList.remove('drop-valid', 'drop-invalid');
  groupEl.classList.add('drop-valid');
}

function handleGroupDragLeave(e) {
  if (!dragData) return;
  const groupEl = e.target.closest('.board-group');
  if (!groupEl) return;
  if (groupEl.contains(e.relatedTarget)) return;
  groupEl.classList.remove('drop-valid', 'drop-invalid');
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

function handleBoardDrop(e) {
  e.preventDefault();
  if (!dragData || awaitingPass) return;
  const { tileIds, tiles, sourceType, sourceGroupIdx } = dragData;

  const groupEl = e.target.closest('.board-group');
  if (groupEl) {
    const targetIdx = parseInt(groupEl.dataset.index, 10);
    if (isNaN(targetIdx)) return;
    const insertAt = getInsertIndex(groupEl, e.clientX);
    performGroupDrop(tileIds, sourceType, sourceGroupIdx, tiles, targetIdx, insertAt);
  } else if (e.currentTarget === document.getElementById(ID.BOARD_GROUPS)) {
    performNewGroupDrop(tileIds, sourceType, sourceGroupIdx, tiles);
  }
}

function performGroupDrop(tileIds, sourceType, sourceGroupIdx, tiles, targetIdx, insertAt) {
  const idSet = new Set(tileIds);
  if (sourceType === 'board' && sourceGroupIdx === targetIdx) {
    const group = pendingBoard[sourceGroupIdx];
    const filtered = group.filter(t => !idSet.has(t.id));
    pendingBoard[sourceGroupIdx] = [...filtered.slice(0, insertAt), ...tiles, ...filtered.slice(insertAt)];
    afterTileMove();
    return;
  }

  commitTileMove(tileIds, sourceType, sourceGroupIdx, targetIdx,
    [...pendingBoard[targetIdx].slice(0, insertAt), ...tiles, ...pendingBoard[targetIdx].slice(insertAt)]
  );
}

function performNewGroupDrop(tileIds, sourceType, sourceGroupIdx, tiles) {
  const idSet = new Set(tileIds);
  if (sourceType === 'rack') {
    pendingRack = pendingRack.filter(t => !idSet.has(t.id));
  } else if (sourceType === 'board' && sourceGroupIdx >= 0) {
    pendingBoard = pendingBoard.map((g, i) =>
      i === sourceGroupIdx ? g.filter(t => !idSet.has(t.id)) : g
    );
  }

  if (aiFadeTileIds) {
    tileIds.forEach(id => aiFadeTileIds.delete(id));
  }

  pendingBoard.push([...tiles]);
  afterTileMove();
}

function commitTileMove(tileIds, sourceType, sourceGroupIdx, targetIdx, newTargetGroup) {
  const idSet = new Set(tileIds);
  if (sourceType === 'rack') {
    pendingRack = pendingRack.filter(t => !idSet.has(t.id));
  } else if (sourceType === 'board' && sourceGroupIdx >= 0) {
    pendingBoard = pendingBoard.map((g, i) =>
      i === sourceGroupIdx ? g.filter(t => !idSet.has(t.id)) : g
    );
  }

  pendingBoard[targetIdx] = newTargetGroup;
  afterTileMove();
}

function afterTileMove(skipMsg = false) {
  SFX.place();
  pendingBoard = pendingBoard.filter(g => g.length > 0);
  selectedTileIds.clear();
  selectedGroupIdx = -1;
  updateControls();
  renderAll();
  if (dragData && !skipMsg) {
    const msg = dragData.sourceType === 'rack' ? 'Tile played' : 'Tile moved';
    showMessage(msg, CLASS.SUCCESS);
  }
  dragData = null;

  if (isTutorialMode && tutorialGameStep === 1) {
    const hasGroup = pendingBoard.some(g => {
      const ids = g.map(t => t.id);
      return ids.includes(1) && ids.includes(2) && ids.includes(3);
    });
    if (hasGroup) {
      tutorialGameStep = 2;
      showMessage('Step 1 done! Click Submit to confirm.', 'success');
    }
  }
}

function handleRackDrop(e) {
  e.preventDefault();
  if (!dragData || awaitingPass) return;
  const { tileIds, tiles, sourceType, sourceGroupIdx } = dragData;
  if (sourceType !== 'board' || sourceGroupIdx < 0) return;

  const idSet = new Set(tileIds);
  for (const t of tiles) pendingRack.push(t);
  pendingBoard[sourceGroupIdx] = pendingBoard[sourceGroupIdx].filter(t => !idSet.has(t.id));
  selectedTileIds.clear();
  selectedGroupIdx = -1;
  afterTileMove(true);
  showMessage('Tile returned to rack', 'info');
}

function startTutorialGame() {
  isTutorialMode = true;
  tutorialGameStep = 1;

  const humanTiles = [
    { id: 1, color: 'red', value: 11, isJoker: false },
    { id: 2, color: 'blue', value: 11, isJoker: false },
    { id: 3, color: 'yellow', value: 11, isJoker: false },
    { id: 4, color: 'black', value: 7, isJoker: false },
    { id: 5, color: 'black', value: 8, isJoker: false },
    { id: 6, color: 'blue', value: 13, isJoker: false },
    { id: 7, color: 'red', value: 4, isJoker: false },
    { id: 8, color: 'blue', value: 9, isJoker: false },
    { id: 9, color: 'yellow', value: 2, isJoker: false },
    { id: 10, color: 'black', value: 5, isJoker: false },
    { id: 11, color: 'red', value: 1, isJoker: false },
    { id: 12, color: 'blue', value: 3, isJoker: false },
    { id: 13, color: 'yellow', value: 6, isJoker: false },
    { id: 14, color: 'red', value: 10, isJoker: false },
  ];

  const aiTiles = [
    { id: 15, color: 'black', value: 10, isJoker: false },
    { id: 16, color: 'black', value: 11, isJoker: false },
    { id: 17, color: 'black', value: 12, isJoker: false },
    { id: 18, color: 'red', value: 5, isJoker: false },
    { id: 19, color: 'red', value: 6, isJoker: false },
    { id: 20, color: 'red', value: 7, isJoker: false },
    { id: 21, color: 'blue', value: 1, isJoker: false },
    { id: 22, color: 'blue', value: 2, isJoker: false },
    { id: 23, color: 'blue', value: 4, isJoker: false },
    { id: 24, color: 'yellow', value: 8, isJoker: false },
    { id: 25, color: 'yellow', value: 9, isJoker: false },
    { id: 26, color: 'yellow', value: 10, isJoker: false },
    { id: 27, color: 'black', value: 3, isJoker: false },
    { id: 28, color: 'red', value: 2, isJoker: false },
  ];

  const allPreset = [...humanTiles, ...aiTiles];
  const presetKey = t => `${t.color}|${t.value}|${t.isJoker}`;
  const presetKeys = new Set(allPreset.map(presetKey));

  const allTiles = [];
  let nextId = 1;
  for (const t of allPreset) { t.id = nextId++; }
  for (let copy = 0; copy < 2; copy++) {
    allTiles.push({ id: nextId++, color: null, value: null, isJoker: true });
  }
  for (const color of ['red', 'blue', 'yellow', 'black']) {
    for (let value = 1; value <= 13; value++) {
      for (let copy = 0; copy < 2; copy++) {
        const key = `${color}|${value}|false`;
        if (presetKeys.has(key)) { presetKeys.delete(key); continue; }
        allTiles.push({ id: nextId++, color, value, isJoker: false });
      }
    }
  }

  const usedIds = new Set(allPreset.map(t => t.id));
  const pool = allTiles.filter(t => !usedIds.has(t.id));

  gameState = {
    mode: MODE.TUTORIAL,
    difficulty: null,
    players: [
      { id: 'player1', rack: humanTiles, hasMelded: false },
      { id: 'AI', rack: aiTiles, hasMelded: false },
    ],
    board: [],
    pool,
    currentPlayerIndex: 0,
    turn: 0,
    gameOver: false,
    winner: null,
  };

  hideAllScreens();
  document.getElementById(ID.GAME_SCREEN).style.display = 'flex';
  document.getElementById(ID.GAMEOVER_SCREEN).style.display = 'none';
  selectedTileIds = new Set();
  selectedGroupIdx = -1;
  isProcessing = false;
  consecutiveEmptySkips = 0;
  startTurn();
}

function startGame(mode, difficulty) {
  gameState = initGame(mode, difficulty);
  hideAllScreens();
  document.getElementById(ID.GAME_SCREEN).style.display = 'flex';
  document.getElementById(ID.GAMEOVER_SCREEN).style.display = 'none';
  selectedTileIds = new Set();
  selectedGroupIdx = -1;
  isProcessing = false;
  consecutiveEmptySkips = 0;
  startTurn();
}

function startTurn() {
  const player = gameState.players[gameState.currentPlayerIndex];
  if (!player) return;

  if (player.id === PLAYER.AI) {
    isProcessing = true;
    renderAll();
    if (isTutorialMode) {
      setTimeout(() => doTutorialAITurn(), 600);
    } else {
      setTimeout(() => doAITurn(), 600);
    }
    return;
  }

  isProcessing = false;
  pendingRack = null;
  pendingBoard = null;
  originalRackIds = null;
  dragData = null;

  const passOverlay = document.getElementById(ID.PASS_OVERLAY);
  if (passOverlay) passOverlay.remove();
  document.getElementById(ID.CONTROLS).style.display = '';

  const current = gameState.players[gameState.currentPlayerIndex];
  pendingRack = JSON.parse(JSON.stringify(current.rack));
  pendingBoard = JSON.parse(JSON.stringify(gameState.board));
  originalRackIds = current.rack.map(t => t.id);
  selectedTileIds = new Set();
  selectedGroupIdx = -1;

  updateFrozenState();
  updateControls();
  renderAll();
  showMessage(`Your turn, ${current.id}!${current.hasMelded ? '' : ' (Need 30+ points for initial meld)'}`, 'info');
}

function afterAITurn() {
  try {
    const winner = checkWin(gameState);
    if (winner) {
      showGameOver(winner);
      return;
    }
  } catch (_) {
    console.error('checkWin error');
  }
  try { startTurn(); } catch (_) { setTimeout(startTurn, 100); }

  if (isTutorialMode && showAIPlayComplete) {
    showAIPlayComplete = false;
    const overlay = document.getElementById(ID.TUTORIAL_OVERLAY);
    overlay.classList.add(CLASS.ACTIVE);
    tutorialQueue = [...tutorialNo];
    tutorialStep = 6;
    showTutorialStep();
  }
}

function animateAIMove(tilesToPlay, newGameState) {
  const aiPlayer = gameState.players[gameState.currentPlayerIndex];
  const playedIds = new Set(tilesToPlay.map(t => t.id));

  showMessage('AI is thinking...', 'info');

  setTimeout(() => {
    pendingRack = JSON.parse(JSON.stringify(aiPlayer.rack)).filter(t => !playedIds.has(t.id));
    pendingBoard = JSON.parse(JSON.stringify(gameState.board));
    renderAll();
    showMessage('AI plays tiles...', 'info');

    setTimeout(() => {
      const oldTileRects = new Map();
      document.querySelectorAll('#board-groups .tile').forEach(el => {
        const id = parseInt(el.dataset.id, 10);
        if (!isNaN(id)) {
          const r = el.getBoundingClientRect();
          oldTileRects.set(id, { left: r.left, top: r.top });
        }
      });

      aiFadeTileIds = new Set(tilesToPlay.map(t => t.id));
      pendingBoard = JSON.parse(JSON.stringify(newGameState.board));
      renderAll();
      showMessage('AI rearranges board...', 'info');

      const slideEls = [];
      const fadeEls = [];

      document.querySelectorAll('#board-groups .tile').forEach(el => {
        const id = parseInt(el.dataset.id, 10);
        if (isNaN(id)) return;
        const old = oldTileRects.get(id);
        if (old) {
          const r = el.getBoundingClientRect();
          const dx = old.left - r.left;
          const dy = old.top - r.top;
          if (dx !== 0 || dy !== 0) {
            el.style.transition = 'none';
            el.style.transform = `translate(${dx}px, ${dy}px)`;
            slideEls.push(el);
          }
        } else {
          el.style.opacity = '0';
          fadeEls.push(el);
        }
      });

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          slideEls.forEach(el => {
            el.style.transition = 'transform 0.5s ease';
            el.style.transform = '';
          });

          setTimeout(() => {
            fadeEls.forEach(el => {
              el.style.transition = 'opacity 0.5s ease';
              el.style.opacity = '';
            });

            setTimeout(() => {
              aiFadeTileIds = null;
              gameState = newGameState;
              pendingRack = null;
              pendingBoard = null;
              isProcessing = false;
              document.querySelectorAll('#board-groups .tile').forEach(el => {
                el.style.transition = '';
                el.style.transform = '';
                el.style.opacity = '';
              });
              renderAll();
              afterAITurn();
            }, 500);
          }, 500);
        });
      });
    }, 500);
  }, 400);
}

function doAITurn() {
  try {
    const aiMove = getAIMove(gameState);

    if (aiMove.action === 'draw' || !aiMove.tilesToPlay || aiMove.tilesToPlay.length === 0) {
      animateDraw(() => {
        showBarrage('SKIP', '#f39c12', 'top');
        const result = skipAndDraw(gameState);
        gameState = result.newState;
        isProcessing = false;
        afterAITurn();
      }, 'ai-hand');
      return;
    }

    const moveResult = makeMove(gameState, aiMove.tilesToPlay, aiMove.manipulatedGroups);
    if (moveResult.success) {
      animateAIMove(aiMove.tilesToPlay, moveResult.newState);
    } else {
      console.error('AI move rejected:', moveResult.errorMsg);
      const drawResult = skipAndDraw(gameState);
      gameState = drawResult.newState;
      isProcessing = false;
      afterAITurn();
    }
  } catch (e) {
    console.error('AI error:', e);
    showMessage('AI encountered an error and will skip', 'error');
    try { const r = skipAndDraw(gameState); gameState = r.newState; } catch (_) {}
    isProcessing = false;
    afterAITurn();
  }
}

function doTutorialAITurn() {
  if (!isTutorialMode) {
    doAITurn();
    return;
  }
  console.log(`[Tutorial] AI turn, step ${tutorialGameStep}`);

  if (tutorialGameStep === 2) {
    showMessage('AI is thinking...', 'info');
    renderAll();
    setTimeout(() => {
      const aiPlayer = gameState.players[1];
      const tilesToPlay = aiPlayer.rack.filter(t => [15, 16, 17].includes(t.id));
      const group = sortGroup([...tilesToPlay]);

      aiPlayer.rack = aiPlayer.rack.filter(t => ![15, 16, 17].includes(t.id));
      aiPlayer.hasMelded = true;
      gameState.board.push(group);
      gameState.turn++;
      gameState.currentPlayerIndex = 0;
      isProcessing = false;
      tutorialGameStep = 3;
      showAIPlayComplete = true;
      showMessage('AI played black 10-11-12 as a run!', 'success');
      renderAll();
      afterAITurn();
    }, 1000);

  } else if (tutorialGameStep === 4) {
    const aiPlayer = gameState.players[1];
    const drawnTile = gameState.pool.splice(1, 1)[0];
    aiPlayer.rack.push(drawnTile);
    gameState.turn++;
    gameState.currentPlayerIndex = 0;
    isProcessing = false;
    tutorialGameStep = 5;
    showMessage('AI drew a tile and skipped', 'info');
    renderAll();
    afterAITurn();

  } else {
    isProcessing = false;
    afterAITurn();
  }
}

function getCurrentPlayer() {
  const idx = gameState.currentPlayerIndex;
  if (idx < 0 || idx >= gameState.players.length) return null;
  return gameState.players[idx];
}

function toggleTileSelection(id) {
  if (isProcessing || awaitingPass) return;
  SFX.click();
  if (selectedTileIds.has(id)) {
    selectedTileIds.delete(id);
  } else {
    selectedTileIds.add(id);
  }
  updateControls();
  renderAll();
}

function selectBoardGroup(idx) {
  if (isProcessing || awaitingPass) return;
  if (selectedGroupIdx === idx) {
    selectedGroupIdx = -1;
  } else {
    selectedGroupIdx = idx;
  }
  updateControls();
  renderAll();
}

function submitTurn() {
  if (isProcessing || awaitingPass) return;

  const playedIds = originalRackIds.filter(id => !pendingRack.some(t => t.id === id));
  const tilesToPlay = playedIds
    .map(id => gameState.players[gameState.currentPlayerIndex].rack.find(t => t.id === id))
    .filter(Boolean);

  const jokerReplacements = [];

  if (tilesToPlay.length === 0 && jokerReplacements.length === 0) {
    showMessage('No tiles to play or replace', 'error');
    return;
  }

  const player = gameState.players[gameState.currentPlayerIndex];
  const manipulatedGroups = pendingBoard;

  for (const group of manipulatedGroups) {
    if (group.length < 3) continue;
    const nonJokers = group.filter(t => !t.isJoker);
    if (nonJokers.length === 0) continue;
    const allSameColor = group.every(t => t.isJoker || t.color === nonJokers[0].color);
    if (allSameColor) {
      const njValSet = new Set(nonJokers.map(t => t.value));
      let firstNJIdx = -1, firstNJVal = -1;
      for (let i = 0; i < group.length; i++) {
        if (!group[i].isJoker) { firstNJIdx = i; firstNJVal = group[i].value; break; }
      }
      const base = firstNJVal - firstNJIdx;
      for (let i = 0; i < group.length; i++) {
        const expected = base + i;
        if (group[i].isJoker) {
          if (njValSet.has(expected)) {
            showMessage('Joker in an ambiguous position in a run', 'error'); return;
          }
        } else if (group[i].value !== expected) {
          showMessage('Run groups must be in ascending order', 'error'); return;
        }
      }
    }
  }

  consecutiveEmptySkips = 0;
  const wasMelded = player.hasMelded;
  const playerIdx = gameState.currentPlayerIndex;

  const result = makeMove(gameState, tilesToPlay, manipulatedGroups, jokerReplacements);

  if (!result.success) {
    showMessage(result.errorMsg, 'error');
    return;
  }

  gameState = result.newState;
  if (gameState.mode === MODE.TWO_PLAYER) {
    gameState.currentPlayerIndex = playerIdx;
    isProcessing = true;
    awaitingPass = true;
    updateControls();
  }
  if (!wasMelded && gameState.players[playerIdx].hasMelded) {
    showThawAnimation();
  }
  pendingRack = null;
  pendingBoard = null;
  originalRackIds = null;
  selectedTileIds = new Set();
  selectedGroupIdx = -1;
  showMessage(`Played ${tilesToPlay.length} tiles (${result.scoreDelta} pts)`, 'success');

  if (isTutorialMode && awaitingJokerPlay) {
    awaitingJokerPlay = false;
    document.getElementById(ID.DRAW_BTN).disabled = false;
    const overlay = document.getElementById(ID.TUTORIAL_OVERLAY);
    overlay.classList.add(CLASS.ACTIVE);
    tutorialQueue = [...tutorialNo];
    tutorialStep = 11;
    showTutorialStep();
    return;
  }

  if (isTutorialMode) {
    if (tutorialGameStep === 1) {
      tutorialGameStep = 2;
    } else if (tutorialGameStep === 5) {
      showMessage('Tutorial complete! You mastered the basics! 🎉', 'success');
      disableTutorialMode();
      return;
    }
  }

  if (isTutorialMode && awaitingInitialMeld) {
    awaitingInitialMeld = false;
    document.getElementById(ID.DRAW_BTN).disabled = false;
    const overlay = document.getElementById(ID.TUTORIAL_OVERLAY);
    overlay.classList.add(CLASS.ACTIVE);
    tutorialQueue = [...tutorialNo];
    tutorialStep = 5;
    showTutorialStep();
    return;
  }

  const winner = checkWin(gameState);
  if (winner) {
    showGameOver(winner);
    return;
  }

  handleTurnTransition();
}

function handleTurnTransition() {
  if (gameState.mode === MODE.SINGLE || isTutorialMode || gameState.mode === MODE.TUTORIAL) {
    setTimeout(startTurn, 50);
    return;
  }

  const nextIdx = (gameState.currentPlayerIndex + 1) % gameState.players.length;
  const nextPlayer = gameState.players[nextIdx];
  const label = nextPlayer.id === PLAYER.P1 ? 'Player 1' : 'Player 2';
  document.getElementById(ID.CONTROLS).style.display = 'none';
  document.getElementById(ID.DRAW_PILE).classList.add(CLASS.DISABLED);
  document.getElementById(ID.DRAW_PILE).style.pointerEvents = 'none';
  document.getElementById(ID.DRAW_BTN).disabled = true;

  renderAll();
  const playerHand = document.querySelector('#player-hand .tile-row');
  const aiHand = document.getElementById('ai-hand');
  const playerInfo = document.getElementById('player1-info');
  const aiInfo = document.getElementById('player2-info');
  const ww = window.innerWidth;

  const flyOut = (el, tx) => {
    if (!el) return Promise.resolve();
    const rect = el.getBoundingClientRect();
    const startX = rect.left;
    return el.animate([
      { transform: 'translateX(0)', opacity: 1 },
      { transform: `translateX(${tx - startX}px)`, opacity: 0 }
    ], { duration: 300, easing: 'ease-in', fill: 'forwards' }).finished;
  };

  isTransitioning = true;
  SFX.whoosh();
  Promise.all([
    flyOut(playerHand, ww + 200),
    flyOut(aiHand, -(ww + 200)),
    flyOut(playerInfo, ww + 200),
    flyOut(aiInfo, -(ww + 200))
  ]).then(() => {
    isTransitioning = false;
    [playerHand, aiHand, playerInfo, aiInfo].forEach(el => {
      if (el) { el.getAnimations().forEach(a => a.cancel()); el.style.transform = ''; el.style.opacity = ''; }
    });

    const hiddenStyle = document.createElement('style');
    hiddenStyle.id = 'pass-hidden-style';
    hiddenStyle.textContent = '#player-hand .tile-row,#ai-hand,#player1-info,#player2-info{opacity:0!important;transform:translateX(0)!important}';
    document.head.appendChild(hiddenStyle);

    showMessage(`Pass the device to ${nextPlayer.id}`, 'info');

    const passOverlay = document.createElement('div');
    passOverlay.id = 'pass-overlay';
    passOverlay.style.textAlign = 'center';
    passOverlay.innerHTML = `
      <button id="pass-btn" style="margin:10px auto;padding:14px 38px;font-family:'Press Start 2P',monospace;font-size:0.78rem;text-transform:uppercase;border:none;color:#F3E9CA;cursor:pointer;background:url('assets/button.png') no-repeat center/100% 100%;text-shadow:2px 2px 0 rgba(0,0,0,0.5);letter-spacing:1px;transition:transform 0.1s,filter 0.1s">
        PASS TO ${label}
      </button>`;
    const playerArea = document.getElementById(ID.PLAYER_AREA);
    if (playerArea) {
      playerArea.parentNode.insertBefore(passOverlay, playerArea);
    } else {
      document.getElementById(ID.GAME_SCREEN).appendChild(passOverlay);
    }

    const passBtn = document.getElementById(ID.PASS_BTN);
    passBtn.addEventListener('click', () => {
      SFX.button();
      isTransitioning = true;
      passBtn.style.pointerEvents = 'none';
      passOverlay.remove();
      const hs = document.getElementById(ID.PASS_HIDDEN_STYLE);
      if (hs) hs.remove();
      document.getElementById(ID.DRAW_PILE).classList.remove(CLASS.DISABLED);
      document.getElementById(ID.DRAW_PILE).style.pointerEvents = '';
      document.getElementById(ID.DRAW_BTN).disabled = false;
      gameState.currentPlayerIndex = nextIdx;
      document.getElementById(ID.CONTROLS).style.display = '';

      const current = gameState.players[nextIdx];
      pendingRack = JSON.parse(JSON.stringify(current.rack));
      pendingBoard = JSON.parse(JSON.stringify(gameState.board));
      originalRackIds = current.rack.map(t => t.id);
      selectedTileIds = new Set();
      selectedGroupIdx = -1;

      renderAll();
      updateFrozenState();

      const ww = window.innerWidth;
      const newPlayerHand = document.querySelector('#player-hand .tile-row');
      const newAiHand = document.getElementById('ai-hand');
      const newPlayerInfo = document.getElementById('player1-info');
      const newAiInfo = document.getElementById('player2-info');

      const flyIn = (el, fromX) => {
        if (!el) return;
        el.style.transform = `translateX(${fromX}px)`;
        requestAnimationFrame(() => {
          el.style.transition = 'transform 300ms ease-out, opacity 300ms ease-out';
          el.style.transform = 'translateX(0)';
          el.style.opacity = '1';
        });
      };

      requestAnimationFrame(() => {
        if (newPlayerHand) newPlayerHand.style.transform = `translateX(${-(ww + 200)}px)`;
        if (newAiHand) newAiHand.style.transform = `translateX(${ww + 200}px)`;
        if (newPlayerInfo) newPlayerInfo.style.transform = `translateX(${-(ww + 200)}px)`;
        if (newAiInfo) newAiInfo.style.transform = `translateX(${ww + 200}px)`;
        requestAnimationFrame(() => {
          flyIn(newPlayerHand, -(ww + 200));
          flyIn(newAiHand, ww + 200);
          flyIn(newPlayerInfo, -(ww + 200));
          flyIn(newAiInfo, ww + 200);
          setTimeout(() => {
            [newPlayerHand, newAiHand, newPlayerInfo, newAiInfo].forEach(el => {
              if (el) { el.style.transition = ''; el.style.transform = ''; el.style.opacity = ''; }
            });
            isTransitioning = false;
            awaitingPass = false;
            isProcessing = false;
            updateControls();
            showMessage(`Your turn, ${current.id}!${current.hasMelded ? '' : ' (Need 30+ points for initial meld)'}`, 'info');
          }, 350);
        });
      });
    });
    passBtn.addEventListener('mouseover', function() {
      this.style.transform = 'scale(1.03)';
      this.style.filter = 'brightness(1.2)';
    });
    passBtn.addEventListener('mouseout', function() {
      this.style.transform = '';
      this.style.filter = '';
    });
    passBtn.addEventListener('mousedown', function() {
      this.style.transform = 'scale(0.97)';
    });
    passBtn.addEventListener('mouseup', function() {
      this.style.transform = '';
    });
  });
}

function cancelTurn() {
  if (isProcessing || awaitingPass) return;
  const player = gameState.players[gameState.currentPlayerIndex];
  pendingRack = JSON.parse(JSON.stringify(player.rack));
  pendingBoard = JSON.parse(JSON.stringify(gameState.board));
  selectedTileIds = new Set();
  selectedGroupIdx = -1;
  dragData = null;
  updateControls();
  renderAll();
  showMessage('Turn cancelled', 'info');
}

function drawAndSkip() {
  if (isProcessing || isTransitioning || awaitingPass || isAnimatingDraw) return;

  if (originalRackIds && originalRackIds.length > pendingRack.length) {
    showMessage('You have pending plays. Cancel or submit first.', 'error');
    return;
  }

  if (isTutorialMode) {
    if (tutorialGameStep === 1 || tutorialGameStep === 5) {
      showMessage('Complete the required move first!', 'error');
      return;
    }
    if (awaitingInitialMeld || awaitingJokerPlay) {
      showMessage('Complete the required move first!', 'error');
      return;
    }
  }

  const pile = document.getElementById(ID.DRAW_PILE);
  if (pile.classList.contains(CLASS.DISABLED)) return;

  if (isTutorialMode && tutorialGameStep === 3) {
    const state = JSON.parse(JSON.stringify(gameState));
    const player = state.players[0];
    const jokerTile = state.pool.splice(0, 1)[0];
    player.rack.push(jokerTile);
    state.turn++;
    state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
    gameState = state;
    pendingRack = null;
    pendingBoard = null;
    originalRackIds = null;
    selectedTileIds = new Set();
    selectedGroupIdx = -1;
    consecutiveEmptySkips = 0;
    tutorialGameStep = 4;

    showBarrage('SKIP', '#f39c12', 'bottom');

    if (awaitingDraw) {
      awaitingDraw = false;
      const overlay = document.getElementById(ID.TUTORIAL_OVERLAY);
      overlay.classList.add(CLASS.ACTIVE);
      tutorialQueue = [...tutorialNo];
      tutorialStep = 10;
      showTutorialStep();
    }

    renderAll();
    handleTurnTransition();
    return;
  }

  animateDraw(() => {
    showBarrage('SKIP', '#f39c12', 'bottom');
    const prevRackLen = gameState.players[0].rack.length;
    const result = skipAndDraw(gameState);
    const prevIdx = gameState.currentPlayerIndex;
    gameState = result.newState;
    if (gameState.mode === MODE.TWO_PLAYER) {
      gameState.currentPlayerIndex = prevIdx;
    }
    pendingRack = null;
    pendingBoard = null;
    originalRackIds = null;
    selectedTileIds = new Set();
    selectedGroupIdx = -1;

    if (result.drawnTile) {
      _justDrewTileId = result.drawnTile.id;
    }

    if (!result.drawnTile) {
      consecutiveEmptySkips++;
      if (consecutiveEmptySkips >= gameState.players.length) {
        const scores = gameState.players.map(p => ({
          id: p.id,
          score: p.rack.reduce((s, t) => s + (t.isJoker ? 30 : t.value), 0)
        }));
        scores.sort((a, b) => a.score - b.score);
        showMessage(`Pool empty - ${scores[0].id} wins with ${scores[0].score} points!`, 'success');
        setTimeout(() => showGameOver(scores[0].id), 1500);
        return;
      }
      showMessage(`Pool is empty, skipped (${consecutiveEmptySkips}/${gameState.players.length})`, 'info');
    } else {
      consecutiveEmptySkips = 0;
      showMessage('Drew a tile and skipped', 'info');
    }

    const winner = checkWin(gameState);
    if (winner) {
      showGameOver(winner);
      return;
    }

    renderAll();
    try {
      handleTurnTransition();
    } catch (_) {
      setTimeout(startTurn, 100);
    }
  });
}

function animateDraw(callback, targetElId) {
  if (isAnimatingDraw) return;
  isAnimatingDraw = true;
  SFX.draw();

  const targetId = targetElId || 'rack-tiles';
  const pile = document.getElementById(ID.DRAW_PILE);
  const target = document.getElementById(targetId);
  if (!target) { isAnimatingDraw = false; callback(); return; }
  const pileRect = pile.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();

  const startX = pileRect.left + pileRect.width / 2 - 24;
  const startY = pileRect.top + pileRect.height / 2 - 32;
  const endX = targetRect.right - 48;
  const endY = targetRect.top + targetRect.height / 2 - 32;

  const flyCard = document.createElement('div');
  flyCard.className = 'flying-card';
  flyCard.style.left = startX + 'px';
  flyCard.style.top = startY + 'px';
  document.body.appendChild(flyCard);

  const dx = endX - startX;
  const dy = endY - startY;

  pile.style.transition = 'none';
  pile.style.transform = 'scale(0.95)';
  requestAnimationFrame(() => {
    pile.style.transition = 'transform 0.08s steps(4)';
    pile.style.transform = 'scale(1.05)';
  });
  setTimeout(() => {
    pile.style.transform = 'scale(1)';
  }, 200);

  const flyAnim = flyCard.animate([
    { transform: 'translate(0, 0) rotateY(0deg)', offset: 0 },
    { transform: `translate(${dx * 0.4}px, ${dy * 0.3}px) rotateY(90deg)`, offset: 0.4 },
    { transform: `translate(${dx * 0.8}px, ${dy * 0.6}px) rotateY(135deg)`, offset: 0.7 },
    { transform: `translate(${dx}px, ${dy}px) rotateY(180deg)`, offset: 1 }
  ], {
    duration: 500,
    easing: 'steps(8)',
    fill: 'forwards'
  });

  flyCard.addEventListener('animationend', () => {
    flyCard.remove();
    // fallback: also remove on finish
  });

  flyAnim.onfinish = () => {
    flyCard.remove();
    isAnimatingDraw = false;
    callback();
  };
}

function showPixelConfetti() {
  const colors = ['#e74c3c', '#3498db', '#f1c40f', '#2ecc71', '#9b59b6', '#e67e22'];
  for (let i = 0; i < 60; i++) {
    const el = document.createElement('div');
    el.className = 'pixel-confetti';
    el.style.left = Math.random() * 100 + 'vw';
    el.style.top = '-10px';
    el.style.background = colors[i % colors.length];
    el.style.width = (4 + Math.random() * 4) + 'px';
    el.style.height = (4 + Math.random() * 4) + 'px';
    document.body.appendChild(el);
    const delay = Math.random() * 1000;
    const duration = 1500 + Math.random() * 1500;
    el.animate([
      { transform: `translate(0, 0) rotate(0deg)`, opacity: 1 },
      { transform: `translate(${(-100 + Math.random() * 200)}px, ${300 + Math.random() * 400}px) rotate(${Math.random() * 720}deg)`, opacity: 0 }
    ], { duration, delay, easing: 'steps(20)', fill: 'forwards' }).onfinish = () => el.remove();
  }
}

function showGameOver(winnerId) {
  stopMusic();
  hideAllScreens();
  if (winnerId === PLAYER.P1) SFX.win(); else SFX.lose();
  document.getElementById(ID.GAMEOVER_SCREEN).style.display = 'flex';
  const label = winnerId === PLAYER.P1 ? 'Player 1' : (winnerId === PLAYER.P2 ? 'Player 2' : 'AI');
  document.getElementById(ID.WINNER_TEXT).textContent = `${label} WINS!`;
  showPixelConfetti();
}

function showBarrage(text, color, position) {
  const overlay = document.createElement('div');
  overlay.className = 'barrage-overlay' + (position ? ' ' + position : ' center');
  const el = document.createElement('div');
  el.className = 'barrage-text';
  el.textContent = text;
  el.style.color = color;
  overlay.appendChild(el);
  document.body.appendChild(overlay);
  setTimeout(() => overlay.remove(), 1500);
}

function showThawAnimation() {
  showBarrage('THAWED!', '#3498db');
}

function updateFrozenState() {
  const screen = document.getElementById(ID.GAME_SCREEN);
  if (gameState.mode === MODE.TWO_PLAYER) {
    const current = getCurrentPlayer();
    screen.classList.toggle(CLASS.FROZEN, current && !current.hasMelded);
  } else {
    const human = gameState.players[0];
    screen.classList.toggle(CLASS.FROZEN, human && !human.hasMelded);
  }
}

function renderAIHand() {
  const container = document.getElementById('ai-hand');
  if (!container || !gameState) return;
  container.innerHTML = '';
  let opponent;
  if (gameState.mode === MODE.SINGLE || isTutorialMode) {
    opponent = gameState.players[1];
  } else {
    const currentIdx = gameState.currentPlayerIndex;
    opponent = gameState.players[1 - currentIdx];
  }
  if (!opponent) return;
  for (let i = 0; i < opponent.rack.length; i++) {
    const tile = document.createElement('div');
    tile.className = 'ai-hand-tile';
    container.appendChild(tile);
  }
}

function renderAll() {
  try { updateFrozenState(); } catch (e) { console.error('updateFrozenState error:', e); }
  try { renderGameInfo(); } catch (e) { console.error('renderGameInfo error:', e); }
  try { renderAIHand(); } catch (e) { console.error('renderAIHand error:', e); }
  try { renderBoard(); } catch (e) { console.error('renderBoard error:', e); }
  try { renderRack(); } catch (e) { console.error('renderRack error:', e); }
  try { renderPending(); } catch (e) { console.error('renderPending error:', e); }
}

function renderGameInfo() {
  const current = getCurrentPlayer();
  const players = gameState.players;
  const turnEl = document.getElementById(ID.TURN_INDICATOR);
  const isTwoPlayer = gameState.mode === MODE.TWO_PLAYER;
  const isSingle = gameState.mode === MODE.SINGLE || isTutorialMode;

  const displayOrder = isTwoPlayer
    ? [current, players.find(p => p.id !== current.id)]
    : players;

  displayOrder.forEach((p, i) => {
    const infoEl = document.getElementById(i === 0 ? 'player1-info' : 'player2-info');
    const countEl = document.getElementById(i === 0 ? 'count-p1' : 'count-p2');
    const avatarEl = document.getElementById(i === 0 ? 'avatar-p1' : 'avatar-p2');
    const isCurrent = p.id === current?.id;
    if (countEl) countEl.textContent = `×${p.rack.length}`;
    if (infoEl) {
      infoEl.classList.toggle('active', isCurrent);
      infoEl.style.opacity = isCurrent ? '1' : '0.5';
    }
    if (avatarEl) {
      avatarEl.style.backgroundImage = `url('assets/${p.id === PLAYER.P1 ? 'p1' : 'p2'}.png')`;
      avatarEl.classList.toggle('avatar-opponent', !isCurrent);
    }
    const nameEl = document.getElementById(i === 0 ? 'name-p1' : 'name-p2');
    if (nameEl) {
      if (isSingle) {
        nameEl.textContent = p.id === PLAYER.P1 ? 'YOU' : 'CPU';
      } else if (isTwoPlayer) {
        nameEl.textContent = p.id === PLAYER.P1 ? 'P1' : 'P2';
      } else {
        nameEl.textContent = i === 0 ? 'P1' : 'P2';
      }
    }
  });

  if (current && turnEl) {
    const label = current.id === PLAYER.P1 ? 'Player 1' : (current.id === PLAYER.P2 ? 'Player 2' : 'AI');
    turnEl.textContent = isTutorialMode ? `Tutorial - ${label}` : `Turn: ${label}`;
  }

  const meldEl = document.getElementById(ID.MELD_STATUS);
  if (meldEl) {
    if (isTutorialMode) {
      const hints = {
        1: 'Step 1/5: Drag red 11, blue 11, yellow 11 to board → Submit',
        2: 'Step 2/5: AI plays black 10-11-12...',
        3: 'Step 3/5: No valid play → click Draw & Skip',
        4: 'Step 4/5: AI is drawing...',
        5: 'Step 5/5: Drag black 7, black 8, Joker to black group!',
      };
      meldEl.textContent = hints[tutorialGameStep] || `Step ${tutorialGameStep}/5`;
      meldEl.style.color = '#f39c12';
    } else if (current && !current.hasMelded) {
      meldEl.textContent = '⚠ Meld 30+';
    } else if (current) {
      meldEl.textContent = '✓ Melded';
    } else {
      meldEl.textContent = '';
    }
  }

  const poolEl = document.getElementById(ID.POOL_INFO);
  if (poolEl) poolEl.textContent = `Pool: ${gameState.pool.length}`;

  const pileCount = document.getElementById(ID.PILE_COUNT);
  const drawPile = document.getElementById(ID.DRAW_PILE);
  if (pileCount) pileCount.textContent = `${gameState.pool.length}`;
  if (drawPile) {
    if (gameState.pool.length === 0) {
      drawPile.classList.add(CLASS.DISABLED, CLASS.EMPTY);
    } else if (awaitingPass) {
      drawPile.classList.add(CLASS.DISABLED);
      drawPile.classList.remove(CLASS.EMPTY);
    } else {
      drawPile.classList.remove(CLASS.DISABLED, CLASS.EMPTY);
    }
  }
}

function renderBoard() {
  const container = document.getElementById(ID.BOARD_GROUPS);
  const isAiTurn = isProcessing && gameState.players[gameState.currentPlayerIndex]?.id === PLAYER.AI;
  const displayGroups = pendingBoard !== null ? pendingBoard : gameState.board;
  container.innerHTML = '';

  container.style.minHeight = '200px';

  if (!displayGroups || displayGroups.length === 0) {
    container.innerHTML = '<div class="board-empty">No tiles on the board yet</div>';
    return;
  }

  displayGroups.forEach((group, idx) => {
    const groupEl = document.createElement('div');
    groupEl.className = 'board-group';
    if (idx === selectedGroupIdx && !isAiTurn) groupEl.classList.add(CLASS.SELECTED);
    const contentValid = group.length < 3 ? false : isValidGroup(group);
    let orderValid = true;
    if (contentValid && group.length >= 3) {
      const nonJokers = group.filter(t => !t.isJoker);
      const allSameColor = nonJokers.length > 0 && group.every(t => t.isJoker || t.color === nonJokers[0].color);
      if (allSameColor) {
        const njValSet = new Set(nonJokers.map(t => t.value));
        let firstNJIdx = -1, firstNJVal = -1;
        for (let i = 0; i < group.length; i++) {
          if (!group[i].isJoker) { firstNJIdx = i; firstNJVal = group[i].value; break; }
        }
        const base = firstNJVal - firstNJIdx;
        for (let i = 0; i < group.length; i++) {
          const expected = base + i;
          if (group[i].isJoker) {
            if (njValSet.has(expected)) { orderValid = false; break; }
          } else if (group[i].value !== expected) {
            orderValid = false; break;
          }
        }
      }
    }
    const isValid = contentValid && orderValid;
    if (!isValid && pendingBoard && !isAiTurn) groupEl.classList.add(CLASS.INVALID);
    groupEl.dataset.index = idx;

    const canSelect = !isAiTurn;
    if (canSelect) groupEl.style.cursor = 'pointer';

    group.forEach(tile => {
      const jokerRepr = tile.isJoker ? getJokerRepresentation(group) : null;
      groupEl.appendChild(createTileElement(tile, { clickable: false, selected: false, jokerRepr }));
    });

    container.appendChild(groupEl);
  });
}

function renderRack() {
  const container = document.getElementById(ID.RACK_TILES);
  container.innerHTML = '';

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];

  let rack;
  if (currentPlayer?.id === PLAYER.AI) {
    rack = gameState.players[0].rack;
  } else if (pendingRack !== null) {
    rack = pendingRack;
  } else if (gameState.mode === MODE.SINGLE) {
    rack = gameState.players[0].rack;
  } else {
    rack = currentPlayer?.rack || [];
  }

  rack.forEach(tile => {
    const selected = selectedTileIds.has(tile.id);
    const el = createTileElement(tile, {
      clickable: true,
      selected,
      committed: false,
      id: tile.id,
    });
    if (_justDrewTileId !== null && tile.id === _justDrewTileId) {
      el.classList.add('tile-new');
    }
    container.appendChild(el);
  });

  if (rack.length === 0) {
    container.innerHTML = '<div class="board-empty" style="padding:10px">No tiles</div>';
  }
  _justDrewTileId = null;
}

function renderPending() {
  const container = document.getElementById(ID.PENDING_AREA);
  container.style.display = 'none';
}

function createTileElement(tile, opts = {}) {
  const div = document.createElement('div');
  const classes = ['tile'];

  if (tile.isJoker) {
    classes.push('joker');
  } else {
    classes.push(tile.color);
  }

  if (opts.selected) classes.push('selected');
  if (opts.committed) classes.push('committed');

  div.className = classes.join(' ');

  if (tile.id !== undefined) {
    div.dataset.id = String(tile.id);
  }

  if (aiFadeTileIds && tile.id !== undefined && aiFadeTileIds.has(tile.id)) {
    div.style.opacity = '0';
  }

  const isAiTurn = gameState && gameState.players[gameState.currentPlayerIndex]?.id === PLAYER.AI;
  if (!isProcessing && !isAiTurn) {
    div.draggable = true;
  }

  if (opts.clickable && opts.id !== undefined) {
    div.dataset.id = opts.id;
  }

  if (tile.isJoker) {
    const repr = opts.jokerRepr;
    if (repr) {
      const colorLabel = COLOR_LABELS[repr.color] || repr.color[0].toUpperCase();
      div.innerHTML = `<span class="tile-value"></span><span class="tile-sub">${colorLabel}${repr.value}</span>`;
    } else {
      div.innerHTML = '<span class="tile-value">?</span>';
    }
  } else {
    div.innerHTML = `<span class="tile-value">${tile.value}</span>`;
  }

  return div;
}

function updateControls() {
  if (awaitingPass) {
    document.getElementById(ID.SUBMIT_BTN).disabled = true;
    document.getElementById(ID.CANCEL_BTN).disabled = true;
    document.getElementById(ID.DRAW_BTN).disabled = true;
    const dp = document.getElementById(ID.DRAW_PILE);
    if (dp) dp.classList.add(CLASS.DISABLED);
    return;
  }
  const hasPending = pendingRack && originalRackIds && (originalRackIds.length > pendingRack.length);
  const drawDisabled = isProcessing || awaitingPass || awaitingInitialMeld || awaitingJokerPlay;
  document.getElementById(ID.SUBMIT_BTN).disabled = !hasPending || isProcessing || awaitingPass || awaitingDraw;
  document.getElementById(ID.CANCEL_BTN).disabled = !hasPending || isProcessing || awaitingPass || awaitingDraw;
  document.getElementById(ID.DRAW_BTN).disabled = drawDisabled;
  const drawPile = document.getElementById(ID.DRAW_PILE);
  if (drawPile) {
    if (drawDisabled || gameState.pool.length === 0) {
      drawPile.classList.add(CLASS.DISABLED);
    } else {
      drawPile.classList.remove(CLASS.DISABLED);
    }
  }
}

// --- Tutorial ---

const tutorialScript = [
  { emoji: '😊', text: 'Hi there! Welcome to Rummikub! Have you played this game before?', buttons: 'yesno' },
];

const tutorialYes = [
  { emoji: '🥳', text: 'Awesome! Let\'s jump right into the game then!', last: true },
];

const tutorialNo = [
  { emoji: '🥳', text: 'Great! Let me teach you the rules!' },
  { emoji: '🤔', text: 'First, the tiles. There are 4 colors: red, blue, yellow, black. Numbers 1 to 13, each twice.' },
  { emoji: '😊', text: 'Plus 2 joker tiles. They can be any number or color you need.' },
  { emoji: '🥳', text: 'Your goal: be the first to play ALL tiles from your rack. You start with 14 tiles.' },
  { emoji: '😊', text: 'Your first play must score at least 30 points. That\'s called the "initial meld". Now try putting these three tiles (red 11, blue 11, yellow 11) onto the board, then click Submit!' },
  { emoji: '😊', text: "Now it's AI's turn." },
  { emoji: '🤔', text: 'A valid group has at least 3 tiles. Two types: same number different colors, or same color consecutive numbers.' },
  { emoji: '🤔', text: 'After your initial meld, you can rearrange tiles on the table. Add, split, move – as long as every group stays valid.' },
  { emoji: '😮', text: "Oh no! It looks like you don't have any tiles to submit. If you cannot play any tile, you must draw one tile from the pool. Then your turn ends." },
  { emoji: '🥳', text: "Click the draw pile on the far right to draw a tile." },
  { emoji: '🥳', text: "You drew a Joker! If you have a tile that matches what the Joker represents, you can replace it and take the Joker. Now try using the Joker to make a valid group!" },
  { emoji: '🥳', text: 'The first player to empty their rack wins! That\'s all the rules. Ready to play?', last: true },
];

let tutorialQueue = [];
let tutorialStep = 0;

function startTutorial() {
  const overlay = document.getElementById(ID.TUTORIAL_OVERLAY);
  overlay.classList.add(CLASS.ACTIVE);
  tutorialQueue = [...tutorialScript];
  tutorialStep = 0;
  showTutorialStep();
}

function showTutorialStep() {
  if (tutorialStep >= tutorialQueue.length) {
    endTutorial();
    return;
  }

  const dialog = document.getElementById(ID.TUTORIAL_DIALOG);
  dialog.classList.toggle('tutorial-tile-step', tutorialStep === 1 || tutorialStep === 2);

  const step = tutorialQueue[tutorialStep];
  const emojiMap = { '😊': 'normal', '🥳': 'happy', '😮': 'surprised', '🤔': 'thinking' };
  document.getElementById('tutorial-emoji').src = 'assets/' + (emojiMap[step.emoji] || 'normal') + '.png';
  document.getElementById(ID.TUTORIAL_TEXT).textContent = step.text;

  const avatar = document.getElementById('tutorial-avatar');
  avatar.classList.remove('boing');
  void avatar.offsetWidth;
  avatar.classList.add('boing');

  const existingGrid = document.getElementById(ID.TUTORIAL_TILE_GRID);
  if (existingGrid) existingGrid.remove();

  const overlay = document.getElementById(ID.TUTORIAL_OVERLAY);
  overlay.classList.remove('has-spotlight');
  overlay.style.removeProperty('--spotlight-x');
  overlay.style.removeProperty('--spotlight-y');
  overlay.style.removeProperty('--spotlight-w');
  overlay.style.removeProperty('--spotlight-h');

  if (tutorialStep === 1 || tutorialStep === 2) {
    const grid = document.createElement('div');
    grid.id = 'tutorial-tile-grid';
    if (tutorialStep === 2) grid.classList.add('joker-focus');

    const colors = ['red', 'blue', 'yellow', 'black'];
    const colorLabels = { red: 'R', blue: 'B', yellow: 'Y', black: 'K' };

    for (const color of colors) {
      const row = document.createElement('div');
      row.className = 'tutorial-tile-row';
      const label = document.createElement('span');
      label.className = 'tutorial-tile-label';
      label.textContent = colorLabels[color];
      row.appendChild(label);
      for (let value = 1; value <= 13; value++) {
        const tile = document.createElement('div');
        tile.className = `tutorial-tile ${color}`;
        tile.textContent = value;
        row.appendChild(tile);
      }
      grid.appendChild(row);
    }

    const jokerRow = document.createElement('div');
    jokerRow.className = 'tutorial-tile-row';
    const jokerLabel = document.createElement('span');
    jokerLabel.className = 'tutorial-tile-label';
    jokerLabel.textContent = '?';
    jokerRow.appendChild(jokerLabel);
    for (let i = 0; i < 2; i++) {
      const tile = document.createElement('div');
      tile.className = 'tutorial-tile joker';
      tile.textContent = '?';
      jokerRow.appendChild(tile);
    }
    grid.appendChild(jokerRow);

    document.getElementById(ID.TUTORIAL_CONTENT).insertBefore(grid, document.getElementById(ID.TUTORIAL_BUTTONS));
  }

  if (tutorialStep === 3 | tutorialStep === 7) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const sw = 900, sh = 90, bottom = 10;
    const offsetFromCenter = 30;
    overlay.classList.add(CLASS.HAS_SPOTLIGHT);
    overlay.style.setProperty('--spotlight-x', ((w - sw) / 2 + offsetFromCenter ) + 'px');
    overlay.style.setProperty('--spotlight-y', (h - sh - bottom) + 'px');
    overlay.style.setProperty('--spotlight-w', sw + 'px');
    overlay.style.setProperty('--spotlight-h', sh + 'px');
  }

  if (tutorialStep === 4) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const sw = 200, sh = 90, bottom = 10;
    overlay.classList.add(CLASS.HAS_SPOTLIGHT);
    const offsetFromCenter = -320;
    overlay.style.setProperty('--spotlight-x', ((w - sw) / 2 + offsetFromCenter) + 'px');
    overlay.style.setProperty('--spotlight-y', (h - sh - bottom) + 'px');
    overlay.style.setProperty('--spotlight-w', sw + 'px');
    overlay.style.setProperty('--spotlight-h', sh + 'px');
  }

  if (tutorialStep === 6) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const sw = 400, sh = 90, top = 90;
    overlay.classList.add(CLASS.HAS_SPOTLIGHT);
    const offsetFromCenter = -540;
    overlay.style.setProperty('--spotlight-x', ((w - sw) / 2 + offsetFromCenter) + 'px');
    overlay.style.setProperty('--spotlight-y', top + 'px');
    overlay.style.setProperty('--spotlight-w', sw + 'px');
    overlay.style.setProperty('--spotlight-h', sh + 'px');

  }

  if (tutorialStep === 9) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const sw = 100, sh = 120, right = 10;
    overlay.classList.add(CLASS.HAS_SPOTLIGHT);
    overlay.style.setProperty('--spotlight-x', (w - sw - right) + 'px');
    overlay.style.setProperty('--spotlight-y', ((h - sh) / 2) + 'px');
    overlay.style.setProperty('--spotlight-w', sw + 'px');
    overlay.style.setProperty('--spotlight-h', sh + 'px');
  }

  if (tutorialStep === 10) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const sw = 80, sh = 90, bottom = 10;
    overlay.classList.add(CLASS.HAS_SPOTLIGHT);
    const offsetFromCenter = 370;
    overlay.style.setProperty('--spotlight-x', ((w - sw) / 2 + offsetFromCenter) + 'px');
    overlay.style.setProperty('--spotlight-y', (h - sh - bottom) + 'px');
    overlay.style.setProperty('--spotlight-w', sw + 'px');
    overlay.style.setProperty('--spotlight-h', sh + 'px');
  }


  const btnContainer = document.getElementById(ID.TUTORIAL_BUTTONS);
  btnContainer.innerHTML = '';

  if (step.buttons === 'yesno') {
    const yesBtn = document.createElement('button');
    yesBtn.className = 'tut-btn-primary';
    yesBtn.textContent = 'Yes';
    yesBtn.addEventListener('click', () => {
      SFX.button();
      tutorialQueue = [...tutorialYes];
      tutorialStep = 0;
      showTutorialStep();
    });
    const noBtn = document.createElement('button');
    noBtn.className = 'tut-btn-secondary';
    noBtn.textContent = 'No';
    noBtn.addEventListener('click', () => {
      SFX.button();
      endTutorial();
      startTutorialGame();
      const overlay = document.getElementById(ID.TUTORIAL_OVERLAY);
      overlay.classList.add(CLASS.ACTIVE);
      tutorialQueue = [...tutorialNo];
      tutorialStep = 0;
      showTutorialStep();
    });
    btnContainer.appendChild(yesBtn);
    btnContainer.appendChild(noBtn);
  } else {
    const nextBtn = document.createElement('button');
    nextBtn.className = 'tut-btn-primary';
    nextBtn.textContent = step.startGame ? "Let's Play! 🎮" : (step.last ? "Let's Play! 🎮" : 'Next ➡');
    nextBtn.addEventListener('click', () => {
      SFX.button();
      if (step.startGame) {
        endTutorial();
        startTutorialGame();
      } else if (step.last) {
        disableTutorialMode();
      } else if (tutorialStep === 5) {
        endTutorial();
        gameState.currentPlayerIndex = 1;
        startTurn();
      } else if (tutorialStep === 9) {
        endTutorial();
        awaitingDraw = true;
      } else if (tutorialStep === 10) {
        endTutorial();
        awaitingJokerPlay = true;
        document.getElementById(ID.DRAW_BTN).disabled = true;
        updateControls();
        renderAll();
      } else if (tutorialStep === 4) {
        endTutorial();
        awaitingInitialMeld = true;
        document.getElementById(ID.DRAW_BTN).disabled = true;
        updateControls();
        renderAll();
      } else {
        tutorialStep++;
        showTutorialStep();
      }
    });
    btnContainer.appendChild(nextBtn);
  }
}

function endTutorial() {
  const overlay = document.getElementById(ID.TUTORIAL_OVERLAY);
  overlay.classList.remove('active');
  overlay.classList.remove('has-spotlight');
  const extra = document.getElementById('spotlight-hole-2');
  if (extra) extra.remove();
  tutorialQueue = [];
  tutorialStep = 0;
}

function disableTutorialMode() {
  endTutorial();

  isTutorialMode = false;
  tutorialGameStep = 1;
  awaitingInitialMeld = false;
  awaitingDraw = false;
  awaitingJokerPlay = false;
  showAIPlayComplete = false;

  if (gameState) {
    gameState.mode = 'single';
    gameState.difficulty = 'normal';
  }

  selectedTileIds = new Set();
  selectedGroupIdx = -1;
  dragData = null;

  updateControls();
  renderAll();

  if (gameState) {
    const current = gameState.players[gameState.currentPlayerIndex];
    if (current?.id === PLAYER.AI) {
      isProcessing = false;
      startTurn();
    } else if (current?.id === PLAYER.P1) {
      gameState.currentPlayerIndex = 1;
      isProcessing = false;
      startTurn();
    }
  }
}


// Show tutorial on page load (delayed so DOM is ready)
setTimeout(startTutorial, 200);

function showMessage(msg, type = 'info') {
  const el = document.getElementById(ID.MESSAGE_AREA);
  el.textContent = msg;
  el.className = type;
  el.style.display = 'block';

  if (type !== 'error') {
    setTimeout(() => { el.style.display = 'none'; }, 3000);
  }
}
