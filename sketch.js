// Clone of 2048 by Gabrielle Cirulli

var score, highscore = 1337, occupied;
var gameActive, gameIsOver;
var animStage, animTimer;

const ui = {};
const settings = {};

const cells = [[]];
const tiles = [];
const newTileIds = [];
const movingTileIds = [];
const poppingTileIds = [];

function preload() {
  randomSeed();
}

function setup(){
  createCanvas(windowWidth, windowHeight);

  textFont(loadFont("data/ARIALBD.TTF"));
  colorMode(HSB, 360, 100, 100, 100);
  initUI();
  initSettings();
  
  gameReset();

  ui.tileColours = [];
  for (let i = 0; i < 10; i++) { ui.tileColours.push(color(60 + 30 * i, 25, 100)); }
  for (let i = 0; i < 10; i++) { ui.tileColours.push(color(30 * i, 50, 100)); }
}

function draw() {
  background(ui.windowColour);
  push();
  translate(ui.windowPaddingX, ui.windowPaddingY);
  scale(ui.scaleF);
  noStroke();
  
  fill(ui.bgColour);
  rect(0, 0, ui.w, ui.h);
  //title
  // textFont(ui.font, ui.titleTextSize);
  textSize(ui.titleTextSize);
  fill(ui.titleColour);
  textAlign(LEFT);
  text("2048", ui.gameBoardMargin + ui.cellMargin - 10, ui.titleTextSize - 10);
  
  //scores
  fill(ui.cellColour);
  rectMode(CENTER);
  // textFont(ui.font, ui.scoreTextSize);
  textSize(ui.scoreTextSize);
  
  // buttons
  rect(ui.newGameButtonPos.x, ui.newGameButtonPos.y, ui.newGameButtonSize.x, ui.newGameButtonSize.y, ui.tileCornerRadius);
  rect(ui.scoreBoxPos.x, ui.scoreBoxPos.y, ui.scoreBoxSize.x, ui.scoreBoxSize.y, ui.tileCornerRadius);
  rect(ui.highscoreBoxPos.x, ui.highscoreBoxPos.y, ui.scoreBoxSize.x, ui.scoreBoxSize.y, ui.tileCornerRadius);
  
  fill(0);
  textAlign(CENTER);
  text("New Game", ui.newGameButtonPos.x, ui.newGameButtonPos.y + 7);
  text("Score", ui.scoreBoxPos.x, ui.scoreBoxPos.y - 5);
  text(score, ui.scoreBoxPos.x, ui.scoreBoxPos.y + 20);
  text("Best", ui.highscoreBoxPos.x, ui.highscoreBoxPos.y - 5);
  text(highscore, ui.highscoreBoxPos.x, ui.highscoreBoxPos.y + 20);
  
  // game board
  push();
  translate(ui.gameBoardMargin, ui.h - ui.gameBoardW - ui.gameBoardMargin);
  textAlign(CENTER);
  rectMode(CORNER);
  
  fill(ui.gameBoardColour);
  rect(0, 0, ui.gameBoardW, ui.gameBoardW, ui.gameBoardFillet);
  for (let row of cells) {
    fill(ui.cellColour);
    for (let cell of row) {
      cell.display();
    }
  }
  // textFont(ui.font, ui.numbersTextSize);
  textSize(ui.numbersTextSize);
  for (let tile of tiles) {
    if (tile.active) {
      tile.display();
    }
  }
  
  if (gameIsOver) {
    fill(0, 0, 0, 50);
    rect(0, 0, ui.gameBoardW, ui.gameBoardW, ui.gameBoardFillet);
    
    fill(0, 0, 100, 100);
    // textFont(ui.font, ui.gameOverTextSize);
    textSize(ui.gameOverTextSize);
    text("Game Over", ui.gameBoardW / 2, ui.gameBoardW / 2 - ui.tileW / 5);
  }
  
  pop();
  
  //animations
  if (animStage == 1) {
    if (animTimer > settings.tilePopFrames) {
      for (let i of movingTileIds) tiles[i].move();
    } else {
      endAnim();
    }
    animTimer--;
  } else if (animStage == 2) {
    if (animTimer <= settings.tilePopFrames && animTimer > 0) {
      for (let i of poppingTileIds) tiles[i].pop();
      for (let i of newTileIds) tiles[i].appear();
    } else {
      endAnim();
    }
    animTimer--;
  }

  pop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight)
  scaleUI(width, height);
}

function gameReset() {
  // console.log("\n<GAME RESET>")
  gameStart();
  spawnTile();
  spawnTile();
}

function gameStart() {
  cells.splice(0, 4);
  tiles.splice(0, 17);
  for (let c = 0; c < 4; c++) {
    cells.push(new Array());
    for (let r = 0; r < 4; r++) {
      cells[c].push(new Cell(c, r));
    }
  }
  
  for (let i = 0; i < 17; i++) {
    tiles.push(new Tile(i));
  }
  
  score = 0;
  occupied = 0;
  
  gameIsOver = false;
  animStage = 2;
  animTimer = settings.tilePopFrames;
}

function gameOver() {
  gameIsOver = true;
}

function spawnTile() {
  let emptyCells = [];
  for (let rows of cells) {
    for (let cell of rows) {
      if (!cell.occupied) {
        let index = new Index(cell.c, cell.r);
        emptyCells.push(index);
      }
    }
  }
  if (emptyCells.length == 0) return;
  
  let range = -20000.0 / (score + 22000.0) + 2.0;
  let randomNum = range * random();
  let exponent = floor(randomNum) + 1;
  let index = emptyCells[floor(emptyCells.length * random())];
  emptyCells.splice(0, emptyCells.length);
  
  createTile(index.c, index.r, exponent);
  //createTile(index.c, index.r, int(random(1, 20)));
}

function createTile(c, r, exp) {
  for (let tile of tiles) {
    if (!tile.active) {
      tile.activate(c, r, exp);
      cells[c][r].setTile(tile.id);
      cells[c][r].exponent = exp;
      // console.log("createTile() ");
      cells[c][r].update();
      occupied++;
      newTileIds.push(tile.id);
      break;
    }
  }
}

function calcMove(input) {
  let horizontal = (input == LEFT_ARROW || input == RIGHT_ARROW) ? true : false;
  let start, end, inc;
  if (input == LEFT_ARROW || input == UP_ARROW) { start = 1; end = 4; inc = 1; }
  else { start = 2; end = -1; inc = -1; }
  // console.log("gameManager::calcMove() moving ");
  switch (input) {
    case LEFT_ARROW: // console.log("left"); break;
    case UP_ARROW: // console.log("up"); break;
    case RIGHT_ARROW: // console.log("right"); break;
    case DOWN_ARROW: // console.log("down"); break;
  }
  
  /** HORIZONTAL **/
  if (horizontal) {
    for (let r = 0; r < 4; r++) {
      // console.log("processing row "+r+' ');
      for (let c = start; c != end; c += inc) {
        // console.log("processing cell " + c + ' ' + r + ": ");
        let cell = cells[c][r];
        
        if (!cell.occupied) {
          // console.log("empty");
          continue;
        }
        
        let newIndex = new Index(cell.c, cell.r);
        let move = false;
        let exponent = cell.exponent;
        for (let i = c - inc; 0 <= i && i < 4; i -= inc) {
          // console.log("checking cell "+i+' '+r+' ');
          if (cells[i][r].occupied) {
            // console.log("occupied ");
            if (cells[i][r].exponent == cell.exponent && !cells[i][r].isCombining) {
              // console.log("equal ");
              newIndex.c = i;
              move = true;
              exponent++;
              score += pow(2, exponent);
              // console.log("combining to exponent "+exponent+' ');
              cells[newIndex.c][newIndex.r].isCombining = true;
            }
            break;
          } else {
            // console.log("empty ");
            newIndex.c = i;
            move = true;
          }
        }
        if (move) {
          cells[newIndex.c][newIndex.r].exponent = exponent;
          cells[c][r].empty();
          tiles[cell.tileId].instantMove(newIndex.c, newIndex.r);
        }
      }
    }
  } 
  /** VERTICAL **/
  else { 
    for (let c = 0; c < 4; c++) {
      // console.log("processing column "+c+' ');
      for (let r = start; r != end; r += inc) {
        // console.log("processing cell "+c+' '+r+": ");
        let cell = cells[c][r];
        
        if (!cell.occupied) {
          // console.log("empty");
          continue;
        }
        
        let newIndex = new Index(cell.c, cell.r);
        let move = false;
        let exponent = cell.exponent;
        for (let i = r - inc; 0 <= i && i < 4; i -= inc) {
          // console.log("checking cell "+c+' '+i+' ');
          if (cells[c][i].occupied) {
            // console.log("occupied ");
            if (cells[c][i].exponent == cell.exponent && !cells[c][i].isCombining) {
              // console.log("equal ");
              newIndex.r = i;
              move = true;
              exponent++;
              score += pow(2, exponent);
              // console.log("combining to exponent "+exponent+' ');
              cells[newIndex.c][newIndex.r].setTile(cell.tileId);
            }
            break;
          } else {
            // console.log("empty ");
            newIndex.r = i;
            move = true;
          }
        }
        if (move) {
          cells[newIndex.c][newIndex.r].exponent = exponent;
          cells[c][r].empty();
          tiles[cell.tileId].instantMove(newIndex.c, newIndex.r);
        }
      }
    }
  }
  if (score > highscore) highscore = score;
}

function startAnim() {
  animStage = 1;
  animTimer = settings.animFrames;
}

function endAnim() {
  if (animStage == 1) {
    for (let row of cells) {
      for (let cell of row) {
        if (cell.occupied) {
          cell.update();
          occupied++;
        }
      }
    }
    if (movingTileIds.length != 0) spawnTile();
    if (occupied == 16) {
      checkLoss();
    }
    occupied = 0;
    
    for (let i of movingTileIds) {
      tiles[i].pos.set(tiles[i].targetPos);
    }
    movingTileIds.splice(0, movingTileIds.length);
    for (let i of poppingTileIds) {
      tiles[i].scaleF = ui.tilePopF;
    }
    
    animStage = 2;
  } else {
    for (let i of poppingTileIds) {
      tiles[i].scaleF = 1;
    }
    for (let i of newTileIds) {
      tiles[i].scaleF = 1;
    }
    poppingTileIds.splice(0, poppingTileIds.length);
    newTileIds.splice(0, newTileIds.length);
    animStage = 0;
  }
}

function checkLoss() {
  // console.log("checkLoss() ");
  let movesAvailable = false;
  for (let i = 0; i < 4; i++) {
    let rexp = cells[i][0].exponent, cexp = cells[0][i].exponent;
    for (let j = 1; j < 4; j++) {
      let crexp = cells[i][j].exponent, ccexp = cells[j][i].exponent;
      if (crexp == rexp || ccexp == cexp) {
        movesAvailable = true;
        // console.log("move available ");
        break;
      }
      rexp = crexp;
      cexp = ccexp;
    }
  }
  if (!movesAvailable) {
    gameOver();
    // console.log("no moves available; game over");
  }
}

function mouseClicked() {
  //spawnTile();
  if (mouseX - ui.windowPaddingX > (ui.newGameButtonPos.x - ui.newGameButtonSize.x / 2) * ui.scaleF && mouseX - ui.windowPaddingX < (ui.newGameButtonPos.x + ui.newGameButtonSize.x  / 2) * ui.scaleF && mouseY - ui.windowPaddingY > (ui.newGameButtonPos.y - ui.newGameButtonSize.y / 2) * ui.scaleF && mouseY - ui.windowPaddingY < (ui.newGameButtonPos.y + ui.newGameButtonSize.y / 2) * ui.scaleF) {
    gameReset();
  }
}

function keyPressed() {
  if (!gameIsOver && (keyCode == UP_ARROW || keyCode == DOWN_ARROW || keyCode == RIGHT_ARROW || keyCode == LEFT_ARROW)) {
    while (animStage > 0) endAnim();
    startAnim();
    calcMove(keyCode);
  }
}

function scaleUI(w, h) {
  if (w / h <= 6 / 7) {
    ui.scaleF = w / ui.w
  } else {
    ui.scaleF = h / ui.h
  }
  
  ui.windowPaddingX = (w - ui.w * ui.scaleF) / 2;
  ui.windowPaddingY = (h - ui.h * ui.scaleF) / 2;
}

function initUI() {
  ui.w = 600;
  ui.h = 700;
  scaleUI(windowWidth, windowHeight);
  
  ui.gameBoardW = 540;
  ui.gameBoardMargin = 30;
  ui.cellMargin = 12;
  ui.tileW = 120;
  ui.cellSpacing = 132;
  
  ui.newGameButtonPos = createVector(ui.w - ui.gameBoardMargin - ui.cellMargin - ui.tileW / 2, ui.gameBoardMargin + ui.tileW * 5 / 8);
  ui.newGameButtonSize = createVector(ui.tileW, ui.tileW / 4);
  ui.scoreBoxPos = createVector(ui.w - ui.gameBoardMargin - ui.cellMargin - ui.tileW / 2, ui.gameBoardMargin + ui.tileW / 4 - 10);
  ui.highscoreBoxPos = createVector(ui.w - ui.gameBoardMargin - ui.cellMargin * 2 - ui.tileW * 1.5, ui.gameBoardMargin + ui.tileW / 4 - 10);
  ui.scoreBoxSize = createVector(ui.tileW, ui.tileW / 2);
  
  ui.gameBoardFillet = ui.gameBoardMargin / 4;
  ui.tileCornerRadius = ui.gameBoardFillet;
  
  ui.tilePopF = (ui.tileW + ui.cellMargin * 2) / ui.tileW;
  ui.tileStartF = 0.2;
  
  ui.titleTextSize = ui.tileW;
  ui.numbersTextSize = ui.tileW / 2;
  ui.numbersTextOffset = ui.numbersTextSize / 10;
  ui.scoreTextSize = ui.tileW / 6.5;
  ui.gameOverTextSize = ui.tileW / 2

  ui.titleColour = color(171, 23, 83);
  ui.menuColour = color(0, 0, 98);
  ui.bgColour = color(216, 77, 17);
  ui.windowColour = color(215, 76, 25)
  ui.gameBoardColour = color(215, 78, 48);
  ui.cellColour = color(215, 20, 91);
  ui.numColour = color(213, 76, 8);
}

function initSettings() {
  settings.moveFrames = 10;
  settings.tilePopFrames = 5;
  settings.appearFrames = 5;
  settings.animFrames = settings.moveFrames + settings.tilePopFrames;
  settings.highscore = 0;
}

class Cell {
  constructor(c, r) {
    this.c = c;
    this.r = r;
    this.exponent;
    this.tileId;
    this.newTileId;
    this.occupied = false;
    this.isCombining = false;
    this.pos = createVector(ui.cellMargin + ui.cellSpacing * this.c, ui.cellMargin + ui.cellSpacing * this.r);
    // console.log("New cell created");
  }
  
  display() {
    rect(this.pos.x, this.pos.y, ui.tileW, ui.tileW, ui.tileCornerRadius);
  }
  
  empty() {
    this.occupied = false;
    this.exponent = 0;
  }
  
  setTile(id) {
    if (this.occupied) {
      this.newTileId = id;
      this.isCombining = true;
    } else {
      this.occupied = true;
      this.tileId = id;
    }
  }
  
  update() {
    this.printId();
    // console.log("update() ");
    // console.log("exponent=" + this.exponent + ' ');
    if (this.isCombining) {
      tiles[this.newTileId].deactivate();
      // console.log("deactivated tile " + this.newTileId + ' ');
      poppingTileIds.push(this.tileId);
      this.isCombining = false;
    }
    tiles[this.tileId].setExp(this.exponent);
    // console.log("tileId=" + this.tileId);
  }
  
  printId() {
    // console.log("cells[" + this.c + "][" + this.r + "]::");
  }
}

class Index {
  constructor(c, r) {
    this.c = c;
    this.r = r;
  }
}

class Tile {
  constructor (i) {
    this.id = i;
    this.exponent;
    this.active = false;
    this.pos = createVector(0, 0);
    this.targetPos = createVector(0, 0);
    this.vel = createVector(0, 0);
    this.scaleF;
    this.numTextSize;
    // console.log("Tile created");
  }
  
  activate(c, r, exp) {
    this.pos = createVector(ui.cellMargin + (ui.cellSpacing) * c + ui.tileW / 2, ui.cellMargin + (ui.cellSpacing) * r + ui.tileW / 2);
    this.targetPos = createVector(this.pos.x, this.pos.y);
    this.vel = createVector(0, 0);
    this.setExp(exp);
    this.scaleF = ui.tileStartF;
    this.active = true;
  }
  
  deactivate() {
    this.active = false;
  }
  
  display() {
    push();
    translate(this.pos.x, this.pos.y);
    scale(this.scaleF);
    
    fill(ui.tileColours[this.exponent-1]);
    rect(-ui.tileW / 2, -ui.tileW / 2, ui.tileW, ui.tileW, ui.tileCornerRadius);
    
    textSize(this.numTextSize);
    textAlign(CENTER, CENTER)
    fill(ui.numColour);
    text(int(pow(2, this.exponent)), -1, -this.numTextSize * 0.05);
    
    pop();
  }
  
  instantMove(c, r) {
    // console.log("transferring tile " + this.id + " to " + this.c + " " + this.r + ' ');
    this.targetPos.set(cells[c][r].pos).add(ui.tileW/2, ui.tileW/2);
    this.vel.set(this.targetPos).sub(this.pos).div(settings.moveFrames);
    movingTileIds.push(this.id);
    cells[c][r].setTile(this.id);
  }
  
  setExp(exp) {
    this.exponent = exp;
    
    this.numTextSize = ui.numbersTextSize;
    if (this.exponent > 6) {
      let numDigits = digits(pow(2, exp));
      this.numTextSize -= ui.numbersTextOffset * (numDigits - 1);
    }
  }
  
  appear() {
    this.scaleF += (1 - ui.tileStartF) / settings.appearFrames;
  }
  
  move() {
    this.pos.add(this.vel);
  }
  
  pop() {
    this.scaleF -= (ui.tilePopF - 1) / settings.tilePopFrames;
  }
}

function digits(num) {
  let n = num;
  let d = 0;
  while (n >= 1) {
    n *= 0.1;
    d++;
  }
  return d;
}