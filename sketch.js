// Clone of 2048 by Gabrielle Cirulli

var score, highscore, occupied;
var gameActive, gameIsOver;
var animStage, animTimer;
var data;

const ui = {};
const settings = {};

const cells = [[]];
const tiles = [];
const newTileIds = [];
const movingTileIds = [];
const poppingTileIds = [];

function setup(){
  createCanvas(windowWidth, windowHeight);

  colorMode(HSB, 360, 100, 100, 100);
  textFont(loadFont("ARIALBD.TTF", 72));
  setUI(width, height);
  initSettings();
  
  gameStart();

  ui.tileColours = [];
  for (let i = 0; i < 10; i++) { ui.tileColours.push(color(60 + 30 * i, 25, 100)); }
  for (let i = 0; i < 10; i++) { ui.tileColours.push(color(30 * i, 50, 100)); }
}

function draw() {
  background(ui.bgColour);
  noStroke();
  
  //title
  // textFont(ui.font, ui.titleTextSize);
  textSize(ui.titleTextSize);
  fill(ui.titleColour);
  textAlign(CORNER);
  text("2048", ui.boardMargin + ui.cellMargin - 10, ui.titleTextSize - 10);
  
  //scores
  fill(ui.cellColour);
  rectMode(CENTER);
  // textFont(ui.font, ui.scoreTextSize);
  textSize(ui.scoreTextSize);
  
  rect(ui.newGameButtonPos.x, ui.newGameButtonPos.y, ui.newGameButtonSize.x, ui.newGameButtonSize.y, ui.tileFillet);
  rect(ui.scoreBoxPos.x, ui.scoreBoxPos.y, ui.scoreBoxSize.x, ui.scoreBoxSize.y, ui.tileFillet);
  rect(ui.highscoreBoxPos.x, ui.highscoreBoxPos.y, ui.scoreBoxSize.x, ui.scoreBoxSize.y, ui.tileFillet);
  
  // buttons
  fill(0);
  textAlign(CENTER);
  text("New Game", ui.newGameButtonPos.x, ui.newGameButtonPos.y + 7);
  text("Score", ui.scoreBoxPos.x, ui.scoreBoxPos.y - 5);
  text(score, ui.scoreBoxPos.x, ui.scoreBoxPos.y + 20);
  text("Best", ui.highscoreBoxPos.x, ui.highscoreBoxPos.y - 5);
  text(highscore, ui.highscoreBoxPos.x, ui.highscoreBoxPos.y + 20);
  
  //board
  push();
  translate(ui.boardMargin, height - ui.boardW - ui.boardMargin);
  textAlign(CENTER);
  rectMode(CORNER);
  
  fill(ui.boardColour);
  rect(0, 0, ui.boardW, ui.boardW, ui.boardFillet);
  for (let row of cells) {
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
    rect(0, 0, ui.boardW, ui.boardW, ui.boardFillet);
    
    fill(0, 0, 100, 100);
    // textFont(ui.font, ui.gameOverTextSize);
    textSize(ui.gameOverTextSize);
    text("Game Over", ui.boardW / 2, ui.boardW / 2 - ui.tileW / 5);
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
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight)
  setUI(width, height);
}

function gameReset() {
  gameStart();
  spawnTile();
  spawnTile();
  data[0] = "0";
}

function gameStart() {
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
  cells.splice(0, 4);
  tiles.splice(0, 17);
}

function spawnTile() {
  let emptyCells = [];
  for (let rows of cells) {
    for (let cell of rows) {
      if (!cell.occupied) {
        let index = new Index(cell.c, cell.r);
        emptyCells.add(index);
      }
    }
  }
  if (emptyCells.length == 0) return;
  
  let range = -20000.0 / (score + 22000.0) + 2.0;
  let random = random(range);
  let exponent = floor(random) + 1;
  let index = emptyCells.get( floor( random( emptyCells.length ) ) );
  emptyCells.splice(0, emptyCells.length);
  
  createTile(index.c, index.r, exponent);
  //createTile(index.c, index.r, int(random(1, 20)));
}

function createTile(c, r, exp) {
  for (let tile of tiles) {
    if (!tile.active) {
      tile.create(c, r, exp);
      cells[c][r].setTile(tile.id);
      cells[c][r].exponent = exp;
      print("createTile() ");
      cells[c][r].update();
      occupied++;
      newTileIds.append(tile.id);
      break;
    }
  }
}

function calcMove(input) {
  let horizontal = (input == LEFT_ARROW || input == RIGHT_ARROW) ? true : false;
  let start, end, inc;
  if (input == LEFT_ARROW || input == UP_ARROW) { start = 1; end = 4; inc = 1; }
  else { start = 2; end = -1; inc = -1; }
  print("gameManager::calcMove() moving ");
  switch (input) {
    case LEFT: println("left"); break;
    case UP: println("up"); break;
    case RIGHT: println("right"); break;
    case DOWN: println("down"); break;
  }
  
  /** HORIZONTAL **/
  if (horizontal) {
    for (let r = 0; r < 4; r++) {
      println("processing row "+r+' ');
      for (let c = start; c != end; c += inc) {
        print("processing cell " + c + ' ' + r + ": ");
        let cell = cells[c][r];
        
        if (!cell.occupied) {
          println("empty");
          continue;
        }
        
        let newIndex = new Index(cell.c, cell.r);
        let move = false;
        let exponent = cell.exponent;
        for (let i = c - inc; 0 <= i && i < 4; i -= inc) {
          print("checking cell "+i+' '+r+' ');
          if (cells[i][r].occupied) {
            print("occupied ");
            if (cells[i][r].exponent == cell.exponent && !cells[i][r].isCombining) {
              print("equal ");
              newIndex.c = i;
              move = true;
              exponent++;
              score += pow(2, exponent);
              print("combining to exponent "+exponent+' ');
              cells[newIndex.c][newIndex.r].isCombining = true;
            }
            break;
          } else {
            print("empty ");
            newIndex.c = i;
            move = true;
          }
        }
        if (move) {
          cells[newIndex.c][newIndex.r].exponent = exponent;
          cells[c][r].empty();
          tiles[cell.tileId].goTo(newIndex.c, newIndex.r);
        }
        
        print('\n');
      }
    }
  } 
  /** VERTICAL **/
  else { 
    for (let c = 0; c < 4; c++) {
      println("processing column "+c+' ');
      for (let r = start; r != end; r += inc) {
        print("processing cell "+c+' '+r+": ");
        let cell = cells[c][r];
        
        if (!cell.occupied) {
          println("empty");
          continue;
        }
        
        let newIndex = new Index(cell.c, cell.r);
        let move = false;
        let exponent = cell.exponent;
        for (let i = r - inc; 0 <= i && i < 4; i -= inc) {
          print("checking cell "+c+' '+i+' ');
          if (cells[c][i].occupied) {
            print("occupied ");
            if (cells[c][i].exponent == cell.exponent && !cells[c][i].isCombining) {
              print("equal ");
              newIndex.r = i;
              move = true;
              exponent++;
              score += pow(2, exponent);
              print("combining to exponent "+exponent+' ');
              cells[newIndex.c][newIndex.r].setTile(cell.tileId);
            }
            break;
          } else {
            print("empty ");
            newIndex.r = i;
            move = true;
          }
        }
        if (move) {
          cells[newIndex.c][newIndex.r].exponent = exponent;
          cells[c][r].empty();
          tiles[cell.tileId].goTo(newIndex.c, newIndex.r);
        }
        
        print('\n');
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
  print("checkLoss() ");
  let movesAvailable = false;
  for (let i = 0; i < 4; i++) {
    let rexp = cells[i][0].exponent, cexp = cells[0][i].exponent;
    for (let j = 1; j < 4; j++) {
      let crexp = cells[i][j].exponent, ccexp = cells[j][i].exponent;
      if (crexp == rexp || ccexp == cexp) {
        movesAvailable = true;
        print("move available ");
        break;
      }
      rexp = crexp;
      cexp = ccexp;
    }
  }
  if (!movesAvailable) {
    gameOver();
    print("no moves available; game over");
  }
  print('\n');
}

function mouseClicked() {
  //spawnTile();
  if (mouseX > ui.newGameButtonPos.x - ui.newGameButtonSize.x / 2 && mouseX < ui.newGameButtonPos.x + ui.newGameButtonSize.x  / 2 && mouseY > ui.newGameButtonPos.y - ui.newGameButtonSize.y / 2 && mouseY < ui.newGameButtonPos.y + ui.newGameButtonSize.y / 2) {
    gameReset();
  }
}

function keyPressed() {
  if (!gameIsOver && (keyCode == UP || keyCode == DOWN || keyCode == RIGHT || keyCode == LEFT)) {
    while (animStage > 0) endAnim();
    startAnim();
    calcMove(keyCode);
  }
}

function setUI(w, h) {
  if (w / h <= 6 / 7) {
    ui.w = w;
    ui.h = ui.w * float(7 / 6)
  } else {
    ui.h = h;
    ui.w = ui.h * float(6 / 7);
  }
  
  ui.boardW = ui.w * 0.9;
  ui.boardMargin = (ui.w - ui.boardW) / 2;
  ui.cellMargin = ui.boardW * 0.025;
  ui.tileW = (ui.boardW - ui.cellMargin * 5) / 4;
  ui.cellSpacing = ui.cellMargin + ui.tileW;
  
  ui.newGameButtonPos = createVector(ui.w - ui.boardMargin - ui.cellMargin - ui.tileW / 2, ui.boardMargin + ui.tileW * 5 / 8);
  ui.newGameButtonSize = createVector(ui.tileW, ui.tileW / 4);
  ui.scoreBoxPos = createVector(ui.w - ui.boardMargin - ui.cellMargin - ui.tileW / 2, ui.boardMargin + ui.tileW /4 - 10);
  ui.highscoreBoxPos = createVector(ui.w - ui.boardMargin - ui.cellMargin * 2 - ui.tileW * 1.5, ui.boardMargin + ui.tileW /4 - 10);
  ui.scoreBoxSize = createVector(ui.tileW, ui.tileW / 2);
  
  ui.boardFillet = ui.boardMargin / 4;
  ui.tileFillet = ui.boardFillet;
  
  ui.tilePopF = (ui.tileW + ui.cellMargin * 2) / ui.tileW;
  ui.tileStartF = 0.2;

  ui.titleColour = color(0, 0, 100);  
  ui.menuColour = color(0, 0, 100);
  ui.bgColour = color(0, 0, 0);
  ui.boardColour = color(0, 0, 50);
  ui.cellColour = color(0, 0, 90);
  ui.numColour = color(0);
  
  ui.titleTextSize = ui.tileW;
  ui.numbersTextSize = ui.tileW / 20;
  ui.numbersTextOffset = ui.numbersTextSize;
  ui.scoreTextSize = ui.tileW / 6.5;
  ui.gameOverTextSize = ui.tileW / 2
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
    this.pos = createVector(ui.cellMargin + (ui.cellSpacing) * this.c, ui.cellMargin + (ui.cellSpacing) * this.r);
  }
  
  display() {
    fill(ui.cellColour);
    rect(this.pos.x, this.pos.y, ui.tileW, ui.tileW, ui.tileFillet);
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
    printId();
    print("update() ");
    print("exponent=" + this.exponent + ' ');
    if (this.isCombining) {
      tiles[this.newTileId].destroy();
      print("destroyed tile " + this.newTileId + ' ');
      poppingTileIds.append(this.tileId);
      this.isCombining = false;
    }
    tiles[this.tileId].setExp(this.exponent);
    println("tileId=" + this.tileId);
  }
  
  printId() {
    print("cells[" + this.c + "][" + this.r + "]::");
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
    this.textSize;
  }
  
  create(c, r, exp) {
    this.pos = createVector(ui.cellMargin + (ui.cellSpacing) * this.c + ui.tileW / 2, ui.cellMargin + (ui.cellSpacing) * this.r + ui.tileW / 2);
    this.targetPos = createVector(this.pos.x, this.pos.y);
    this.vel = createVector(0, 0);
    setExp(exp);
    this.scaleF = ui.tileStartF;
    this.active = true;
  }
  
  destroy() {
    this.active = false;
  }
  
  display() {
    push();
    translate(this.pos.x, this.pos.y);
    scale(this.scaleF);
    
    fill(ui.tileColours[exponent-1]);
    rect(-ui.tileW / 2, -ui.tileW / 2, ui.tileW, ui.tileW, ui.tileFillet);
    
    textSize(this.textSize);
    fill(ui.numColour);
    text(int(pow(2, this.exponent)), -2, this.textSize * 0.4);
    
    pop();
  }
  
  goTo(c, r) {
    print("transferring tile " + this.id + " to " + this.c + " " + this.r + ' ');
    this.targetPos.set(cells[c][r].pos).add(ui.tileW/2, ui.tileW/2);
    this.vel.set(this.targetPos).sub(this.pos).div(settings.moveFrames);
    movingTileIds.append(this.id);
    cells[c][r].setTile(this.id);
  }
  
  setExp(exp) {
    this.exponent = exp;
    
    textSize = ui.numbersTextSize;
    if (this.exponent > 6) {
      let log = int(log(pow(2, this.exp)) / log(10)) + 1;
      textSize -= ui.numbersFontOffset * (log - 1);
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