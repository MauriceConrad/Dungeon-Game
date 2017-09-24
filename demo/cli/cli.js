const readline = require('readline');
const cliArgs = require('command-line-args');

const Render = require('./render');
const fs = require('fs');

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

const Game = require("./../../");


const options = cliArgs([
  {
    name: "serial",
    alias: "s",
    type: String
  }
]);

var movementKeys = {
  "w": {
    x: 0,
    y: -1
  },
  "d": {
    x: 1,
    y: 0
  },
  "s": {
    x: 0,
    y: 1
  },
  "a": {
    x: -1,
    y: 0
  }
}

var gameName = "dungeon-game";
var sessionFileName = options.serial ? options.serial : (gameName + "-" + (new Date().getTime()) + ".json");

var serial = {};
var myGame;

fs.readFile(sessionFileName, "utf8", function(err, contents) {
  if (err) {

  }
  else {
    serial = JSON.parse(contents);
  }
  initGame();
});




process.stdin.on('keypress', function (ch, key) {
  if (key && "name" in key) {

    if (key.name in movementKeys) {
      if (key.shift) {
        myGame.attack(movementKeys[key.name].x, movementKeys[key.name].y);
      }
      else if (key.ctrl) {
        var newSerial = myGame.serialize();
        fs.writeFile(sessionFileName, JSON.stringify(newSerial, null, 2), function(err) {
          if (err) throw err;
        });
      }
      else {
        myGame.move(movementKeys[key.name].x, movementKeys[key.name].y);
      }
    }
  }
  if (key && key.ctrl && key.name == 'c') {
    readline.cursorTo(process.stdout, 0, process.stdout.rows);
    process.stdin.pause();
    process.exit();
  }
});


function initGame() {


  myGame = new Game({
    serial: serial,
    width: 24,
    height: 24
  });


  myGame.on("render", function(game) {

    var print = Render(game);

    process.stdout.write(print.write);

    readline.cursorTo(process.stdout, 0, print.offset);
  });
}
