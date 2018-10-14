//require('daemon')();
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use('/img', express.static(__dirname + '/img'));
app.use('/js', express.static(__dirname + '/js'));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.get('/game.js', function(req, res){
  res.sendFile(__dirname + '/game.js');
});

io.on('connection', function(socket){
  console.log('a user connected');
  drawCanvas();
  socket.on('click', function(click){

    if(isGameOver) {
        isGameOver = false;
        init();
        return true;
    }

    checkThese = [];
    console.log('click ' + click.x +','+ click.y);
    updateState(click.x, click.y);

    drawCanvas();

  });

  socket.on('rightClick', function(click){
    if(isTile(click.x, click.y)){
      grid[click.x][click.y].state = s.flag;
      drawCanvas();
    }
  });

});

http.listen(process.env.PORT || 8000, function(){
  console.log('listening' + process.env.PORT);
});











var d = {
    rows: 100,
    cols: 100,
    width: 16,
    height: 16,
    bombChance: 0.1
}

var imgsrc = "/img/";

s = {
    blank: {src: imgsrc + "blank.gif"},
    bombClicked: {src: imgsrc + "bombrevealed.gif"},
    bomb: {src: imgsrc + "bombdeath.gif"},
    flag: {src: imgsrc + "bombflagged.gif"},
    open: [],
};

s = {
    blank: 'blank',
    bombClicked: 'bombClicked',
    bomb: 'bomb',
    flag: 'flag',
    open: [],
};

for(i=0;i<=8;++i){
    s.open[i] = {};
    s.open[i] = 'open' + i;
}

var grid = [];
var isGameOver = false;

function init() {
    for(row=0;row<d.rows;++row) {
        grid[row] = [];
        for(col=0;col<d.cols;++col) {
            grid[row][col] = {
                state: s.blank,
                isBomb: (Math.random()<d.bombChance)
            }
        }
    }
    drawCanvas();
}

function drawCanvas() {
    io.emit('draw', grid);
}

function isTile(row, col){
    if(grid[row] != undefined && grid[row][col] != undefined) {
        return true;
    }
    return false;
}

var checkThese = [];

function updateState(row,col) {
    if(isTile(row,col) && grid[row][col].state == s.blank) {
        if(grid[row][col].isBomb) {
            grid[row][col].state = s.bombClicked;
            gameOver();
        }else{
            var bombCount = 0;
            for(var crow=row-1;crow<=row+1;++crow) {
                for(var ccol=col-1;ccol<=col+1;++ccol) {
                    if((crow != row | ccol != col) && isTile(crow, ccol)) {
                        if(grid[crow][ccol].isBomb){
                            ++bombCount;
                        }
                    }
                }
            }
            grid[row][col].state = s.open[bombCount];

            if(bombCount == 0) {
                for(var crow=row-1;crow<=row+1;++crow) {
                    for(var ccol=col-1;ccol<=col+1;++ccol) {
                        if(isTile(crow, ccol)) {
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
    for(row in grid) {
        for(col in grid[row]) {

            if(grid[row][col].state == s.blank) {
                if(grid[row][col].isBomb) {
                    grid[row][col].state = s.bomb;
                }else{

                }
            }
        }
    }
    drawCanvas();
}

init();
