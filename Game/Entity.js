module.exports = (function() {

  var {MathRandom} = require('./../helper');

  /*

    Please take note that the entity API specially is designed to manage multiple entities on a field
    But at the moment the game isn't designed in this way and therefore it will only listen to the first item of the array as simple entity

    An entity also is handled as an enimy that has to be killed

  */

  return {
    
    // All types of monsters (At least once)
    monsters: [
      {
        name: "monster",
        damage: -1
      }
    ],
    generate(self, max) {
      // Get all fields whose type is 'way' (A entity doesn't makes any sense within a 'wall' field)
      var wayFields = self.freeFields().filter(function(field) {
        // Exclude fields which borders on a field with an action (Something like 'start', 'aim' or special items. All cases for fields that shouln't be used as entity)
        return field.surroundings.filter(surr => surr.field.action).length < 1;
      });
      // Get all existing fields with entities
      //var entityFields = this.entityFields;

      // Minimal distance to next field with entities
      var minDistance = 4;

      /*
        This algorithm calculates new fields for filling them with entities but keeps the minDistance in mind
      */

      // Loop 'max' times (Amount of entity fields to generate)
      for (var i = 0; i < max; i++) {
        // Set 'newField' to null to initialize it
        var newField = null;
        // Count tries to check wether every field was tries and no fitting field was found
        var tryCounter = 0;
        // This is the general creation of a new field
        do {
          tryCounter++;
          // Select a random field from 'wayFields'
          newField = wayFields[MathRandom(0, wayFields.length)];
          // Check wether the selected field is valid (Should have a distance to any other entity field that is >= 'minDistance' (5))
          // If not, repeat the random creation and try it again
        } while (tryCounter <= wayFields.length && this.GameClassInstance.closestFields(newField, self.entityFields, minDistance).length > 0);
        // Get random entity from monsters
        var newMonster = this.monsters[MathRandom(0, this.monsters.length)];
        // Set fields properties for being an field with entities
        newField.entities.push(newMonster);
        // Push new field to 'entityFields' to avoid
      }
    },
    initFight(field, gameInstance) {
      // If there is no fight yet
      if (!gameInstance.fight) {
        // Loop trough surrounding fields of the target field (Because a fight always starts when the player moves to a field that is connected to a entity field)
        for (var i = 0; i < field.surroundings.length; i++) {
          // If the current surrounding field contains entites
          if (field.surroundings[i].field.entities.length > 0) {
            // Initialize new fight instance
            gameInstance.fight = new this.Fight(field.surroundings[i].field, gameInstance);
            // New fight started !
          }
        }
      }
    },
    Fight: require("./Fight.js")

  }
})();
