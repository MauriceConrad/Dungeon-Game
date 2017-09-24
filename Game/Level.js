module.exports = (function() {

  var {MathRandom} = require("./../helper");

  return {
    waysTouch(startWay, endWay) {
      var Game = this.GameClassInstance;
      // Initialize 'nearestDistance'
      var nearestDistance = {
        total: Infinity
      };
      // Loop trough createdFieldsEntry
      for (var a = 0; a < startWay.length; a++) {
        for (var b = 0; b < endWay.length; b++) {
          isSurr = Game.isSurrounding(startWay[a], endWay[b]);
          if (isSurr) {
            return false;
            //console.log(createdFieldsEntry[a], createdFieldsAim[b]);
          }
          var currDistance = this.GameClassInstance.fieldDistance(startWay[a], endWay[b]);
          if (currDistance.total < nearestDistance.total) {
            nearestDistance.from = startWay[a];
            nearestDistance.to = endWay[b];
            nearestDistance.total = currDistance.total;
          }
        }
      }
      return nearestDistance;
    },
    aimField(entryField, refFields, self) {
      var Game = this.GameClassInstance;
      // Creates an array with all possible aim fields and their distance to the entry field
      var possibleAimFields = refFields.map(function(field) {
        // Clone object to avoid the reference to the original 'outerFields'.
        // That's because we want to avoid 'distanceToEntry' property to be added to original map (It's not needed as property there, juts for selecting the farthest away field)
        // Side effect: Destroys the [Getter] of 'position' property, therefore we have to get 'aimField' from the original map using this objects index
        field = Object.assign({}, field);
        field.distanceToEntry = Game.fieldDistance(entryField, field);
        return field;
      // Sort them by the calculated distance
      }).sort(function(field1, field2) {
        return field1.distanceToEntry.total < field2.distanceToEntry.total ? 1 : -1;
      });
      // Select aim field which is farthest away from entry field
      // Selects it at the "original" map of the instance
      return self.map[possibleAimFields[0].index];
    },
    labyrinthStructure(lastField, max, structureSize, self) {
      var lastDirection = null;

      var lastDirChance = (self.width * self.height / 512) * structureSize;
      lastDirChance = 6 * structureSize;

      var counter = 0;

      while (counter < max) {

        var bestSurroundings = self.getBestSurroundings(lastField);

        // If the best surroundings are more than 0
        if (bestSurroundings.length > 0) {
          // Set a random possibilty to use the old direction (When possible)
          // Chance that a theoretically founded direction will not be used is 1/5
          var useLastDir = Math.round(MathRandom(0, lastDirChance)) ? true : false;

          // Check for an existing surrounding that's direction eqauls to the last direction
          var fittingSurr = bestSurroundings[bestSurroundings.indexOfKey(lastDirection, "direction")];
          // If such a surrounding was found and the random possibilty (useLastDir) says 'true', use it
          if (fittingSurr && useLastDir) {
            // Set used surrounding field (usedSurr) to the surrounding that's direction is the same as 'lastDirection'
            var usedSurr = fittingSurr;
          }
          // No surrounding that's direction equals to 'lastDirection' exists or the random possibilty (useLastDir) says 'false'
          else {
            // Select a random surrounding field
            var usedSurr = bestSurroundings[MathRandom(0, bestSurroundings.length)];
          }
          // Append creator stamp from 'lastField'
          // 'creatorStamp' is a property to identify the fields that are connected to 'entry' or 'aim' field's directly
          usedSurr.field.creatorStamp = lastField.creatorStamp;

          // Set 'lastField' to the field of the used surrounding
          lastField = usedSurr.field;
          // Also set the new direction to 'lastDirection' to work with it when creating the next way field
          lastDirection = usedSurr.direction;

          // If the selected field has the type 'way', use a random field as 'lastField'
          if (self.map[lastField.index].type === "way") {
            // Get all way fields
            var wayFields = self.getFieldsByType("way");
            //lastField = lastField.surroundings[MathRandom(0, lastField.surroundings.length)].field;
            lastField = wayFields[MathRandom(0, wayFields.length)];

          }
          else {
            counter++;
          }

          //console.log(lastField.creatorStamp);
          self.map[lastField.index].type = "way";


        }
        else {
          // Deprecated now! (It's better to just reloop the algorithm on top)
          var wayFields = self.getFieldsByType("way");
          lastField = wayFields[MathRandom(0, wayFields.length)];

        }
        self.emit("progress", {
          steps: counter,
          total: max,
          description: "Generate Map"
        });
      }
      //return created;
    }
  };

})();
