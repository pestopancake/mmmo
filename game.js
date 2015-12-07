var d = {
    rows: 100,
    cols: 100,
    width: 16,
    height: 16,
    mapWidth: 1,
    mapHeight: 1,
    showRows: 20,
    showCols: 20
}

var imgsrc = "http://46.101.17.224/img/";

s = {
    blank: new Image(),
    bombClicked: new Image(),
    bomb: new Image(),
    flag: new Image(),
    open: [],
}
s.blank.src = imgsrc + "blank.gif";
s.bomb.src = imgsrc + "bombrevealed.gif";
s.flag.src = imgsrc + "bombflagged.gif";
s.bombClicked.src = imgsrc + "bombdeath.gif";

for (i = 0; i <= 8; ++i) {
    s['open' + i] = new Image();
    s['open' + i].src = imgsrc + 'open' + i + '.gif';
}

var grid = [];
var oldGrid = [];
var isGameOver = false;
var canvas;
var c;
var offset = {
    x: 0,
    y: 0
};

var socket = io();

window.onload = function() {
    canvas = document.getElementById('gcanvas');
    c = canvas.getContext('2d');

    canvas.style.width = (d.showRows * d.width) + "px";
    canvas.style.height = (d.showCols * d.height) + "px";
    c.canvas.width = d.showRows * d.width;
    c.canvas.height = d.showCols * d.height;

    canvas.addEventListener('mousedown', mouseDown, false);
    canvas.addEventListener('mouseup', mouseUp, false);

    mapCanvas = document.getElementById('mapCanvas');
    mapC = mapCanvas.getContext('2d');
    
    mapCanvas.style.width = (d.rows * d.mapWidth) + "px";
    mapCanvas.style.height = (d.cols * d.mapHeight) + "px";
    mapC.canvas.width = d.rows * d.mapWidth;
    mapC.canvas.height = d.cols * d.mapHeight;
    
    mapCanvas.addEventListener('mousedown', mapMouseDown, false);
    mapCanvas.addEventListener('mouseup', mapMouseUp, false);
    mapCanvas.addEventListener('mousemove', mapMouseMove, false);

    socket.on('draw', function(newGrid) {
        if (!isGameOver) $('#face').removeClass('dead');
        oldGrid = grid;
        grid = newGrid;
        d.rows = grid.length;
        d.cols = grid[0].length;
        drawCanvas();
    });
    
    setInterval(drawMapCanvas, 100);

}

var mapIsMouseDown = false;
var mouseE = undefined;

function drawMapCanvas(force) {
  
    if(mapIsMouseDown) {
      var coord = getMapCoordFromMouse(mouseE);
      var row = coord.row;
      var col = coord.col;

      if (isTile(row, col)) {
        offset.x = row * d.width;
        offset.y = col * d.height;
      }
      
      drawCanvas(true);
    }
  
    for (row in grid) {
        for (col in grid[row]) {
            if (mapIsMouseDown || force || !isOldTile(row, col) || (grid[row][col].state != oldGrid[row][col].state)) {
                drawMapTile(row, col);
            }
        }
    }
    mapC.fillStyle = "rgba(255,100,100,0.7)";
    mapC.fillRect(offset.x / d.width, offset.y / d.width, 20, 20);
}

function drawMapTile(row, col) {
    var x = (row * d.width) - offset.x;
    var y = (col * d.height) - offset.y;
    if (grid[row][col].state == 'blank') {
        mapC.fillStyle = "#000000";
    } else {
        mapC.fillStyle = "#990000";
    }
    mapC.fillRect(row, col, d.mapWidth, d.mapHeight);
}




var moveX = 0;
var moveY = 0;
var moveBy = d.height / 2;

document.onkeydown = function(e) {

    e = e || window.event;

    if (e.keyCode == '38') {
        moveY = -moveBy;
    }
    else if (e.keyCode == '40') {
        moveY = moveBy;
    }
    else if (e.keyCode == '37') {
        moveX = -moveBy;
    }
    else if (e.keyCode == '39') {
        moveX = moveBy;
    }

    move(moveX, moveY);

}

document.onkeyup = function(e) {

    e = e || window.event;

    if (e.keyCode == '38') {
        moveY = 0;
    }
    else if (e.keyCode == '40') {
        moveY = 0;
    }
    else if (e.keyCode == '37') {
        moveX = 0;
    }
    else if (e.keyCode == '39') {
        moveX = 0;
    }

}

function move(x, y) {
    if (offset.x + x >= 0 && offset.x + x <= (d.rows * d.width) - (d.showRows * d.width)) {
        offset.x += x;
    }
    if (offset.y + y >= 0 && offset.y + y <= (d.cols * d.height) - (d.showCols * d.height)) {
        offset.y += y;
    }
    drawCanvas(true);
}

function drawCanvas(force) {
    isGameOver = false;
    //c.clearRect(0,0,d.rows * d.width,d.rows * d.width);
    for (row in grid) {
        for (col in grid[row]) {
            if (force || !isOldTile(row, col) || (grid[row][col].state != oldGrid[row][col].state)) {
                drawTile(row, col);
            }
        }
    }
    $('#face').removeClass('ooh');
}

function drawTile(row, col) {
    var x = (row * d.width) - offset.x;
    var y = (col * d.height) - offset.y;
    if (x > -d.width && y > -d.height && x < (d.showRows * d.width) + offset.x && y < (d.showCols * d.height) + offset.y) {
        c.drawImage(s[grid[row][col].state], x, y);
        if (grid[row][col].state == 'bomb' || grid[row][col].state == 'bombClicked') {
            if (!isGameOver) gameOver();
        }
    }
}

var clickRow;
var clickCol;
var doc = document.documentElement;

function getCoordFromMouse(e) {
    var scrollLeft = (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0);
    var scrollTop = (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);
    var row = Math.floor((e.x - canvas.offsetLeft + scrollLeft + offset.x) / d.width);
    var col = Math.floor((e.y - $(canvas).offset().top + scrollTop + offset.y) / d.height);
    return {
        row: row,
        col: col
    };
}

function getMapCoordFromMouse(e) {
    var scrollLeft = (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0);
    var scrollTop = (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);
    var row = Math.floor((e.x - mapCanvas.offsetLeft + scrollLeft - (d.showRows / 2)));
    var col = Math.floor((e.y - mapCanvas.offsetTop + scrollTop - (d.showCols / 2)));
    return {
        row: row,
        col: col
    };
}

function mouseDown(e) {

    var coord = getCoordFromMouse(e);
    var row = coord.row;
    var col = coord.col;
    console.log('down' + row + ',' + col);

    if (isTile(row, col) && grid[row][col].state == 'blank') {
        $('#face').addClass('ooh');
        $('#face').removeClass('dead');
        clickRow = row;
        clickCol = col;
        if (e.button == 2) {
            grid[row][col].state = 'flag';
        }
        else {
            grid[row][col].state = 'open0';
        }
        drawTile(row, col);
    }
}

function mouseUp(e) {

    var coord = getCoordFromMouse(e);
    var row = coord.row;
    var col = coord.col;
    console.log('up' + row + ',' + col);

    if (isTile(row, col) && row == clickRow && col == clickCol) {
        if (e.button == 2) {
            socket.emit('rightClick', {
                x: row,
                y: col
            });
        }
        else {
            socket.emit('click', {
                x: row,
                y: col
            });
        }
    }
    else if (clickRow != undefined && clickCol != undefined) {
        $('#face').removeClass('ooh');
        grid[clickRow][clickCol].state = 'blank';
        drawTile(clickRow, clickCol);
    }
    clickRow = undefined;
    clickCol = undefined;
}

function mapMouseMove(e) {
  mouseE = e;
}

function mapMouseDown(e) {
  mapIsMouseDown = true;
}

function mapMouseUp(e) {
  mapIsMouseDown = false;
}

function isTile(row, col) {
    if (grid[row] != undefined && grid[row][col] != undefined) {
        return true;
    }
    return false;
}

function isOldTile(row, col) {
    if (oldGrid[row] != undefined && oldGrid[row][col] != undefined) {
        return true;
    }
    return false;
}

var checkThese = [];

function updateState(row, col) {
    if (isTile(row, col) && grid[row][col].state == s.blank) {
        if (grid[row][col].isBomb) {
            grid[row][col].state = s.bombClicked;
            gameOver();
        }
        else {
            var bombCount = 0;
            for (var crow = row - 1; crow <= row + 1; ++crow) {
                for (var ccol = col - 1; ccol <= col + 1; ++ccol) {
                    if ((crow != row | ccol != col) && isTile(crow, ccol)) {
                        if (grid[crow][ccol].isBomb) {
                            ++bombCount;
                        }
                    }
                }
            }
            grid[row][col].state = s.open[bombCount];

            if (bombCount == 0) {
                for (var crow = row - 1; crow <= row + 1; ++crow) {
                    for (var ccol = col - 1; ccol <= col + 1; ++ccol) {
                        if (isTile(crow, ccol)) {
                            updateState(crow, ccol);
                        }
                    }
                }
            }

        }
    }
}

function gameOver() {
    isGameOver = true;
    $('#face').removeClass('ooh');
    $('#face').addClass('dead');
}
