(function() {
  module.exports = function(controller) {

    var gameInstance = controller.gameInstance;

    var charsEntryAim = {
      "entry": {
        "arrow-left": " ← ",
        "arrow-right": " → ",
        "arrow-top": " ↑ ",
        "arrow-bottom": " ↓ "
      },
      "aim": {
        "arrow-left": " → ",
        "arrow-right": " ← ",
        "arrow-top": " ↓ ",
        "arrow-bottom": " ↑ "
      }
    }


    var str = drawField(gameInstance.map, gameInstance.width, gameInstance.height, function(field) {

      var bgColor = "";
      var fill = "   ";

      if (field.type === "way") {
        bgColor = "";
      }
      if (field.type == null) {
        bgColor = "\x1b[40m";
        fill = "███";
      }

      if (field.class === "targeting") {
        bgColor = "\x1b[41m";
        fill = " \x1b[37m⊗ ";
      }

      if (field.action === "entry" || field.action === "aim") {
        var direction = field.surroundings.filter(surr => surr.field.type === "way")[0].direction;
        fill = charsEntryAim[field.action]["arrow-" + direction];
      }
      if (field.action) {
        if (field.action.type === "item") {
          fill = " 🍩 ";
        }
      }
      if (gameInstance.playerPos.x == field.pos.x && gameInstance.playerPos.y == field.pos.y) {
        fill = " 🙂 ";
        if (controller.gameover) {
          fill = " 😵 ";
        }
      }
      if (field.entities.length > 0) {
        fill = " 😈 ";
        if (gameInstance.fight && gameInstance.fight.entityField.index === field.index) {
          fill = " 😡 ";
        }
      }
      if (field.class === "attacked") {
        fill = " 💥 ";
      }


      if (field.creatorStamp) {
        var stamps = {
          "start": "\x1b[41m",
          "end": "\x1b[44m",
          "connection": "\x1b[42m"
        }
        //bgColor = stamps[field.creatorStamp];
      }
      //return fillByType[field.type];
      return bgColor + fill + "\x1b[0m";
    });


    var rowLength = str.split("\n")[1].length;

    str += (function() {
      // Life of player
      var playerLife = "❤️ ".repeat(gameInstance.controllerInstance.healthy.value);

      var playerHealthOffset = gameInstance.controllerInstance.healthy.value * 2;
      var entityHealthOffset = gameInstance.fight ? (gameInstance.fight.healthy.value * 2) : 0;

      var lifeOffset = " ".repeat(rowLength - playerHealthOffset - entityHealthOffset);

      var entityLife = (gameInstance.fight ? "💚 ".repeat(gameInstance.fight.healthy.value) : "");

      return playerLife + lifeOffset + entityLife + "\n";
    })();

    str += (function() {
      var levelStr = "Level " + controller.level;
      var moneyStr = "💰  " + controller.money + " $";

      var offset = " ".repeat(rowLength - levelStr.length - moneyStr.length);

      return levelStr + offset + moneyStr + "\n";
    })();


    var rows = str.split("\n");

    var result = {
      write: str
    };
    Object.defineProperty(result, "offset", {
      get() {
        return process.stdout.rows - rows.length
      }
    });

    return result;
  }


  function drawField(map, width, height, render) {

    function verticalRowConnect(left, middle, right, fieldWidth = 3) {
      var parts = [];
      for (var i = 0; i < width; i++) {
        parts.push("─".repeat(fieldWidth));
      }
      return left + parts.join(middle) + right;
    }

    var fieldWidth = 3;

    var rows = [];
    for (var y = 0; y < height; y++) {
      var row = [];
      for (var x = 0; x < width; x++) {
        var i = y * width + x;
        row.push(render(map[i]));
      }
      row = "│" + row.join("│") + "│";
      rows.push(row);
    }
    rows = rows.join("\n" + verticalRowConnect("├", "┼", "┤", fieldWidth) + "\n");
    rows = ("\n" + verticalRowConnect("┌", "┬", "┐", fieldWidth) + "\n") + rows + ("\n" + verticalRowConnect("└", "┴", "┘", fieldWidth) + "\n");

    return rows;

  }


  String.prototype.repeat = function(count) {
    var str = "";
    for (var i = 0; i < count; i++) {
      str += this;
    }
    return str;
  };
})();
