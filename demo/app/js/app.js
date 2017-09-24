const Game = require("./../../");
const {dialog} = require('electron').remote;
const fs = require('fs');

const CanvasRender = require('./js/CanvasRender');

var menuMain, renderMain, renderCanvas, gameStartDialog, selectSize, createGameBtn, inputStreching, btnLoadGame;

var sessionFile = null;

var game;

window.addEventListener("load", function() {

  // Init DOM elements

  var btnStartGame = document.querySelector(".btn-start-game");
  menuMain = document.querySelector(".menu");
  renderMain = document.querySelector('.game-render');
  renderCanvas = document.querySelector("#render");
  gameStartDialog = document.querySelector(".game-start-dialog");
  selectSize = document.querySelector(".select-size");
  inputStreching = document.querySelector(".input-streching");
  createGameBtn = document.querySelector(".create-game-btn");
  btnLoadGame = document.querySelector(".btn-load-game");


  // Listen for start button click
  btnStartGame.addEventListener("click", function() {
    // Hide main menu
    menuMain.classList.remove("show");

    // Show start dialog menu
    gameStartDialog.classList.add("show");

  });

  // Listen for create button click
  createGameBtn.addEventListener("click", function() {
    // Show electron native dialog for saving location of game
    dialog.showSaveDialog({
      title: "Select cour game's saving location",
      buttonLabel: "Use", // Just an button label
      defaultPath: process.env["HOME"] + "/myGame.json" // Default path is users home directory
    }, function(filename) {
      sessionFile = filename;
      // Parse structureSize from input
      var structureSize = parseFloat(inputStreching.value);
      // Parse size from input
      var size = selectSize.value.split(",");

      // Hide game start menu
      gameStartDialog.classList.remove("show");
      // Show render canvas
      renderMain.classList.add("show");

      // Start game with properties like size, structureSize and an empty serial
      startGame(parseInt(size[0]), parseInt(size[1]), structureSize, {});
    });
  });

  // Listen for button load click
  btnLoadGame.addEventListener("click", function() {
    // Show electron native file choose dialog
    dialog.showOpenDialog({
      title: "Select game",
      defaultPath: process.env["HOME"], // Default path is users home directory
      filters: [
        // Filter for JSOn files only (Game sessions should be saved in JSON!)
        {
          name: 'JSON',
          extensions: ['json']
        },
      ]
    }, function(filenames) {
      // Set file name to first item of array 'filenames'
      sessionFile = filenames[0];
      // Read the serial file
      fs.readFile(sessionFile, "utf8", function(err, contents) {
        if (err) throw err;
        // Set serial from file contents
        var serial = JSON.parse(contents);
        // Start game with serials's width, serial's height and itself
        startGame(serial.width, serial.height, serial.structureSize, serial);
      });
    });
  });

});

// Keys that should be listened for
var moveKeys = {
  "KeyW": {
    x: 0,
    y: -1
  },
  "KeyD": {
    x: 1,
    y: 0
  },
  "KeyS": {
    x: 0,
    y: 1
  },
  "KeyA": {
    x: -1,
    y: 0
  }
}


function startGame(width, height, structureSize, serial = {}) {
  menuMain.classList.remove("show");

  renderMain.classList.add("show");

  game = new Game({
    serial: serial,
    width: width,
    height: height,
    structureSize: structureSize
  });

  var lastAttackTime = new Date().getTime();
  var currTime;

  var attackDelay = 150;

  window.addEventListener("keydown", function(event) {
    currTime = new Date().getTime();
    if (event.code && event.code in moveKeys) {
      if (event.shiftKey) {
        // Attack is fired by user
        if (currTime - lastAttackTime >= attackDelay) {
          game.attack(moveKeys[event.code].x, moveKeys[event.code].y);
          lastAttackTime = currTime;
        }
      }
      else if (event.ctrlKey && event.code === "KeyS") {
        var serial = game.serialize();
        fs.writeFile(sessionFile, JSON.stringify(serial), function(err) {
          if (err) {
            throw err;
          }
        });
      }
      else {
        //console.log(moveKeys[event.code]);
        game.move(moveKeys[event.code].x, moveKeys[event.code].y);
      }
    }
    //console.log("Key Event");
    //console.log(event);
  });

  var Renderer = new CanvasRender(game.Controller, renderCanvas);

  game.on("render", function(controller) {

    Renderer.render();

    //var print = Render(game);

    //process.stdout.write(print.write);

    //readline.cursorTo(process.stdout, 0, print.offset);
  });


  game.on("gameover", function() {
    renderMain.classList.remove("show");
    menuMain.classList.add("show");
  });

}
