module.exports = (function() {
  class Fight {
    constructor(entityField, gameInstance) {
      // Set entityField as start field
      this.entityField = entityField;

      this.gameInstance = gameInstance;

      // Generate fight area (Area where player can move to while the fight is running)
      // 1 = deepthness
      this.fightArea = Fight.generateFightArea(this.entityField, 1);

      /*

        Fight started!

      */

      this.entityField.class = "attacker";

      // Intiial health of the enimy when beginning a field
      this.healthy = {
        value: 10,
        max: 10
      }
      // Set 'attackDelay' to the created Attacker
      this.attackInterval = this.Attacker(Fight.attackDelay);

    }
    validateMovement(field) {
      // Check wether a movement is valid when associating it with the fight'Äs fighting area
      return this.fightArea.indexOfKey(field.index, "index") > -1;
    }
    setTarget() {
      // Set target to playerPos field
      var target = this.gameInstance.getFieldByPos(this.gameInstance.playerPos.x, this.gameInstance.playerPos.y);
      // Target field has to be classified as 'targeting' (rendering)
      target.class = "targeting";
      // Return target
      return target;
    }
    Attacker(delay) {
      var self = this;
      // Initialize the target for the first time attacking
      var target = this.setTarget();
      // 'animationDuration' is just the duration the class 'attacked' will be used for the attacked field
      var animationDuration = 200;
      // Interval that manages multiple attacks of a entity
      var interval = setInterval(function(self) {
        // Attack the target
        self.attack(target, animationDuration, function() {
          // Callback function when attack is completly done

          // Now, set new target
          target = self.setTarget();
          // Fire a 'render' event because 'animationDuration' is over
          self.gameInstance.controllerInstance.emit("render");
        });
        // Fire a 'render' event for rendering directly after the attack
        self.gameInstance.controllerInstance.emit("render");
      }, delay, this);
      // Fire a 'render' event for rendering target as class 'targeting'
      this.gameInstance.controllerInstance.emit("render");
      // Return interval
      return interval;
    }
    // Method to attack a field
    attack(target, animationDuration, callback) {
      var self = this;
      // Classify the target to attack as 'attacked' (rendering)
      target.class = "attacked";
      // Check wether the player's position equals to target's position
      if (target.pos.x === self.gameInstance.playerPos.x && target.pos.y === self.gameInstance.playerPos.y) {
        // Hurt player using the damage proptery of the entity (Just using entity[0] because at the moment there is no requirement for multiple entities but the API is designed in this way)
        self.gameInstance.hurtPlayer(this.entityField.entities[0].damage);
      }
      // Set delay for removing 'attacked' class and a callback
      setTimeout(function(target) {
        // Set class to null (Also destroying every type of 'items' by the way because items are handled by class)
        target.class = null;
        // Call callback function to handle the attack
        callback();
      }, animationDuration, target);
    }
    // Method that handles a 'attack()' explicitly from the player's position against the entities
    attackEntity(target, damage) {
      // Also set 'animationDuration' (Defines how long a field's class is 'attacked')
      var animationDuration = 250;
      // Attack the target
      this.attack(target, animationDuration, function() {

      });
      // Check wether the attacked field equals to the entity the player is actual fighting against
      // Other entities should be ignored because you can always be involved in one fight!
      // That means every entity in nearby is ignored because it's not a part of the acutual fight!
      if (target.index === this.entityField.index) {
        // Damage the current entity
        this.healthy.value += damage;
        // Check wether the entity is killed
        if (this.healthy.value <= 0) {
          // Kill it
          this.kill();
        }
      }
      this.gameInstance.controllerInstance.emit("render");
    }
    kill() {
      // Quit fight (Means removing the whole 'fight' instance)
      this.gameInstance.quitFight();
    }

    // Generate a fighting area with a deepthness
    static generateFightArea(entityField, maxDeepth) {
      // Area array to return
      var area = [];
      // Looping function that pushs surroundings to 'area' and repeat itself if 'maxDeepth' allows that
      function getSurroundings(field, currDeepthLevel) {
        // All surroundings of current field
        var surroundings = field.surroundings.map(surr => surr.field);
        // Push (concat) them to 'area'
        area = area.concat(surroundings);
        // Go deeper
        currDeepthLevel++;
        // If 'maxDeepth' allows the new deepthness
        if (currDeepthLevel <= maxDeepth) {
          // Repeat the action with the surrounding fields
          surroundings.forEach(function(surr) {
            getSurroundings(surr, currDeepthLevel);
          });
        }
      }
      // Start deepthness always at 0
      getSurroundings(entityField, 0);
      // Return generated area
      return area;

    }
  }
  // Intial value how long an entity needs to reattack when using Attacker interval
  Fight.attackDelay = 700;
  // Export module as object
  return Fight;
})();
