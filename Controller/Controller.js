module.exports = (function() {
  // Require events module for extending
  const EventEmitter = require('events').EventEmitter;

  /*

    The processes is splited modular into the follwing modules:
    1. The initialize app process which fires the events and initialize a game with custom options
    2. The game logic itself, the controller which translates events into interactions with the game logic
    3. The renderer process which renders a mapped screen image to different outputs (e.g. text for console or canvas hen using in a web context)

  */

  // Require Game class
  const Game = require('./../Game');
  // Require Drawer class (Used for drawing the game visuality)
  // Require renderer methods (Used to render a map in differenet ways)

  // Define game controller to a 'new' game logic
  class GameController extends EventEmitter {
    constructor(options) {
      super();


      var self = this;

      this.structureSize = options.structureSize;

      var newGameDefaults = options.serial.fillDefaults({
        healthy: {
          value: 10,
          max: 10
        },
        gameover: false,
        level: 1,
        money: 0,
        damage: -1,
        map: null
      });


      // Call Game() prototpye for Initializing a new game logic with a specific board size
      this.gameInstance = new Game(newGameDefaults.width ? newGameDefaults.width : options.width, newGameDefaults.height ? newGameDefaults.height : options.height);
      this.gameInstance.controllerInstance = self;

      this.gameInstance.on("progress", function(event) {
        //console.log(event);
        self.emit("progress");
      });
      this.gameInstance.on("gameover", function() {
        //console.log("Game Over!");
        clearInterval(this.fight.attackInterval);
        this.fight = null;
        self.gameover = true;
        self.emit("gameover");
      });

      //console.log(options.serial);

      //console.log(newGameDefaults.width);


      Object.keys(newGameDefaults).forEach(function(key) {
        self[key] = newGameDefaults[key];
      });

      var mapFieldOverwriteProperties = ["type", "action", "entities", "items", "creatorStamp"];

      if (this.map) {

        this.gameInstance.map = this.gameInstance.map.map(function(field, index) {
          mapFieldOverwriteProperties.forEach(function(propertyName) {
            if (propertyName in self.map[index]) {
              field[propertyName] = self.map[index][propertyName];
            }
          });
          return field;
        });
        this.gameInstance.setPlayerPos(this.gameInstance.startField.pos.x, this.gameInstance.startField.pos.y);
      }
      else {
        this.newLevel();
      }

      // Initialize the first level


      this.emit("render");


    }
    levelUp() {
      // Adding 1 to current level
      this.level++;

      this.healthy.max = 10 + this.level * 1;
      console.log(this.healthy.max);

      // Return new level
      var newLevel = this.newLevel();


    }
    movePlayer(movement) {
      if (movement && typeof movement === "object" & "x" in movement && "y" in movement) {
        // Set new x position
        var x = this.gameInstance.playerPos.x + movement.x;
        // Set new y position
        var y = this.gameInstance.playerPos.y + movement.y;
        // Get new field
        var newField = this.gameInstance.getFieldByPos(x, y);
        // Check wether new field is a valid 'way'
        if (this.validateMovement(newField)) {
          this.gameInstance.setPlayerPos(x, y);
          // Check for entity fight
          this.gameInstance.Entity.initFight(newField, this.gameInstance);
          if (this.gameInstance.fight) {

          }
          if (newField.action) {
            if (newField.action.type === "item") {
              if (newField.action.item.health) {
                if (this.healthy.value + newField.action.item.health <= this.healthy.max) {
                  this.healthy.value += newField.action.item.health;
                  newField.action = null;
                }
              }
            }
          }
          // If new field's action is 'aim', go to new level
          if (newField.action === "aim") {
            // End fight if there is an active one
            this.gameInstance.quitFight();
            // Go level up
            this.levelUp();
          }
        }
        // Render game
        this.emit("render");
      }
    }
    attack(attack) {
      // Set new x position
      var x = this.gameInstance.playerPos.x + attack.x;
      // Set new y position
      var y = this.gameInstance.playerPos.y + attack.y;
      // Get new field
      var newField = this.gameInstance.getFieldByPos(x, y);
      if (this.gameInstance.fight) {
        this.gameInstance.fight.attackEntity(newField , this.damage);
      }
    }
    newLevel() {
      // Create new level
      var level = this.gameInstance.createLevel();
      this.gameInstance.setPlayerPos(this.gameInstance.startField.pos.x, this.gameInstance.startField.pos.y);
      return level;
    }
    render(method) {
      return Renderer[method](this);
    }
    validateMovement(field) {
      return (field && field.type === "way" &&
              this.gameInstance.entityFields &&
              field.entities.length < 1 &&
              (!this.gameInstance.fight || this.gameInstance.fight.validateMovement(field))
            );
    }

  }


  return GameController;

})();


Object.prototype.fillDefaults = function(defaults) {
  Object.keys(defaults).forEach(key => {
    if (!(key in this)) {
      this[key] = defaults[key];
    }
    else if (typeof defaults[key] == "object" && defaults[key] != null) {
      this[key] = this[key].fillDefaults(defaults[key]);
    }
  });
  return this;
}
