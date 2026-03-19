(() => {
  // Only allow entering the game from the landing page click.
  // This also ensures that refreshing `game.html` returns to the landing page.
  const boardRoot = document.getElementById("tetris-board");
  if (!boardRoot) return;

  const entryKey = "tetris_entry";
  const allowed = sessionStorage.getItem(entryKey) === "1";
  sessionStorage.removeItem(entryKey);

  if (!allowed) {
    window.location.replace("index.html");
  }
})();

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const TICK_INTERVAL_MS = 600;

const TETROMINOES = {
  I: [
    [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
    ],
  ],
  O: [
    [
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
  ],
  T: [
    [
      [0, 1, 0, 0],
      [1, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 0, 0],
      [1, 1, 1, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 0, 0],
      [1, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0],
    ],
  ],
  S: [
    [
      [0, 1, 1, 0],
      [1, 1, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [1, 0, 0, 0],
      [1, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0],
    ],
  ],
  Z: [
    [
      [1, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 0, 0],
      [1, 1, 0, 0],
      [1, 0, 0, 0],
      [0, 0, 0, 0],
    ],
  ],
  J: [
    [
      [1, 0, 0, 0],
      [1, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 1, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 0, 0],
      [1, 1, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [1, 1, 0, 0],
      [0, 0, 0, 0],
    ],
  ],
  L: [
    [
      [0, 0, 1, 0],
      [1, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 0, 0],
      [1, 1, 1, 0],
      [1, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [1, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0],
    ],
  ],
};

const PIECE_KEYS = Object.keys(TETROMINOES);

let board;
let currentPiece;
let score = 0;
let isGameOver = false;
let intervalId = null;
let isPaused = false;

let boardElement;
let cells = [];
let scoreElement;
let statusElement;

function createEmptyBoard() {
  return Array.from({ length: BOARD_HEIGHT }, () =>
    Array.from({ length: BOARD_WIDTH }, () => null),
  );
}

function initDom() {
  boardElement = document.getElementById("tetris-board");
  scoreElement = document.getElementById("score-value");
  statusElement = document.getElementById("status-message");

  boardElement.innerHTML = "";
  cells = [];

  for (let row = 0; row < BOARD_HEIGHT; row += 1) {
    for (let col = 0; col < BOARD_WIDTH; col += 1) {
      const cell = document.createElement("div");
      cell.className = "cell";
      boardElement.appendChild(cell);
      cells.push(cell);
    }
  }
}

function getRandomPiece() {
  const key = PIECE_KEYS[Math.floor(Math.random() * PIECE_KEYS.length)];
  return {
    type: key,
    rotationIndex: 0,
    x: 3,
    y: 0,
  };
}

function getCurrentShapeMatrix(piece) {
  const rotations = TETROMINOES[piece.type];
  return rotations[piece.rotationIndex % rotations.length];
}

function forEachCellInPiece(piece, callback) {
  const matrix = getCurrentShapeMatrix(piece);
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      if (matrix[row][col]) {
        const boardX = piece.x + col;
        const boardY = piece.y + row;
        callback(boardX, boardY);
      }
    }
  }
}

function isPositionValid(piece) {
  let valid = true;
  forEachCellInPiece(piece, (x, y) => {
    if (
      x < 0 ||
      x >= BOARD_WIDTH ||
      y < 0 ||
      y >= BOARD_HEIGHT ||
      (board[y] && board[y][x] !== null)
    ) {
      valid = false;
    }
  });
  return valid;
}

function mergePieceIntoBoard(piece) {
  forEachCellInPiece(piece, (x, y) => {
    if (y >= 0 && y < BOARD_HEIGHT && x >= 0 && x < BOARD_WIDTH) {
      board[y][x] = piece.type;
    }
  });
}

function clearFullLines() {
  let linesCleared = 0;
  for (let row = BOARD_HEIGHT - 1; row >= 0; row -= 1) {
    const isFull = board[row].every((cell) => cell !== null);
    if (isFull) {
      board.splice(row, 1);
      board.unshift(Array.from({ length: BOARD_WIDTH }, () => null));
      linesCleared += 1;
      row += 1;
    }
  }

  if (linesCleared > 0) {
    let points = 0;
    if (linesCleared === 1) points = 100;
    else if (linesCleared === 2) points = 300;
    else if (linesCleared === 3) points = 500;
    else if (linesCleared >= 4) points = 800;
    score += points;
  }
}

function render() {
  for (let i = 0; i < cells.length; i += 1) {
    cells[i].className = "cell";
  }

  for (let row = 0; row < BOARD_HEIGHT; row += 1) {
    for (let col = 0; col < BOARD_WIDTH; col += 1) {
      const cellValue = board[row][col];
      if (cellValue) {
        const index = row * BOARD_WIDTH + col;
        const cell = cells[index];
        cell.classList.add("cell--filled", `cell--${cellValue}`);
      }
    }
  }

  if (!isGameOver && currentPiece) {
    forEachCellInPiece(currentPiece, (x, y) => {
      if (y >= 0 && y < BOARD_HEIGHT && x >= 0 && x < BOARD_WIDTH) {
        const index = y * BOARD_WIDTH + x;
        const cell = cells[index];
        cell.classList.add("cell--filled", `cell--${currentPiece.type}`);
      }
    });
  }

  scoreElement.textContent = String(score);
}

function spawnNewPiece() {
  currentPiece = getRandomPiece();
  if (!isPositionValid(currentPiece)) {
    isGameOver = true;
    statusElement.textContent = "Game Over – press R to restart";
    stopLoop();
  }
}

function movePiece(dx, dy) {
  if (!currentPiece || isGameOver) return false;
  const candidate = {
    ...currentPiece,
    x: currentPiece.x + dx,
    y: currentPiece.y + dy,
  };
  if (isPositionValid(candidate)) {
    currentPiece = candidate;
    render();
    return true;
  }
  return false;
}

function rotatePiece() {
  if (!currentPiece || isGameOver) return;
  const rotations = TETROMINOES[currentPiece.type];
  const candidate = {
    ...currentPiece,
    rotationIndex: (currentPiece.rotationIndex + 1) % rotations.length,
  };

  if (isPositionValid(candidate)) {
    currentPiece = candidate;
    render();
  }
}

function hardDrop() {
  if (!currentPiece || isGameOver) return;
  let steps = 0;
  while (movePiece(0, 1)) {
    steps += 1;
  }
  if (steps > 0) {
    // Reward hard drop distance a little so score changes quickly.
    score += steps * 2;
  }
  stepGame();
}

function stepGame() {
  if (isGameOver || isPaused) return;

  const moved = movePiece(0, 1);
  if (!moved) {
    mergePieceIntoBoard(currentPiece);
    // Small reward for locking a piece, even without line clears.
    score += 10;
    clearFullLines();
    render();
    spawnNewPiece();
    render();
  }
}

function startLoop() {
  if (intervalId !== null) return;
  intervalId = setInterval(stepGame, TICK_INTERVAL_MS);
}

function stopLoop() {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

function resetGame() {
  stopLoop();
  board = createEmptyBoard();
  score = 0;
  isGameOver = false;
  isPaused = false;
  statusElement.textContent = "";
  spawnNewPiece();
  render();
  startLoop();
}

function handleKeyDown(event) {
  switch (event.key) {
    case "ArrowLeft":
      movePiece(-1, 0);
      break;
    case "ArrowRight":
      movePiece(1, 0);
      break;
    case "ArrowDown":
      movePiece(0, 1);
      break;
    case "ArrowUp":
      rotatePiece();
      break;
    case " ":
      event.preventDefault();
      hardDrop();
      break;
    case "p":
    case "P":
      if (!isGameOver) {
        isPaused = !isPaused;
        statusElement.textContent = isPaused ? "Paused" : "";
      }
      break;
    case "r":
    case "R":
      resetGame();
      break;
    default:
      break;
  }
}

window.addEventListener("load", () => {
  initDom();
  board = createEmptyBoard();
  spawnNewPiece();
  render();
  startLoop();
  window.addEventListener("keydown", handleKeyDown);
});
