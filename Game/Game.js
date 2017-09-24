module.exports = (function() {
  const EventEmitter = require('events').EventEmitter;

  const Level = require('./Level');
  const Entity = require('./Entity');
  const SpecialItems = require('./SpecialItems');


  // Require some helper method that simplify the code
  // Self-written helpers, not important stuff just some things
  var {MathRandom} = require("./../helper");


  class Game extends EventEmitter {
    constructor(width = 8, height = 8) {
      super();
      var self = this;

      // Boundings of map
      this.width = width;
      this.height = height;

      this.map = this.mapTemplate;


    }
    get mapTemplate() {
      var self = this;
      var map = [];
      // Loop trough width
      for (var x = 0; x < self.width; x++) {
        // Within every x (row) loop trough y positions
        for (var y = 0; y < self.height; y++) {
          var field = {
            type: null,
            action: null,
            class: "",
            entities: [],
            items: [],
            pos: {
              x: null,
              y: null
            },
            index: map.length
          };
          Object.defineProperty(field, "pos", {
            get() {
              return {
                // Get X position of field with getting divison rest of divsion trough map width
                x: this.index % self.width,
                // Get Y Position of field with truncing result of divison trough map width
                y: Math.trunc(this.index / self.width)
              }
            }
          });
          Object.defineProperty(field, "surroundings", {
            get() {
              return self.getSurroundings(this).filter(surrounding => surrounding.field);
            }
          });
          //console.log(field.pos);
          map.push(field);

        }
      }

      return map;
    }
    get startField() {
      for (var i = 0; i < this.map.length; i++) {
        //console.log(this.map[i].action);
        if (this.map[i].action === "entry") {
          return this.map[i];
        }
      }
      return null;
    }
    get endField() {
      // Getter fpr end field
      // Loop trough map
      for (var i = 0; i < this.map.length; i++) {
        if (this.map[i].action === "aim") {
          return this.map[i];
        }
      }
      return null;
    }
    setPlayerPos(x, y) {

      this.playerPos = {
        x: x,
        y: y
      };


    }
    createLevel() {

      // Fill level map dynmically with fields
      this.map = this.mapTemplate;

      var totalWaySize = this.width * this.height / 3.5;
      // 16: 0.5
      // 32: 1
      // 64: 1.5
      var structureSize = this.controllerInstance.structureSize;


      var self = this;
      // Dynamic function that creates a random level map

      /*

        My idea to get sure that a way exists is, to define entry (start) and exit (aim) field at the beginning.


      */

      // Get bordering (outer) fields (All fields that are a part of the "border" of the game map and therefore possible entries or aims)
      var outerFields = this.getBorderingFields();
      //console.log(outerFields);

      // Define random entry field (Select random field of 'outerFields')
      var entryField = outerFields[MathRandom(0, outerFields.length)];

      // Get aim field ('apply()' to use 'this' reference within the anonymous function)
      // Anonymous function is used here to make a clean usage of variables
      var aimField = Level.aimField(entryField, outerFields, this);

      //this.startField = this.map[entryField.index];
      //this.endField = this.map[aimField.index];

      // Set entry field to instance
      entryField.action = "entry";
      // Set entry field to instance
      aimField.action = "aim";


      this.startField.type = "way";
      this.endField.type = "way";
      this.startField.creatorStamp = "start";
      this.endField.creatorStamp = "end";


      Level.labyrinthStructure(this.startField, totalWaySize / 2, structureSize, this);
      Level.labyrinthStructure(this.endField, totalWaySize / 2, structureSize, this);


      /*
        Validate

        How does validating work?
        Validating means that a second algorithm checks wether 'entry' field and 'aim' field are definitly connected !
        The algorithm itself creates just two random labyrinth structures, firstly from 'entry' and secondly from 'aim'
        To make sure that they are connected between each other, the created fields of every "own" labyrinth structure are gotten by 'getFieldsByCreator()' because they can't be identified
        Now, they loop trough each other and if no field is found that belongs to 'entry' structure but touches a field that belongs to 'aim' structure, the neares connection will be used for connecting

        Deutsch: Die Validierung meint, dass ein zweiter Algorithmus überprüft, ob der Eingang des Labyrinths auf jeden Fall mit dem Ende verbunden ist, daher das Labyrinth ünerhaupt lösbar.
        Um das mit Sicherheit zu klären wird folgendes gemacht:
          Wie zuvor generiert, existieren zwei theoretisch unabhängige Labyrinthstrukturen die für sich jedenfalls entweder mit 100%iger Sicherheit vom Eingang oder den Ausgang ausgehen.
          Diese Felder sind im Nachinhein dank der Eigenschaft 'creatorStamp' vollständig identifierbar.
          Deshalb werden zuerst alle Felder selektiert, die quasi "vom Eingang" kommen und alle die quasi "vom Ausgang" kommen. ('creatorStamp': 'start' || 'end')

          Anschließend werden die in einem Loop mit jedem anderen verglichen. So wird geprüft, ob es eines dieser Felder gibt, welches eines berührt, desses "Herkunft" woanders ist.
          Sollte es mindestens eine Verbindung geben, ist alles gut. Denn da jede Struktur für sich ineinander geschlossen ist, muss also auch ein ganzer Weg existieren.
          Der Return ist hier 'false'.

          Sollte eine solche Verbindung nicht existieren, geht es weiter:
            -> Während dem Vergleich wurde nicht nur geschaut, ob zwei Felder sich berühren, nein ihre Distanz zueiander wurde auch überprüft.
            Diese Distanz wurde mit einer 'nearestDistance' verglichen. Sofern die aktuelle Distanz kleiner ist, wurde 'nearestDistance' durch die neue Distanz ersetzt.
            Wurde auf also ingesamt keine Verbindung gefunden, wird statt 'false' die 'nearestDistance' returned.

            -> Jetzt ist sowohol klar, dass es keine Verbindung gibt, als auch, wo die kleinste Distanz zwischen einem Feld dessen Herkunft der "Eingang" und einem dessen Herkunft der "Ausgang" ist, sich befindet.
               Diese kleinste Distanz wird nun verwendet um die Metjode 'connectFields()' anzuwenden, die diese beiden Felder auf schnellstem Wege verbunden werden sollten.

      */

      // Get all fields whose creator stamp is "start"
      var createdFieldsEntry = this.getFieldsByCreator("start");
      // Get all fields whose creator stamp is "end"
      var createdFieldsAim = this.getFieldsByCreator("end");

      // Returns "false" if their IS a connection between entry and aim fields
      var waysTouch = Level.waysTouch(createdFieldsEntry, createdFieldsAim);

      if (waysTouch) {
        this.connectFields(waysTouch.from, waysTouch.to);
      }

      var maxEntities = Math.floor(totalWaySize / 10);
      var maxItems = Math.floor(totalWaySize / 10);

      SpecialItems.generate(this, maxItems);
      Entity.generate(this, maxEntities);
      //Level.create.apply(this, [totalWaySize, structureSize]);

    }
    generateLabyrinthStructure(lastField, max, structureSize) {

      Level.labyrinthStructure.apply(this, [lastField, max, structureSize]);

    }
    quitFight() {
      if (this.fight) {
        clearInterval(this.fight.attackInterval);
        this.getFieldsByClass("attacked").forEach(function(field) {
          field.class = "";
        });
        this.getFieldsByClass("targeting").forEach(function(field) {
          field.class = "";
        });
        this.fight.entityField.entities = [];
        this.fight = null;
      }
    }
    // Method to get all connection field within the map
    // A 'connection field' is a field that borders on a specific field type but matches not such a field type
    getBestSurroundings(field) {

      // Method to get the best(!) surroundings of a field by selecting for a few criteria
      // Please note, that this way is a little bit more complex, therefore read the comments. They're also written in german sometimes in addition because in german I can explain it much better ;-)

      // Filter on first level!
      // Sort surroundings by by amount of existing surroundings for themsel)
      // Deutsch: Umgebungsfelder werden danach sortiert, wie viele Umgebungsfelder sie ihrerseits besitzen
      var goodSurroundings = field.surroundings.sort(function(surr1, surr2) {
        if (surr1.field.surroundings.length > surr2.field.surroundings.length) {
          return -1;
        }
        else if (surr1.field.surroundings.length < surr2.field.surroundings.length) {
          return 1;
        }
        return 0;
      });
      // Now explicitly removing all surrounding fields that haven't the same quality as the first one of the sorted list (The first one has always the best quality but it's not sure if it is the only one qith this quality)
      // Deutsch: Nun werden alle Umgebungsfelder dieser Liste gelöscht, die nicht die selbe Anzahl an Umgebunsfeldern ihrerseits besitzen wie das bestplatzierteste der sortierten Liste (Dann sind in diesem Vergleich alle gelichwertig)
      goodSurroundings = goodSurroundings.filter(surr => surr.field.surroundings.length >= goodSurroundings[0].field.surroundings.length);
      // Filter on second level!
      // Sort remaining surroundings by the amount of surrounding fields of a the specific surrounding whose type is not "way" (getEmptySurroundings())
      // Deutsch: Verbleibende Umgebunsfelder werden nun danach sortiert, wie viele der Umgebungsfelder die sie ihrerseits besitzen, nicht vom 'type' "way" ist.
      goodSurroundings = goodSurroundings.sort(function(surr1, surr2) {

        var surr1FreeSurrs = Game.getEmptySurroundings(surr1.field);
        var surr2FreeSurrs = Game.getEmptySurroundings(surr1.field);
        if (surr1FreeSurrs.length > surr2FreeSurrs.length) {
          return -1;
        }
        else if (surr1FreeSurrs.length < surr2FreeSurrs.length) {
          return 1;
        }
        return 0;
      });
      // Now explicitly removing all surroundings that haven't the same amount of surroundings itself whose type is not "way" as the first one of the new sorted list
      // Deutsch: Es werden alle Umgebunsfelder gelöscht, die nicht die selbe Anzahl von Umgebungsfeldern, deren "type" nicht "way" ist, haben wie es das bestplatzierteste Umgebunsfeld aus der eben durchgeführten 'sort' Methode hat.
      // Die nun verbleibenden Umgebungsfelder sind auf jeder Ebene gleichwertig da sie in erster Linie gleich viele Umgebungsfelder besitzen (Nämlich am meisten) und auf zweiter Ebene auch von diesen Umgebunsfeldern gelich viele nicht vom 'type' "way" sind

      goodSurroundings = goodSurroundings.filter(surr => Game.getEmptySurroundings(surr.field).length >= Game.getEmptySurroundings(goodSurroundings[0].field).length);

      //goodSurroundings = goodSurroundings.filter(surr => surr.field.type != "way")

      // The array 'goodSurroundings' contains surroundings for the given 'field' that are completly equal looking at the implemented criterias here
      // Deutsch: Das hier entstandene Array enthält Umgebunsfelder die in jeder Hinsicht gleichwertig sind, was die Qualitätsansprüche angeht, welche hier implementiert sind und nach denen selektiert wurde.
      // Sie sollten daher auch gleichwertig behandelt werden, da ihre Reihenfolge nur davon abhängt in welcher Reihenfolge die Richtungen "top", "right", "bottom" & "right" allgemein von der Funktion 'getSurroundings()' ausgegeben werden
      return goodSurroundings;

    }
    getFieldsByType(type) {
      return this.map.filter(function(field) {
        return field.type === type;
      });
    }
    getFieldsByCreator(creator) {
      return this.map.filter(field => field.creatorStamp === creator);
    }
    getFieldsByClass(classRef) {
      return this.map.filter(field => field.class === classRef);
    }
    getSurroundings(field) {
      return [
        {
          direction: "top",
          field: this.getFieldByPos(field.pos.x, field.pos.y - 1)
        },
        {
          direction: "right",
          field: this.getFieldByPos(field.pos.x + 1, field.pos.y)
        },
        {
          direction: "bottom",
          field: this.getFieldByPos(field.pos.x, field.pos.y + 1)
        },
        {
          direction: "left",
          field: this.getFieldByPos(field.pos.x - 1, field.pos.y)
        }
      ]
    }
    // Method to connect two fields
    connectFields(field1, field2) {
      // Get their distance info
      var distance = Game.fieldDistance(field1, field2);
      // Save start field's position from [Getter]
      var startFieldPos = field1.pos;
      // Loop trough distance steps
      for (var i = 0; i < distance.total; i++) {
        // Calculate current step in "percentage" (E.g. 1/16 when step 1 of 16 is looped)
        var step = i / distance.total;
        // Distance to start field calculated by flooring the result of distance * step
        var startDistance = {
          x: Math.floor(distance.x * step),
          y: Math.floor(distance.y * step)
        }
        // Get the field by adding start field's position to curr field's relative position
        var fillField = this.getFieldByPos(startFieldPos.x + startDistance.x, startFieldPos.y + startDistance.y);
        // Mark the created field as 'connection' field (For debugging)
        fillField.creatorStamp = "connection";
        // Set it's type to "way"
        fillField.type = "way";
      }
    }
    static getEmptySurroundings(field) {
      return field.surroundings.filter(surrounding => surrounding.field.type != "way");
    }
    static isSurrounding(field1, field2) {
      // Save surroundings from [Getter] (Performance)
      var field1Surrs = field1.surroundings;
      // Loop trough surroundings
      for (var i = 0; i < field1Surrs.length; i++) {
        // Check wether a surrounding field's index matches field's index whose activity as surrounding field is needed
        if (field1Surrs[i].field.index === field2.index) {
          // Return true
          return true;
        }
      }
      // The surroundings of 'field1' seems to exclude the field whose activity as surrounding field is needed
      // Thereofre return false
      return false;
    }
    // Method to get a field by checking for matching positon ('pos' is a [Getter])
    getFieldByPos(x, y) {
      if (x > this.width - 1 || x < 0 || y > this.height - 1 || y < 0) {
        return null;
      }
      var index = parseInt(y * this.width + x);
      return index in this.map ? this.map[index] : null;
    }
    freeFields() {
      return this.getFieldsByType("way").filter(function(field) {
        var conditions = [
          field.type,
          !field.action,
          field.entities.length <= 0,
          field.items.length <= 0
        ];
        for (var i = 0; i < conditions.length; i++) {
          if (!conditions[i]) return false;
        }
        return true;
      });
    }
    getBorderingFields() {
      var self = this;
      // Return fields filtered. (Filtering fields for the fact that the X property or the Y property of a field is detected as 'isBorder' by the static method 'fieldBorders')
      return this.map.filter(function(field) {
        // Borders on X
        var xBorders = Game.fieldBorders(field.pos.x, self.width);
        // Borders on Y
        var yBorders = Game.fieldBorders(field.pos.y, self.height);
        // If it borders on x or y but not(!) on both (Because this excludes corner fields)
        return (xBorders && !yBorders) || (yBorders && !xBorders);
      });
    }
    hurtPlayer(damage) {
      this.controllerInstance.healthy.value += damage;
      if (this.controllerInstance.healthy.value <= 0) {
        this.killPlayer();
      }
    }
    killPlayer() {
      this.gameOver();
    }
    gameOver() {
      this.emit("gameover");
    }
    get entityFields() {
      return this.map.filter(field => field.entities.length > 0);
    }
    get Entity() {
      return Entity;
    }
    // Static function that check the fact that a position is bordering by looking at the total length of positions in this direction
    // Of course if a (x or y) position is 0, it looks like it borders "on top" or "on left". But also if a (x or y) position equals to the maximal position ('length - 1': Because indexing starts always not at 0 and not at 1), it looks like it borders "on bottom" or "on right"
    static fieldBorders(fieldPos, lengthRef) {
      // If the position equals to 0 or the total length of the side eqauls to the position (upper & bottom bordering)
      return fieldPos === 0 || fieldPos - (lengthRef - 1) === 0;
    }
    static fieldDistance(startField, targetField) {
      // Absolute difference
      var diff =  {
        // X difference
        x: targetField.pos.x - startField.pos.x,
        // Y Difference
        y: targetField.pos.y - startField.pos.y
      }
      // Relative (positive) difference
      diff.absolute = {
        x: Math.abs(diff.x),
        y: Math.abs(diff.y)
      };
      // Total "steps" of way
      diff.total = diff.absolute.x + diff.absolute.y;
      // Direct difference by using pythagoras
      diff.direct = Math.sqrt(Math.pow(diff.absolute.x, 2) + Math.pow(diff.absolute.y, 2));

      return diff;
    }
    static closestFields(field, fieldsRef, maxDistance) {
      return fieldsRef.filter(function(currField) {
        return Game.fieldDistance(field, currField).total <= maxDistance;
      });
    }

  }

  Game.map = [];
  Game.playerPos = null;
  Game.fight = null;

  Level.GameClassInstance = Game;
  Entity.GameClassInstance = Game;
  SpecialItems.GameClassInstance = Game;



  return Game;


})();

Array.prototype.indexOfKey = function(value, key, start = 0) {
  for (var i = start; i < this.length; i++) {
    if (this[i][key] === value) {
      return i;
    }
  }
  return -1;
}
