# Rummikub — Tile Game

A web-based Rummikub game built for the Computing 2 Applications coursework. Play in single-player mode against an AI opponent or pass-and-play with a friend.

Rummikub is a tile-rummy game where each player starts with 14 tiles. On your turn, you may play tiles to the table in valid **runs** (three or more consecutive numbers in the same colour) or **groups** (three or four identical numbers in different colours). The first player to empty their rack wins.

---

## Features

- Full Rummikub rule enforcement: runs, groups, joker tiles, initial meld (≥30 points)
- Board manipulation: rearrange, split, extend existing groups on the table
- Joker replacement: swap a joker on the board with a matching tile from your hand
- AI opponent with Normal and Hard difficulty
- Two-player hot-seat mode with screen-swap animation
- Drag-and-drop tile interface
- Pixel-art themed UI with custom tile sprites
- Interactive tutorial for new players
- 53 unit tests covering core game logic

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, JavaScript (ES6+) |
| Modularity | ES6 `import` / `export` |
| Game Engine | Pure JavaScript module (`rummikub-game.js`) |
| Documentation | JSDoc |
| Testing | Node.js native test runner (`node:test` + `node:assert`) |
| Package Manager | npm |

---

## Project Structure

```
/
├── package.json
├── jsdoc.json
├── README.md
└── web-app/
    ├── index.html
    ├── default.css
    ├── rummikub-game.js          # Game engine (JSDoc annotated)
    ├── main.js                   # UI logic & event handlers
    ├── ramda.js                  # Ramda ES module shim
    ├── assets/                   # Images, sprites, audio
    │   ├── game_background.png
    │   ├── frozen_background.png
    │   ├── tile_red.png
    │   ├── tile_blue.png
    │   ├── tile_yellow.png
    │   ├── tile_white.png
    │   ├── tile_joker.png
    │   ├── tile_back.png
    │   ├── board.png
    │   ├── button.png
    │   ├── cover_background.png
    │   ├── title.png
    │   └── 30_欢乐斗地主背景音乐.mp3
    └── tests/
        ├── spec.md               # Test specification (Chinese)
        ├── rummikub-game.test.js  # Original Mocha tests
        └── rummikub.test.js       # 53 node:test unit tests
```

---

## Installation & Usage

```bash
# Install dependencies
npm install

# Run unit tests
npm test

# Generate JSDoc documentation
npm run docs

# Serve the game locally
npx http-server web-app -p 8080 -o
# or: cd web-app && python -m http.server 8080
# then open http://localhost:8080
```

---

## Core API

All functions are exported from `web-app/rummikub-game.js`.

| Function | Description |
|---|---|
| `initGame(mode, difficulty)` | Initialise a new game state (single or twoPlayer) |
| `isValidGroup(group)` | Validate a set of tiles as a legal run or group |
| `sortGroup(group)` | Sort a group by value or colour order |
| `getJokerRepresentation(group)` | Determine what a joker represents in context |
| `makeMove(state, tiles, groups, replacements)` | Execute a player's move |
| `skipAndDraw(state)` | Draw a tile and advance the turn |
| `checkWin(state)` | Check whether any player has won |
| `getValidMoves(state)` | List all legal moves for the current player |
| `getAIMove(state)` | AI decision-making (single-player only) |

Generate full API docs:

```bash
npx jsdoc -c jsdoc.json
```

---

## Test Summary

53 test cases across 9 groups:

| Group | Tests | Coverage |
|---|---|---|
| `initGame` | 4 | Initialisation, tile counts, ID uniqueness |
| `isValidGroup` | 17 | Runs, sets, jokers, edge cases |
| `sortGroup` | 4 | Ordering by value/colour, joker placement |
| `getJokerRepresentation` | 6 | Joker substitution |
| `makeMove` | 10 | Play, initial meld, extensions, joker replacement |
| `skipAndDraw` | 3 | Draw, empty pool, immutability |
| `checkWin` | 4 | Win detection for all players |
| `getValidMoves` | 2 | Move generation |
| `getAIMove` | 2 | AI draw vs play decisions |

---

## Coursework Checklist

- [x] Game module API specification (JSDoc)
- [x] Game module implementation
- [x] Unit test specification (`tests/spec.md`)
- [x] Unit test implementation (`tests/rummikub.test.js`)
- [x] Web application (`index.html`, `default.css`, `main.js`)

---

## Author

<!-- Leave blank for self-fill -->
Name: \____________________  
CID: \____________________
