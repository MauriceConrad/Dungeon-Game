module.exports = (function() {
  const EventEmitter = require('events').EventEmitter;

  const Controller = require('./Controller');


  class Handler extends EventEmitter {
    constructor(options) {
      super();

      var self = this;

      // Fill defaults to options

      var options = options.fillDefaults({
        serial: {},
        width: 32,
        height: 32,
        structureSize: 1.3
      });

      // Create Controller instance
      this.Controller = new Controller(options);


      // Listen on 'render' event
      this.Controller.on("render", function() {
        // Emit 'render' event
        self.emit("render", this);
      });

      // Listen on 'gameover' event
      this.Controller.on("gameover", function() {
        // Emit 'gameover' event
        self.emit("gameover");
      });



      setTimeout(function() {
        // Fire render event asynchroun
        self.emit("render", self.Controller);
      }, 0);






    }
    move(stepsX, stepsY) {
      if (!this.Controller.gameover) {
        this.Controller.movePlayer({
          x: stepsX,
          y: stepsY
        });
      }
    }
    attack(stepsX, stepsY) {
      if (!this.Controller.gameover) {
        this.Controller.attack({
          x: stepsX,
          y: stepsY
        });
      }
    }
    serialize() {
      var serial = {
        width: this.Controller.gameInstance.width,
        height: this.Controller.gameInstance.height,
        map: this.Controller.gameInstance.map,
        level: this.Controller.level,
        money: this.Controller.money,
        damage: this.Controller.damage,
        healthy: this.Controller.healthy,
        structureSize: this.Controller.structureSize
      };
      return serial;
    }
  }

  return Handler;
})();
