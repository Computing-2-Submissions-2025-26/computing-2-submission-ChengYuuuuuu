import { initGame, makeMove, skipAndDraw, checkWin, isValidGroup, getAIMove, getJokerRepresentation, sortGroup } from './rummikub-game.js';

const COLOR_LABELS = { red: 'R', blue: 'B', yellow: 'Y', black: 'K' };

let gameState = null;
let pendingRack = null;
let pendingBoard = null;
let originalRackIds = null;
let selectedTileIds = new Set();
let selectedGroupIdx = -1;
let isProcessing = false;
let dragData = null;
let consecutiveEmptySkips = 0;

setupEventListeners();
showStartScreen();

function showStartScreen() {
  hideAllScreens();
  document.getElementById('start-screen').style.display = 'block';
}

function hideAllScreens() {
  document.getElementById('start-screen').style.display = 'none';
  document.getElementById('game-screen').style.display = 'none';
  document.getElementById('gameover-screen').style.display = 'none';
}

function setupEventListeners() {
  document.querySelector('.mode-buttons').addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const mode = btn.dataset.mode;
    const difficulty = btn.dataset.difficulty || null;
    startGame(mode, difficulty);
  });

  document.getElementById('new-game-btn').addEventListener('click', showStartScreen);
  document.getElementById('play-again-btn').addEventListener('click', showStartScreen);

  document.getElementById('submit-btn').addEventListener('click', submitTurn);
  document.getElementById('cancel-btn').addEventListener('click', cancelTurn);
  document.getElementById('draw-btn').addEventListener('click', drawAndSkip);

  document.getElementById('board-groups').addEventListener('click', e => {
    const groupEl = e.target.closest('.board-group');
    if (!groupEl) return;
    const idx = parseInt(groupEl.dataset.index, 10);
    if (!isNaN(idx)) {
      selectBoardGroup(idx);
    }
  });

  document.getElementById('rack-tiles').addEventListener('click', e => {
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
  document.getElementById('board-groups').addEventListener('dragover', handleDragOver);
  document.getElementById('board-groups').addEventListener('drop', handleBoardDrop);
  document.getElementById('board-groups').addEventListener('dragenter', handleGroupDragEnter);
  document.getElementById('board-groups').addEventListener('dragleave', handleGroupDragLeave);
  document.getElementById('rack-tiles').addEventListener('dragover', handleDragOver);
  document.getElementById('rack-tiles').addEventListener('drop', handleRackDrop);
  document.getElementById('rack-tiles').addEventListener('dragenter', () => {
    if (dragData && dragData.sourceType === 'board') {
      document.getElementById('rack-tiles').classList.add('drag-over-rack');
    }
  });
  document.getElementById('rack-tiles').addEventListener('dragleave', e => {
    if (e.target === document.getElementById('rack-tiles') || !e.currentTarget.contains(e.relatedTarget)) {
      document.getElementById('rack-tiles').classList.remove('drag-over-rack');
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
  if (!tileEl || isProcessing) return;
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
  document.getElementById('board-groups').classList.add('drag-active');
}

function handleDragEnd() {
  document.querySelectorAll('.tile.dragging').forEach(el => el.classList.remove('dragging'));
  document.querySelectorAll('.board-group.drop-valid, .board-group.drop-invalid').forEach(el => {
    el.classList.remove('drop-valid', 'drop-invalid');
  });
  document.getElementById('board-groups').classList.remove('drag-active');
  document.getElementById('rack-tiles').classList.remove('drag-over-rack');
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
  if (!dragData) return;
  const { tileIds, tiles, sourceType, sourceGroupIdx } = dragData;

  const groupEl = e.target.closest('.board-group');
  if (groupEl) {
    const targetIdx = parseInt(groupEl.dataset.index, 10);
    if (isNaN(targetIdx)) return;
    const insertAt = getInsertIndex(groupEl, e.clientX);
    performGroupDrop(tileIds, sourceType, sourceGroupIdx, tiles, targetIdx, insertAt);
  } else if (e.currentTarget === document.getElementById('board-groups')) {
    performNewGroupDrop(tileIds, sourceType, sourceGroupIdx, tiles);
  }
}

function performGroupDrop(tileIds, sourceType, sourceGroupIdx, tiles, targetIdx, insertAt) {
  const idSet = new Set(tileIds);
  if (sourceType === 'board' && sourceGroupIdx === targetIdx) {
    const group = pendingBoard[sourceGroupIdx];
    const filtered = group.filter(t => !idSet.has(t.id));
    pendingBoard[sourceGroupIdx] = sortGroup([...filtered.slice(0, insertAt), ...tiles, ...filtered.slice(insertAt)]);
    afterTileMove();
    return;
  }

  commitTileMove(tileIds, sourceType, sourceGroupIdx, targetIdx, sortGroup(
    [...pendingBoard[targetIdx].slice(0, insertAt), ...tiles, ...pendingBoard[targetIdx].slice(insertAt)]
  ));
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
  pendingBoard = pendingBoard.filter(g => g.length > 0).map(g => sortGroup(g));
  selectedTileIds.clear();
  selectedGroupIdx = -1;
  updateControls();
  renderAll();
  if (dragData && !skipMsg) {
    const msg = dragData.sourceType === 'rack' ? 'Tile played' : 'Tile moved';
    showMessage(msg, 'success');
  }
  dragData = null;
}

function handleRackDrop(e) {
  e.preventDefault();
  if (!dragData) return;
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

function startGame(mode, difficulty) {
  gameState = initGame(mode, difficulty);
  hideAllScreens();
  document.getElementById('game-screen').style.display = 'flex';
  document.getElementById('gameover-screen').style.display = 'none';
  selectedTileIds = new Set();
  selectedGroupIdx = -1;
  isProcessing = false;
  consecutiveEmptySkips = 0;
  startTurn();
}

function startTurn() {
  const player = gameState.players[gameState.currentPlayerIndex];
  if (!player) return;

  if (player.id === 'AI') {
    isProcessing = true;
    renderAll();
    setTimeout(() => doAITurn(), 600);
    return;
  }

  isProcessing = false;
  pendingRack = null;
  pendingBoard = null;
  originalRackIds = null;
  dragData = null;

  const passOverlay = document.getElementById('pass-overlay');
  if (passOverlay) passOverlay.remove();
  document.getElementById('controls').style.display = '';

  const current = gameState.players[gameState.currentPlayerIndex];
  pendingRack = JSON.parse(JSON.stringify(current.rack));
  pendingBoard = JSON.parse(JSON.stringify(gameState.board));
  originalRackIds = current.rack.map(t => t.id);
  selectedTileIds = new Set();
  selectedGroupIdx = -1;

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

      pendingBoard = JSON.parse(JSON.stringify(newGameState.board));
      renderAll();
      showMessage('AI rearranges board...', 'info');

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
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                el.style.transition = 'transform 0.5s ease';
                el.style.transform = '';
              });
            });
          }
        } else {
          el.style.opacity = '0';
          el.style.transition = 'opacity 0.5s ease';
          requestAnimationFrame(() => {
            el.style.opacity = '';
          });
        }
      });

      setTimeout(() => {
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
      }, 600);
    }, 500);
  }, 400);
}

function doAITurn() {
  try {
    const aiMove = getAIMove(gameState);

    if (aiMove.action === 'draw') {
      const result = skipAndDraw(gameState);
      gameState = result.newState;
      isProcessing = false;
      afterAITurn();
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

function getCurrentPlayer() {
  const idx = gameState.currentPlayerIndex;
  if (idx < 0 || idx >= gameState.players.length) return null;
  return gameState.players[idx];
}

function toggleTileSelection(id) {
  if (isProcessing) return;
  if (selectedTileIds.has(id)) {
    selectedTileIds.delete(id);
  } else {
    selectedTileIds.add(id);
  }
  updateControls();
  renderAll();
}

function selectBoardGroup(idx) {
  if (isProcessing) return;
  if (selectedGroupIdx === idx) {
    selectedGroupIdx = -1;
  } else {
    selectedGroupIdx = idx;
  }
  updateControls();
  renderAll();
}

function submitTurn() {
  if (isProcessing) return;

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
  let manipulatedGroups;
  if (!player.hasMelded) {
    const playedIdsSet = new Set(tilesToPlay.map(t => t.id));
    manipulatedGroups = pendingBoard.filter(group =>
      group.some(t => playedIdsSet.has(t.id))
    );
  } else {
    manipulatedGroups = pendingBoard;
  }

  consecutiveEmptySkips = 0;

  const result = makeMove(gameState, tilesToPlay, manipulatedGroups, jokerReplacements);

  if (!result.success) {
    showMessage(result.errorMsg, 'error');
    return;
  }

  gameState = result.newState;
  pendingRack = null;
  pendingBoard = null;
  originalRackIds = null;
  selectedTileIds = new Set();
  selectedGroupIdx = -1;
  showMessage(`Played ${tilesToPlay.length} tiles (${result.scoreDelta} pts)`, 'success');

  const winner = checkWin(gameState);
  if (winner) {
    showGameOver(winner);
    return;
  }

  handleTurnTransition();
}

function handleTurnTransition() {
  const nextPlayer = gameState.players[gameState.currentPlayerIndex];
  if (gameState.mode === 'single') {
    setTimeout(startTurn, 50);
  } else {
    renderAll();
    showMessage(`Pass the device to ${nextPlayer.id}`, 'info');
    document.getElementById('controls').style.display = 'none';

    const passOverlay = document.createElement('div');
    passOverlay.id = 'pass-overlay';
    passOverlay.style.textAlign = 'center';
    const label = nextPlayer.id === 'player1' ? 'Player 1' : 'Player 2';
    passOverlay.innerHTML = `
      <button id="pass-btn" style="margin:10px auto;padding:14px 40px;font-size:1.2rem;border-color:#f39c12;color:#f39c12;background:transparent;border-radius:8px;cursor:pointer">
        Pass to ${label}
      </button>`;
    document.getElementById('game-screen').appendChild(passOverlay);

    document.getElementById('pass-btn').addEventListener('click', () => {
      startTurn();
    });
    document.getElementById('pass-btn').addEventListener('mouseover', function() {
      this.style.background = '#f39c12';
      this.style.color = '#1a1a2e';
    });
    document.getElementById('pass-btn').addEventListener('mouseout', function() {
      this.style.background = 'transparent';
      this.style.color = '#f39c12';
    });
  }
}

function cancelTurn() {
  if (isProcessing) return;
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
  if (isProcessing) return;

  if (originalRackIds && originalRackIds.length > pendingRack.length) {
    showMessage('You have pending plays. Cancel or submit first.', 'error');
    return;
  }

  const result = skipAndDraw(gameState);
  gameState = result.newState;
  pendingRack = null;
  pendingBoard = null;
  originalRackIds = null;
  selectedTileIds = new Set();
  selectedGroupIdx = -1;

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
}

function showGameOver(winnerId) {
  hideAllScreens();
  document.getElementById('gameover-screen').style.display = 'flex';
  const label = winnerId === 'player1' ? 'Player 1' : (winnerId === 'player2' ? 'Player 2' : 'AI');
  document.getElementById('winner-text').textContent = `${label} wins!`;
}

function renderAll() {
  try { renderGameInfo(); } catch (e) { console.error('renderGameInfo error:', e); }
  try { renderBoard(); } catch (e) { console.error('renderBoard error:', e); }
  try { renderRack(); } catch (e) { console.error('renderRack error:', e); }
  try { renderPending(); } catch (e) { console.error('renderPending error:', e); }
}

function renderGameInfo() {
  const current = getCurrentPlayer();
  const players = gameState.players;
  const turnEl = document.getElementById('turn-indicator');

  const isSingle = gameState.mode === 'single';
  players.forEach((p, i) => {
    const infoEl = document.getElementById(i === 0 ? 'player1-info' : 'player2-info');
    const countEl = document.getElementById(i === 0 ? 'count-p1' : 'count-p2');
    const avatarEl = document.getElementById(i === 0 ? 'avatar-p1' : 'avatar-p2');
    if (countEl) countEl.textContent = `${p.rack.length}`;
    if (infoEl) {
      const isCurrent = p.id === current?.id;
      infoEl.style.opacity = isCurrent ? '1' : '0.5';
      const color = p.id === 'player1' ? '#3498db' : (p.id === 'AI' ? '#e67e22' : '#e74c3c');
      infoEl.style.borderColor = isCurrent ? color : 'transparent';
    }
    if (avatarEl) {
      avatarEl.style.background = p.id === 'player1' ? '#3498db' : (p.id === 'AI' ? '#e67e22' : '#e74c3c');
      if (isSingle) {
        avatarEl.textContent = i === 0 ? 'You' : 'CPU';
      } else {
        avatarEl.textContent = i === 0 ? 'P1' : 'P2';
      }
    }
  });

  if (current) {
    const label = current.id === 'player1' ? 'Player 1' : (current.id === 'player2' ? 'Player 2' : 'AI');
    turnEl.textContent = `Turn: ${label}`;
  }

  const meldEl = document.getElementById('meld-status');
  if (current && !current.hasMelded) {
    meldEl.textContent = '⚠ Meld 30+';
  } else if (current) {
    meldEl.textContent = '✓ Melded';
  } else {
    meldEl.textContent = '';
  }

  document.getElementById('pool-info').textContent = `Pool: ${gameState.pool.length}`;
}

function renderBoard() {
  const container = document.getElementById('board-groups');
  const isAiTurn = isProcessing && gameState.players[gameState.currentPlayerIndex]?.id === 'AI';
  const displayGroups = pendingBoard !== null ? pendingBoard : gameState.board;
  container.innerHTML = '';

  if (!displayGroups || displayGroups.length === 0) {
    container.innerHTML = '<div class="board-empty">No tiles on the board yet</div>';
    return;
  }

  displayGroups.forEach((group, idx) => {
    const groupEl = document.createElement('div');
    groupEl.className = 'board-group';
    if (idx === selectedGroupIdx && !isAiTurn) groupEl.classList.add('selected');
    const isValid = group.length < 3 ? false : isValidGroup(group);
    if (!isValid && pendingBoard && !isAiTurn) groupEl.classList.add('invalid');
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
  const container = document.getElementById('rack-tiles');
  container.innerHTML = '';

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];

  let rack;
  if (currentPlayer?.id === 'AI') {
    rack = gameState.players[0].rack;
  } else if (pendingRack !== null) {
    rack = pendingRack;
  } else if (gameState.mode === 'single') {
    rack = gameState.players[0].rack;
  } else {
    rack = currentPlayer?.rack || [];
  }

  rack.forEach(tile => {
    const selected = selectedTileIds.has(tile.id);
    container.appendChild(createTileElement(tile, {
      clickable: true,
      selected,
      committed: false,
      id: tile.id,
    }));
  });

  if (rack.length === 0) {
    container.innerHTML = '<div class="board-empty" style="padding:10px">No tiles</div>';
  }
}

function renderPending() {
  const container = document.getElementById('pending-area');
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

  const isAiTurn = gameState && gameState.players[gameState.currentPlayerIndex]?.id === 'AI';
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
      div.innerHTML = `<span class="tile-value">★</span><span class="tile-sub">${colorLabel}${repr.value}</span>`;
    } else {
      div.innerHTML = '<span class="tile-value">★</span>';
    }
  } else {
    div.innerHTML = `<span class="tile-value">${tile.value}</span>`;
  }

  return div;
}

function updateControls() {
  const hasPending = pendingRack && originalRackIds && (originalRackIds.length > pendingRack.length);
  document.getElementById('submit-btn').disabled = !hasPending || isProcessing;
  document.getElementById('cancel-btn').disabled = !hasPending || isProcessing;
  document.getElementById('draw-btn').disabled = isProcessing;
}

function showMessage(msg, type = 'info') {
  const el = document.getElementById('message-area');
  el.textContent = msg;
  el.className = type;
  el.style.display = 'block';

  if (type !== 'error') {
    setTimeout(() => { el.style.display = 'none'; }, 3000);
  }
}
