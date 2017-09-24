module.exports = (function() {
  const fs = require('fs');
  const EventEmitter = require('events');


  var textureReaderPromise = new Promise(function(resolve, reject) {
    fs.readFile(__dirname + "/textures.json", "utf8", function(err, contents) {
      if (err) throw err;
      var data = JSON.parse(contents);
      data.forEach(function(textureData) {
        if ("location" in textureData) {
          // Set absolute path to the texture resource
          textureData.location = __dirname + "/" + textureData.location;
          textureData.image = proxyTextureResource(textureData.location);
        }
        if ("frames" in textureData) {
          textureData.frames = textureData.frames.map(function(frameLocation) {
            // Set absolute path to the texture resource
            var location = __dirname + "/" + frameLocation;
            return {
              location: location,
              image: proxyTextureResource(location)
            };
          });
        }
      });
      // Resolve the textures data read from 'textures.json'
      resolve(data);
    });
  });


  function proxyTextureResource(location) {
    // Preload an image obeject for the texture data (Using promise as proxy because of asynchron image loading)
    return new Promise(function(resolve, reject) {
      // Set the images constructor
      var image = new Image();
      // Listen on 'load' event for the image
      image.addEventListener("load", function() {
        // Image is loaded. Reject it as data
        resolve(image);
      });
      // Set its 'src' to the absolute 'location' in file system
      image.src = location;
    });
  }


  var fillRules = [
    {
      success(field) {
        return field.type === null;
      },
      texture: "stone"
    },
    {
      success(field) {
        return field.type === "way";
      },
      texture: "way"
    }
  ];

  function getFittingRule(rules, field) {
    for (rule of fillRules) {
      if (rule.success(field)) {
        return rule;
      }
    }
    return null;
  }


  /*function CanvasRender(controller, canvas) {

    var gameInstance = controller.gameInstance;
    var map = gameInstance.map;

    //canvas.width = gameInstance.width * fieldBoundings.width;
    //canvas.height = gameInstance.height * fieldBoundings.height;

    var ctx = canvas.getContext("2d");

    var fieldBoundings = {
      width: 40,
      height: 40
    };




    });*/

    class CanvasRender extends EventEmitter {
      constructor(controller, canvas) {

        super();

        this.controller = controller;

        this.gameInstance = controller.gameInstance;
        this.map = this.gameInstance.map;

        var canvasBoundings = canvas.getBoundingClientRect();

        /*this.fieldBoundings = {
          width: 40,
          height: 40
        };*/

        var scale = 2.5 * ((this.gameInstance.width + this.gameInstance.height) / 2 / 32);

        this.fieldBoundings = {
          width: canvasBoundings.width / this.gameInstance.width * scale * 2,
          height: canvasBoundings.width / this.gameInstance.height * scale * 2
        };




        //renderCanvas.width = this.gameInstance.width * this.fieldBoundings.width;
        //renderCanvas.height = this.gameInstance.height * this.fieldBoundings.height;


        renderCanvas.width = canvasBoundings.width * 2;
        renderCanvas.height = canvasBoundings.height * 2;

        this.canvas = canvas;

        this.context = canvas.getContext("2d");


      }
      render() {

        var self = this;

        self.gameInstance = self.controller.gameInstance;
        self.map = self.gameInstance.map;

        var mapRendering = [false, false, false, false];

        self.context.fillStyle = "#ffffff";
        self.context.fillRect(0, 0, self.canvas.width, self.canvas.height);

        self.ticker = new self.Ticker();


        var fieldClassTextures = {
          "attacked": "explosion"
        };


        textureReaderPromise.then(function(textures) {
          // Textures read definitly
          // Loop trough every field on the map
          self.map.forEach(function(field, i) {
            // Get a fitting rule for the current field (Returns info about texture and more)
            var rule = getFittingRule(fillRules, field);
            // If the field matches to a rule (should do so)
            if (rule) {
              // Get current texture information from the rule
              var currTexture = textures[textures.indexOfKey(rule.texture, "name")];
              // Calculate relative rendering position for field in viewport of the canvas by using it's position property as argument
              var pos = self.fieldDrawPos(field.pos);

              // Listen 'then()' for the Promise of the image texture
              currTexture.image.then(function(fieldTexture) {
                // Image texture is loaded
                self.context.drawImage(fieldTexture,
                  pos.x,
                  pos.y,
                  self.fieldBoundings.width,
                  self.fieldBoundings.height);

                // If the current field is the last one
                if (i + 1 >= self.map.length) {
                  // Handle map render part for index 0 (1st rendering process is finished)
                  handleMapRenderPart(0);
                }
              });

              if (field.class in fieldClassTextures && true) {
                var textureName = fieldClassTextures[field.class];
                var currTexture = textures[textures.indexOfKey(textureName, "name")];
                if (currTexture && currTexture.frames) {
                  //console.log(currTexture);
                  self.animateField(currTexture, field);
                }
              }
            }
          });

          var playerTexture = textures[textures.indexOfKey("player", "name")];
          // Calculate relative rendering position for the player in viewport of the canvas
          var pos = self.fieldDrawPos(self.gameInstance.playerPos);
          // Listen 'then()' for the Promise of the image texture
          playerTexture.image.then(function(playerTexture) {
            // Image texture is loaded
            self.context.drawImage(playerTexture,
              pos.x,
              pos.y,
              self.fieldBoundings.width,
              self.fieldBoundings.height);

              // Handle map render part for index 1 (2nd rendering process is finished)
              handleMapRenderPart(1);
          });

          // Render entities

          var monsterTexture = textures[textures.indexOfKey("monster", "name")];

          self.gameInstance.entityFields.forEach(function(field, i) {
            // Calculate relative rendering position for the monster in viewport of the canvas
            var pos = self.fieldDrawPos(field.pos);
            // Listen 'then()' for the Promise of the image texture
            monsterTexture.image.then(function(monsterTexture) {
              // Image texture is loaded
              self.context.drawImage(monsterTexture,
                pos.x,
                pos.y,
                self.fieldBoundings.width,
                self.fieldBoundings.height);
              // If the current field is the last one
              if (i + 1 >= self.gameInstance.entityFields.length) {
                // Handle map render part for index 2 (3rd rendering process is finished)
                handleMapRenderPart(2);
              }
            });
          });


          // Render Health

          var healthTexture = textures[textures.indexOfKey("health", "name")];

          var itemFields = self.map.filter(field => field.action && field.action.type === "item");
          itemFields.forEach(function(field, i) {
            // Calculate relative rendering position for the monster in viewport of the canvas
            var pos = self.fieldDrawPos(field.pos);
            // Listen 'then()' for the Promise of the image texture
            healthTexture.image.then(function(healthTexture) {
              // Image texture is loaded
              self.context.drawImage(healthTexture,
                pos.x,
                pos.y,
                self.fieldBoundings.width,
                self.fieldBoundings.height);
              // If the current field is the last one
              if (i + 1 >= itemFields.length) {
                // Handle map render part for index 3 (4th rendering process is finished)
                handleMapRenderPart(3);
              }
            });
          });



          function handleMapRenderPart(i) {
            mapRendering[i] = true;
            if (!mapRendering.includes(false)) {
              // Map rendering process is finsihed.
              // UI rendering begins

              var healthDisplayBoundings = {
                width: self.canvas.width / 4,
                height: 20,
                margin: [10, 10]
              };
              self.renderHealthDisplay(
                25,
                25,
                healthDisplayBoundings.width,
                healthDisplayBoundings.height
              );

              // Render fight health
              if (self.gameInstance.fight) {
                self.renderEntityHealthBar(
                self.canvas.width - healthDisplayBoundings.width - 25,
                25,
                healthDisplayBoundings.width,
                healthDisplayBoundings.height);
              }

              // Render Level

              var levelDisplayBoundings = {
                x: healthDisplayBoundings.width + 25 + 25,
                y: 12.5,
                width: 200,
                height: 50
              }

              self.context.fillStyle = "rgba(0, 0, 0, 0.61)";
              self.context.fillRect(
                levelDisplayBoundings.x,
                levelDisplayBoundings.y,
                levelDisplayBoundings.width,
                levelDisplayBoundings.height
              );
              self.context.fillStyle = "#ffffff";
              self.context.font = "30px Helvetica";
              self.context.fillText("Level " + self.controller.level,
                             levelDisplayBoundings.x + 10,
                             levelDisplayBoundings.y + levelDisplayBoundings.height / 2 + 8.5
                           );


            }
          }

        });
      }
      animateField(texture, field) {
        var self = this;

        textureReaderPromise.then(function(textures) {
          var startTime = new Date().getTime();
          var lastState = -1;
          self.ticker.add(function(timestamp, index) {
            var currTime = new Date().getTime();
            var timeDelay = currTime - startTime;
            var newState = Math.trunc(timeDelay / texture.delay);

            if (newState in texture.frames) {
              if (newState != lastState) {
                var pos = self.fieldDrawPos(field.pos);
                var textureData = texture.frames[newState];
                textureData.image.then(function(image) {
                  self.context.drawImage(image,
                  pos.x,
                  pos.y,
                  self.fieldBoundings.width,
                  self.fieldBoundings.height);
                });
              }
            }
            else {
              //self.ticker.remove(index);
            }
            lastState = newState;
          });
        });
      }

      renderHealthDisplay(x, y, width, height) {
        // Draw outer bar
        this.drawBar(x, y, width, height, "rgba(0, 0, 0, 0.3)", "rgba(0, 0, 0, 1)");
        // Draw health value bar
        if (this.controller.healthy.value) {
          // If the value is not 0
          this.drawBar(x, y, width * (this.controller.healthy.value / this.controller.healthy.max), height, "rgba(255, 0, 0, 0.65)");
        }
        else {
          this.drawBar(x, y, width, height, "rgba(0, 0, 0, 0.79)");
        }
      }
      renderEntityHealthBar(x, y, width, height) {
        // Draw outer bar
        this.drawBar(x, y, width, height, "rgba(0, 0, 0, 0.3)", "rgba(0, 0, 0, 1)");
        // Draw health value bar
        if (this.controller.healthy.value) {
          // If the value is not 0
          this.drawBar(x, y, width * (this.gameInstance.fight.healthy.value / 10), height, "rgba(0, 255, 48, 0.65)");
        }
        else {
          this.drawBar(x, y, width, height, "rgba(0, 0, 0, 0.79)");
        }
      }
      drawBar(x, y, width, height, fill = null, stroke = null) {


        this.context.beginPath();
        this.context.moveTo(x, y);

        var roundingRadius = height / 2;
        var roundingPos = [
          {
            x: x + roundingRadius,
            y: y + roundingRadius
          },
          {
            x: x + width - roundingRadius,
            y: y + height - roundingRadius
          }
        ];
        this.context.moveTo(roundingPos[0].x, y + roundingRadius * 2);
        this.context.arc(roundingPos[0].x, roundingPos[0].y, roundingRadius, Math.PI / 2, Math.PI * 1.5);
        this.context.lineTo(width - roundingRadius, y);
        this.context.arc(roundingPos[1].x, roundingPos[1].y, roundingRadius, 0 - Math.PI / 2, Math.PI * 0.5);
        this.context.lineTo(roundingPos[0].x, y + roundingRadius * 2)

        if (fill) {
          this.context.fillStyle = fill;
          this.context.fill();
        }
        if (stroke) {
          this.context.strokeStyle = stroke;
          this.context.stroke();
        }
      }
      fieldDrawPos(pos) {
        var self = this;

        var innerFieldBoundings = [
          self.canvas.width / self.fieldBoundings.width,
          self.canvas.height / self.fieldBoundings.height
        ];

        var focus = self.gameInstance.playerPos;

        var focusPos = [
          focus.x - (innerFieldBoundings[0] / 2) + 0.5,
          focus.y - (innerFieldBoundings[1] / 2) + 0.5
        ];

        var position = {
          x: ((pos.x) * self.fieldBoundings.width) - focusPos[0] * self.fieldBoundings.width,
          y: ((pos.y) * self.fieldBoundings.height) - focusPos[1] * self.fieldBoundings.height
        };
        return position;
      }




  }

  CanvasRender.prototype.Ticker = require("./Ticker");



  return CanvasRender;

})();


Array.prototype.indexOfKey = function(value, key, start = 0) {
  for (var i = start; i < this.length; i++) {
    if (this[i][key] === value) {
      return i;
    }
  }
  return -1;
}
