int score, highscore, occupied;
boolean gameActive, gameOver;
int animStage, animTimer;
String[] data;

Format format;
Settings settings;

Cell[][] cells = new Cell[4][4];
Tile[] tiles = new Tile[17];
IntList newTileIds = new IntList();
IntList movingTileIds = new IntList();
IntList poppingTileIds = new IntList();

void setup(){
  size(600, 700);
  colorMode(HSB, 360, 100, 100, 100);
  format = new Format(width, height);
  settings = new Settings();
  
  background(0);
  
  gameStart();
  loadGame();
}

void draw() {
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
  for (Cell[] row: cells) {
    for (Cell cell: row) {
      cell.display();
    }
  }
  textFont(format.numbersFont);
  for (Tile tile: tiles) {
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
      for (int i: movingTileIds) tiles[i].move();
    } else {
      endAnim();
    }
    animTimer--;
  } else if (animStage == 2) {
    if (animTimer <= settings.tilePopFrames && animTimer > 0) {
      for (int i: poppingTileIds) tiles[i].pop();
      for (int i: newTileIds) tiles[i].appear();
    } else {
      endAnim();
      if (!gameOver) saveGame();
    }
    animTimer--;
  }
}

void gameReset() {
  gameStart();
  spawnTile();
  spawnTile();
  data[0] = "0";
  saveStrings(dataPath("data.txt"), data);
}

void gameStart() {
  for (int r = 0; r < 4; r++) {
    for (int c = 0; c < 4; c++) {
      cells[c][r] = new Cell(c, r);
    }
  }
  for (int i = 0; i < 17; i++) {
    tiles[i] = new Tile(i);
  }
  
  score = 0;
  occupied = 0;
  
  gameOver = false;
  animStage = 2;
  animTimer = settings.tilePopFrames;
}

void gameOver() {
  gameOver = true;
  data[0] = "0";
  saveStrings(dataPath("data.txt"), data);
}

void spawnTile() {
  ArrayList<Index> emptyCells = new ArrayList<Index>();
  for (Cell[] rows: cells) {
    for (Cell cell: rows) {
      if (!cell.occupied) {
        Index index = new Index(cell.c, cell.r);
        emptyCells.add(index);
      }
    }
  }
  if (emptyCells.size() == 0) return;
  
  float range = -20000.0 / (score + 22000.0) + 2.0;
  float random = random(range);
  int exponent = floor(random) + 1;
  Index index = emptyCells.get( floor( random( emptyCells.size() ) ) );
  emptyCells.clear();
  
  createTile(index.c, index.r, exponent);
  //createTile(index.c, index.r, int(random(1, 20)));
}

void createTile(int c, int r, int exp) {
  for (Tile tile: tiles) {
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

void calcMove(int input) {
  boolean horizontal = (input == LEFT || input == RIGHT) ? true : false;
  int start, end, inc;
  if (input == LEFT || input == UP) { start = 1; end = 4; inc = 1; }
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
    for (int r = 0; r < 4; r++) {
      println("processing row "+r+' ');
      for (int c = start; c != end; c += inc) {
        print("processing cell "+c+' '+r+": ");
        Cell cell = cells[c][r];
        
        if (!cell.occupied) {
          println("empty");
          continue;
        }
        
        Index newIndex = new Index(cell.c, cell.r);
        boolean move = false;
        int exponent = cell.exponent;
        for (int i = c - inc; 0 <= i && i < 4; i -= inc) {
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
    for (int c = 0; c < 4; c++) {
      println("processing column "+c+' ');
      for (int r = start; r != end; r += inc) {
        print("processing cell "+c+' '+r+": ");
        Cell cell = cells[c][r];
        
        if (!cell.occupied) {
          println("empty");
          continue;
        }
        
        Index newIndex = new Index(cell.c, cell.r);
        boolean move = false;
        int exponent = cell.exponent;
        for (int i = r - inc; 0 <= i && i < 4; i -= inc) {
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

void startAnim() {
  animStage = 1;
  animTimer = settings.animFrames;
}

void endAnim() {
  if (animStage == 1) {
    for (Cell[] row: cells) {
      for (Cell cell: row) {
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
    
    for (int i: movingTileIds) {
      tiles[i].pos.set(tiles[i].targetPos);
    }
    movingTileIds.clear();
    for (int i: poppingTileIds) {
      tiles[i].scaleF = format.tilePopF;
    }
    
    animStage = 2;
  } else {
    for (int i: poppingTileIds) {
      tiles[i].scaleF = 1;
    }
    for (int i: newTileIds) {
      tiles[i].scaleF = 1;
    }
    poppingTileIds.clear();
    newTileIds.clear();
    animStage = 0;
  }
}

void checkLoss() {
  print("checkLoss() ");
  boolean movesAvailable = false;
  for (int i = 0; i < 4; i++) {
    int rexp = cells[i][0].exponent, cexp = cells[0][i].exponent;
    for (int j = 1; j < 4; j++) {
      int crexp = cells[i][j].exponent, ccexp = cells[j][i].exponent;
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

void loadGame() {
  data = loadStrings("data.txt");
  highscore = Integer.parseInt(data[1]);
  if (int(data[0]) == 0) {
    spawnTile();
    spawnTile();
    return;
  }
  score = Integer.parseInt(data[2]);
  for (int r = 0; r < 4; r++) {
    String[] row = split(data[r+3], ';');
    for (int c = 0; c < 4; c++) {
      String[] cellData = split(row[c], ',');
      int exponent = Integer.parseInt(cellData[0]);
      if (exponent != 0) {
        int tileId = Integer.parseInt(cellData[1]);
        tiles[tileId].create(c, r, exponent);
        cells[c][r].exponent = exponent;
        cells[c][r].setTile(tileId);
        cells[c][r].update();
        newTileIds.append(tileId);
      }
    }
  }
}

void saveGame() {
  data[0] = "1";
  data[1] = str(highscore);
  data[2] = str(score);
  for (int r = 0; r < 4; r++) {
    String row = "";
    for (int c = 0; c < 4; c++) {
      row += cells[c][r].exponent + "," + cells[c][r].tileId;
      if (c < 3) row += ";";
    }
    data[r+3] = row;
  }
  
  try {
    saveStrings(dataPath("data.txt"), data);
  } catch (NullPointerException e) {
    println("saveGame() saveStrings failed");
  }
  println("saveGame()");
}

void mouseClicked() {
  //spawnTile();
  if (mouseX > format.newGameButtonPos.x - format.newGameButtonSize.x / 2 && mouseX < format.newGameButtonPos.x + format.newGameButtonSize.x  / 2 && mouseY > format.newGameButtonPos.y - format.newGameButtonSize.y / 2 && mouseY < format.newGameButtonPos.y + format.newGameButtonSize.y / 2) {
    gameReset();
  }
}

void keyPressed() {
  if (!gameOver && (keyCode == UP || keyCode == DOWN || keyCode == RIGHT || keyCode == LEFT)) {
    while (animStage > 0) endAnim();
    startAnim();
    calcMove(keyCode);
  }
}

class Format {
  int w, h;
  float boardMargin, boardW, cellMargin, tileW, cellSpacing, boardFillet, tileFillet;
  
  PFont titleFont, numbersFont, scoreFont, gameOverTextFont;
  float numbersFontOffset;
  color titleColour = color(0, 0, 100);  
  color menuColour = color(0, 0, 100);
  color bgColour = color(0, 0, 0);
  color boardColour = color(0, 0, 50);
  color cellColour = color(0, 0, 90);
  color[] tileColours = new color[20];
  color numColour = color(0);
  
  float tilePopF;
  float tileStartF = 0.2;
  
  PVector newGameButtonPos, newGameButtonSize;
  PVector saveGameButtonPos, saveGameButtonSize;
  PVector scoreBoxPos;
  PVector highscoreBoxPos;
  PVector scoreBoxSize;
  
  float scoreTextSize;
  
  Format (int w_, int h_) {
    w = w_;
    h = h_;
    
    boardW = w * 0.9;
    boardMargin = (w - boardW) / 2;
    cellMargin = boardW * 0.025;
    tileW = (boardW - cellMargin * 5) / 4;
    cellSpacing = cellMargin + tileW;
    
    newGameButtonPos = new PVector(w - boardMargin - cellMargin - tileW / 2, boardMargin + tileW * 5 / 8);
    newGameButtonSize = new PVector(tileW, tileW / 4);
    scoreBoxPos = new PVector(w - boardMargin - cellMargin - tileW / 2, boardMargin + tileW /4 - 10);
    highscoreBoxPos = new PVector(w - boardMargin - cellMargin * 2 - tileW * 1.5, boardMargin + tileW /4 - 10);
    scoreBoxSize = new PVector(tileW, tileW / 2);
    
    boardFillet = boardMargin / 4;
    tileFillet = boardFillet;
    
    tilePopF = (tileW + cellMargin * 2) / tileW;
    
    titleFont = createFont("SansSerif.bold", tileW);
    numbersFont = createFont("SansSerif.bold", tileW/2);
    numbersFontOffset = tileW/20;
    scoreFont = createFont("SansSerif.bold", 20);
    gameOverTextFont = createFont("SansSerif.bold", tileW / 2);
    
    scoreTextSize = scoreFont.getSize();

    for (int i = 0; i < 10; i++) tileColours[i] = color(60 + 30 * i, 25, 100);
    for (int i = 0; i < 10; i++) tileColours[i+10] = color(30 * i, 50, 100);
  }
}

class Settings {
  int moveFrames = 10;
  int tilePopFrames = 5;
  int appearFrames = 5;
  int animFrames = moveFrames + tilePopFrames;
  int highscore = 0;
}

class Cell {
  int c, r, exponent, tileId, newTileId;
  PVector pos;
  boolean occupied = false, isCombining = false;
  
  Cell(int x_, int y_) {
    c = x_;
    r = y_;
    pos = new PVector(format.cellMargin + (format.cellSpacing) * c, format.cellMargin + (format.cellSpacing) * r);
  }
  
  void display() {
    fill(format.cellColour);
    rect(pos.x, pos.y, format.tileW, format.tileW, format.tileFillet);
    //if (occupied) {
    //  fill(0);
    //  text(int(pow(2, exponent)), pos.x + format.tileW / 2, pos.y + format.tileW / 2 + format.numbersFont.getSize() * 0.4);
    //}
  }
  
  void empty() {
    occupied = false;
    exponent = 0;
  }
  
  void setTile(int id) {
    if (occupied) {
      newTileId = id;
      isCombining = true;
    } else {
      occupied = true;
      tileId = id;
    }
  }
  
  void update() {
    printId();
    print("update() ");
    print("exponent="+exponent+' ');
    if (isCombining) {
      tiles[newTileId].destroy();
      print("destroyed tile "+newTileId+' ');
      poppingTileIds.append(tileId);
      isCombining = false;
    }
    tiles[tileId].setExp(exponent);
    print("tileId="+tileId);
    print('\n');
  }
  
  void printId() {
    print("cells["+c+"]["+r+"]::");
  }
}

class Index {
  int c, r;
  Index(int x_, int y_) {
    c = x_;
    r = y_;
  }
}

class Tile {
  int id, exponent;
  boolean active = false;
  PVector pos, targetPos, vel;
  float scaleF, textSize;
  Tile (int i) {
    id = i;
  }
  
  void create(int c, int r, int exp) {
    pos = new PVector(format.cellMargin + (format.cellSpacing) * c + format.tileW / 2, format.cellMargin + (format.cellSpacing) * r + format.tileW / 2);
    targetPos = new PVector(pos.x, pos.y);
    vel = new PVector(0, 0);
    setExp(exp);
    scaleF = format.tileStartF;
    active = true;
  }
  
  void destroy() {
    active = false;
  }
  
  void display() {
    pushMatrix();
    translate(pos.x, pos.y);
    scale(scaleF);
    
    fill(format.tileColours[exponent-1]);
    rect(-format.tileW / 2, -format.tileW / 2, format.tileW, format.tileW, format.tileFillet);
    
    textSize(textSize);
    fill(format.numColour);
    text(int(pow(2, exponent)), -2, textSize * 0.4);
    
    popMatrix();
  }
  
  void goTo(int c, int r) {
    print("transferring tile "+id+" to "+c+" "+r+' ');
    targetPos.set(cells[c][r].pos).add(format.tileW/2, format.tileW/2);
    vel.set(targetPos).sub(pos).div(settings.moveFrames);
    movingTileIds.append(id);
    cells[c][r].setTile(id);
  }
  
  void setExp(int exp) {
    exponent = exp;
    
    textSize = format.numbersFont.getSize();
    if (exponent > 6) {
      int log = int(log(pow(2, exp)) / log(10)) + 1;
      textSize -= format.numbersFontOffset * (log - 1);
    }
  }
  
  void appear() {
     scaleF += (1f - format.tileStartF) / settings.appearFrames;
  }
  
  void move() {
    pos.add(vel);
  }
  
  void pop() {
    scaleF -= (format.tilePopF - 1) / settings.tilePopFrames;
  }
}