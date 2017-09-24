module.exports = (function() {
  const fs = require('fs');

  var textureReaderPromise = new Promise(function(resolve, reject) {
    fs.readFile(__dirname + "/textures.json", "utf8", function(err, contents) {
      if (err) throw err;
      var data = JSON.parse(contents);
      data.forEach(function(textureData) {
        textureData.location = __dirname + "/" + textureData.location;
      });
      resolve(data);
    });
  });

  var fillRules = [
    {
      success(field) {
        return field.type === null;
      },
      texture: "stone"
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

    class CanvasRender {
      constructor(controller, canvas) {

        this.gameInstance = controller.gameInstance;
        this.map = this.gameInstance.map;

        this.fieldBoundings = {
          width: 40,
          height: 40
        };

        renderCanvas.width = this.gameInstance.width * this.fieldBoundings.width;
        renderCanvas.height = this.gameInstance.height * this.fieldBoundings.height;

        this.context = canvas.getContext("2d");


      }
      render() {
        var self = this;

        var fieldBoundings = self.fieldBoundings;

        textureReaderPromise.then(function(textures) {
          self.map.forEach(function(field) {
            var rule = getFittingRule(fillRules, field);
            if (rule) {
              var currTexture = textures[textures.indexOfKey(rule.texture, "name")];

              var img = new Image(currTexture.location);
              img.src = currTexture.location;
              img.addEventListener("load", function() {
                self.context.drawImage(img, field.pos.x * fieldBoundings.width, field.pos.y * fieldBoundings.height, fieldBoundings.width, fieldBoundings.height);
              });
            }
          });
        });
      }




  }


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
