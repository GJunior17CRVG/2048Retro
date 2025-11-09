const board = document.getElementById("board");
const scoreDisplay = document.getElementById("score");
const bestDisplay = document.getElementById("best");
const message = document.getElementById("message");
const restartBtn = document.getElementById("restart");
const undoBtn = document.getElementById("undo");

let grid, tiles, score, best;
let previousState = null;

const sounds = {
  merge: new Audio("sounds/8-bit-game-sfx-sound-17-269969.mp3"),
  gameOver: new Audio("sounds/arcade-280345.mp3"),
  music: new Audio("sounds/gamer-music-140-bpm-355954.mp3")
};

sounds.music.loop = true;
sounds.music.volume = 0.5;

function playMusic() {
  sounds.music.currentTime = 0;
  sounds.music.play().catch(() => {});
}

function stopMusic() {
  sounds.music.pause();
  sounds.music.currentTime = 0;
}

function playSound(type) {
  const s = sounds[type];
  if (s) {
    s.currentTime = 0;
    s.play();
  }
}

best = localStorage.getItem("best2048") || 0;
bestDisplay.textContent = best;

function initBoard() {
  board.innerHTML = "";
  grid = Array(4).fill().map(() => Array(4).fill(0));
  tiles = Array(4).fill().map(() => Array(4).fill(null));
  score = 0;
  message.textContent = "";
  addNumber();
  addNumber();
  renderBoard();
  playMusic();
}

function addNumber() {
  const empty = [];
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      if (grid[i][j] === 0) empty.push({ i, j });
    }
  }
  if (empty.length) {
    const { i, j } = empty[Math.floor(Math.random() * empty.length)];
    grid[i][j] = Math.random() < 0.9 ? 2 : 4;
  }
}

function renderBoard() {
  const tileSize = 80;
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      const value = grid[i][j];
      let tile = tiles[i][j];
      if (value !== 0) {
        if (!tile) {
          tile = document.createElement("div");
          tile.className = `cell tile-${value}`;
          tile.textContent = value;
          board.appendChild(tile);
          tiles[i][j] = tile;
          positionTile(tile, i, j, tileSize);
          tile.style.transform += " scale(0)";
          setTimeout(() => {
            tile.style.transform = `translate(${j * tileSize}px, ${i * tileSize}px) scale(1)`;
          }, 50);
        } else {
          tile.className = `cell tile-${value}`;
          tile.textContent = value;
          positionTile(tile, i, j, tileSize);
        }
      } else if (tile) {
        board.removeChild(tile);
        tiles[i][j] = null;
      }
    }
  }
  scoreDisplay.textContent = score;
  bestDisplay.textContent = best;
}

function positionTile(tile, i, j, size = 80) {
  tile.style.transform = `translate(${j * size}px, ${i * size}px)`;
}

function move(direction) {
  previousState = JSON.parse(JSON.stringify({ grid, score }));
  let moved = false;
  const merged = Array(4).fill().map(() => Array(4).fill(false));

  const dirs = {
    left: { x: 0, y: -1 },
    right: { x: 0, y: 1 },
    up: { x: -1, y: 0 },
    down: { x: 1, y: 0 }
  };
  const dir = dirs[direction];
  let order = [...Array(4).keys()];
  if (direction === "right" || direction === "down") order.reverse();

  order.forEach(i => {
    order.forEach(j => {
      let x = i, y = j;
      if (grid[x][y] === 0) return;

      let nextX = x + dir.x;
      let nextY = y + dir.y;

      while (
        nextX >= 0 && nextX < 4 &&
        nextY >= 0 && nextY < 4 &&
        grid[nextX][nextY] === 0
      ) {
        grid[nextX][nextY] = grid[x][y];
        grid[x][y] = 0;
        x = nextX; y = nextY;
        nextX += dir.x; nextY += dir.y;
        moved = true;
      }

      if (
        nextX >= 0 && nextX < 4 &&
        nextY >= 0 && nextY < 4 &&
        grid[nextX][nextY] === grid[x][y] &&
        !merged[nextX][nextY]
      ) {
        grid[nextX][nextY] *= 2;
        grid[x][y] = 0;
        merged[nextX][nextY] = true;
        score += grid[nextX][nextY];
        moved = true;

        playSound("merge");

        const tile = tiles[nextX][nextY];
        if (tile) {
          tile.style.transition = "transform 0.15s ease-in-out";
          tile.style.transform += " scale(1.2)";
          setTimeout(() => {
            tile.style.transform = `translate(${nextY * 80}px, ${nextX * 80}px) scale(1)`;
          }, 150);
        }
      }
    });
  });

  if (moved) {
    addNumber();
    updateTilesSmooth();
    checkGameOver();
    updateBest();
  }
}

function updateTilesSmooth() {
  const tileSize = 80;
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      if (tiles[i][j]) {
        positionTile(tiles[i][j], i, j, tileSize);
      }
    }
  }
  setTimeout(() => requestAnimationFrame(renderBoard), 150);
}

undoBtn.addEventListener("click", () => {
  if (previousState) {
    grid = previousState.grid.map(r => [...r]);
    score = previousState.score;
    renderBoard();
    message.textContent = "↩️ Última jogada desfeita!";
  }
});

window.addEventListener("keydown", e => {
  switch (e.key) {
    case "ArrowLeft": move("left"); break;
    case "ArrowRight": move("right"); break;
    case "ArrowUp": move("up"); break;
    case "ArrowDown": move("down"); break;
  }
});

restartBtn.addEventListener("click", () => {
  stopMusic();
  initBoard();
});

function checkGameOver() {
  if (grid.flat().includes(2048)) {
    stopMusic();
    message.textContent = "🎉 Você venceu!";
  } else if (!canMove()) {
    stopMusic();
    playSound("gameOver");
    message.textContent = "💀 Fim de jogo!";
  }
}

function canMove() {
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      if (grid[i][j] === 0) return true;
      if (i < 3 && grid[i][j] === grid[i + 1][j]) return true;
      if (j < 3 && grid[i][j] === grid[i][j + 1]) return true;
    }
  }
  return false;
}

function updateBest() {
  if (score > best) {
    best = score;
    localStorage.setItem("best2048", best);
  }
}

initBoard();

let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

board.addEventListener("touchstart", (e) => {
  const touch = e.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
});

board.addEventListener("touchend", (e) => {
  const touch = e.changedTouches[0];
  touchEndX = touch.clientX;
  touchEndY = touch.clientY;

  handleGesture();
});

function handleGesture() {
  const dx = touchEndX - touchStartX;
  const dy = touchEndY - touchStartY;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  if (Math.max(absDx, absDy) > 30) {
    if (absDx > absDy) {
      if (dx > 0) move("right");
      else move("left");
    } else {
      if (dy > 0) move("down");
      else move("up");
    }
  }
}
