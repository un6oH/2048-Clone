var score, highscore, occupied;
let gameActive, gameOver;
var animStage, animTimer;
var data;

var format;
var settings;

const cells = [[]];
const tiles = [];
const newTileIds = [];
const movingTileIds = [];
const poppingTileIds = [];

function setup(){
  createCanvas(600, 700);
  colorMode(HSB, 360, 100, 100, 100);
  format = new Format(width, height);
  settings = new Settings();
  
  background(0);
  
  gameStart();
  loadGame();
}

function draw() {
  background(format.bgColour);
  noStroke();
  
  //title
  textFont(format.titleFont);
  fill(format.titleColour);
  textAlign(CORNER);
  text("2048", format.boardMargin + format.cellMargin - 10, format.titleFont.getSize() - 10);
  
  //scores
  fill(format.cellColour);
  rectMode(CENTER);
  textFont(format.scoreFont);
  
  rect(format.newGameButtonPos.x, format.newGameButtonPos.y, format.newGameButtonSize.x, format.newGameButtonSize.y, format.tileFillet);
  rect(format.scoreBoxPos.x, format.scoreBoxPos.y, format.scoreBoxSize.x, format.scoreBoxSize.y, format.tileFillet);
  rect(format.highscoreBoxPos.x, format.highscoreBoxPos.y, format.scoreBoxSize.x, format.scoreBoxSize.y, format.tileFillet);
  
  fill(0);
  textAlign(CENTER);
  text("New Game", format.newGameButtonPos.x, format.newGameButtonPos.y + 7);
  text("Score", format.scoreBoxPos.x, format.scoreBoxPos.y - 5);
  text(score, format.scoreBoxPos.x, format.scoreBoxPos.y + 20);
  text("Best", format.highscoreBoxPos.x, format.highscoreBoxPos.y - 5);
  text(highscore, format.highscoreBoxPos.x, format.highscoreBoxPos.y + 20);
  //buttons
  
  
  //board
  pushMatrix();
  translate(format.boardMargin, height - format.boardW - format.boardMargin);
  textAlign(CENTER);
  rectMode(CORNER);
  
  fill(format.boardColour);
  rect(0, 0, format.boardW, format.boardW, format.boardFillet);
  for (let row of cells) {
    for (let cell of row) {
      cell.display();
    }
  }
  textFont(format.numbersFont);
  for (let tile of tiles) {
    if (tile.active) {
      tile.display();
    }
  }
  
  if (gameOver) {
    fill(0, 0, 0, 50);
    rect(0, 0, format.boardW, format.boardW, format.boardFillet);
    
    fill(0, 0, 100, 100);
    textFont(format.gameOverTextFont);
    text("Game Over", format.boardW / 2, format.boardW / 2 - format.tileW / 5);
  }
  
  popMatrix();
  
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
      if (!gameOver) saveGame();
    }
    animTimer--;
  }
}

function gameReset() {
  gameStart();
  spawnTile();
  spawnTile();
  data[0] = "0";
  saveStrings(dataPath("data.txt"), data);
}

function gameStart() {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      cells[c][r] = new Cell(c, r);
    }
  }
  for (let i = 0; i < 17; i++) {
    tiles[i] = new Tile(i);
  }
  
  score = 0;
  occupied = 0;
  
  gameOver = false;
  animStage = 2;
  animTimer = settings.tilePopFrames;
}

function gameOver() {
  gameOver = true;
  data[0] = "0";
  saveStrings(dataPath("data.txt"), data);
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
  if (emptyCells.size() == 0) return;
  
  let range = -20000.0 / (score + 22000.0) + 2.0;
  let random = random(range);
  let exponent = floor(random) + 1;
  let index = emptyCells.get( floor( random( emptyCells.size() ) ) );
  emptyCells.clear();
  
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
    if (movingTileIds.size() != 0) spawnTile();
    if (occupied == 16) {
      checkLoss();
    }
    occupied = 0;
    
    for (let i of movingTileIds) {
      tiles[i].pos.set(tiles[i].targetPos);
    }
    movingTileIds.clear();
    for (let i of poppingTileIds) {
      tiles[i].scaleF = format.tilePopF;
    }
    
    animStage = 2;
  } else {
    for (let i of poppingTileIds) {
      tiles[i].scaleF = 1;
    }
    for (let i of newTileIds) {
      tiles[i].scaleF = 1;
    }
    poppingTileIds.clear();
    newTileIds.clear();
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
  if (mouseX > format.newGameButtonPos.x - format.newGameButtonSize.x / 2 && mouseX < format.newGameButtonPos.x + format.newGameButtonSize.x  / 2 && mouseY > format.newGameButtonPos.y - format.newGameButtonSize.y / 2 && mouseY < format.newGameButtonPos.y + format.newGameButtonSize.y / 2) {
    gameReset();
  }
}

function keyPressed() {
  if (!gameOver && (keyCode == UP || keyCode == DOWN || keyCode == RIGHT || keyCode == LEFT)) {
    while (animStage > 0) endAnim();
    startAnim();
    calcMove(keyCode);
  }
}

class Format {
  constructor (w_, h_) {
    this.w = w_;
    this.h = h_;
    
    this.boardW = this.w * 0.9;
    this.boardMargin = (this.w - this.boardW) / 2;
    this.cellMargin = this.boardW * 0.025;
    this.tileW = (this.boardW - this.cellMargin * 5) / 4;
    this.cellSpacing = this.cellMargin + this.tileW;
    
    this.newGameButtonPos = createVector(this.w - this.boardMargin - this.cellMargin - this.tileW / 2, this.boardMargin + this.tileW * 5 / 8);
    this.newGameButtonSize = createVector(this.tileW, this.tileW / 4);
    this.scoreBoxPos = createVector(this.w - this.boardMargin - this.cellMargin - this.tileW / 2, this.boardMargin + this.tileW /4 - 10);
    this.highscoreBoxPos = createVector(this.w - this.boardMargin - this.cellMargin * 2 - this.tileW * 1.5, this.boardMargin + this.tileW /4 - 10);
    this.scoreBoxSize = createVector(this.tileW, this.tileW / 2);
    
    this.boardFillet = this.boardMargin / 4;
    this.tileFillet = this.boardFillet;
    
    this.tilePopF = (this.tileW + this.cellMargin * 2) / this.tileW;
    
    this.titleFont = loadFont("SansSerif.bold", this.tileW);
    this.numbersFont = loadFont("SansSerif.bold", this.tileW / 2);
    this.numbersFontOffset = this.tileW / 20;
    this.scoreFont = loadFont("SansSerif.bold", 20);
    this.gameOverTextFont = loadFont("SansSerif.bold", tileW / 2);
    
    this.scoreTextSize = this.scoreFont.getSize();

    this.tileColours = [];
    for (let i = 0; i < 10; i++) this.tileColours[i] = color(60 + 30 * i, 25, 100);
    for (let i = 0; i < 10; i++) this.tileColours[i+10] = color(30 * i, 50, 100);
  }
}

class Settings {
  constructor() {
    this.moveFrames = 10;
    this.tilePopFrames = 5;
    this.appearFrames = 5;
    this.animFrames = this.moveFrames + this.tilePopFrames;
    this.highscore = 0;
  }
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
    this.pos = createVector(format.cellMargin + (format.cellSpacing) * this.c, format.cellMargin + (format.cellSpacing) * this.r);
  }
  
  display() {
    fill(format.cellColour);
    rect(this.pos.x, this.pos.y, format.tileW, format.tileW, this.format.tileFillet);
    //if (occupied) {
    //  fill(0);
    //  text(int(pow(2, exponent)), pos.x + format.tileW / 2, pos.y + format.tileW / 2 + format.numbersFont.getSize() * 0.4);
    //}
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
    this.pos = createVector(format.cellMargin + (format.cellSpacing) * this.c + format.tileW / 2, format.cellMargin + (format.cellSpacing) * this.r + format.tileW / 2);
    this.targetPos = createVector(this.pos.x, this.pos.y);
    this.vel = createVector(0, 0);
    setExp(exp);
    this.scaleF = format.tileStartF;
    this.active = true;
  }
  
  destroy() {
    this.active = false;
  }
  
  display() {
    pushMatrix();
    translate(this.pos.x, this.pos.y);
    scale(this.scaleF);
    
    fill(format.tileColours[exponent-1]);
    rect(-format.tileW / 2, -format.tileW / 2, format.tileW, format.tileW, format.tileFillet);
    
    textSize(this.textSize);
    fill(format.numColour);
    text(int(pow(2, this.exponent)), -2, this.textSize * 0.4);
    
    popMatrix();
  }
  
  goTo(c, r) {
    print("transferring tile " + this.id + " to " + this.c + " " + this.r + ' ');
    this.targetPos.set(cells[c][r].pos).add(format.tileW/2, format.tileW/2);
    this.vel.set(this.targetPos).sub(this.pos).div(settings.moveFrames);
    movingTileIds.append(this.id);
    cells[c][r].setTile(this.id);
  }
  
  setExp(exp) {
    this.exponent = exp;
    
    textSize = format.numbersFont.getSize();
    if (this.exponent > 6) {
      let log = int(log(pow(2, this.exp)) / log(10)) + 1;
      textSize -= format.numbersFontOffset * (log - 1);
    }
  }
  
  appear() {
    this.scaleF += (1 - format.tileStartF) / settings.appearFrames;
  }
  
  move() {
    this.pos.add(this.vel);
  }
  
  pop() {
    this.scaleF -= (format.tilePopF - 1) / settings.tilePopFrames;
  }
}