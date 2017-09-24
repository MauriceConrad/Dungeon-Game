module.exports = (function() {

  var {MathRandom} = require('./../helper');

  return {
    items: [
      {
        name: "medicine",
        health: 1
      }
    ],
    generate(self, max) {

      var startTime = new Date().getTime();

      var minDistance = 5;

      var freeFields = self.freeFields();

      for (var i = 0; i < max; i++) {
        var count = 0;
        var newField;

        do {
          newField = freeFields[MathRandom(0, freeFields.length)];
          // Repeat if item borders on field that has a 'action' (Mostly a second item or 'start'/'aim' field)
        } while (newField.surroundings.filter(surr => surr.field.action).length > 0);
        newField.action = {
          type: "item",
          item: this.items[MathRandom(0, this.items.length)]
        };
      }


      var endTime = new Date().getTime();

      console.log(endTime - startTime);
    }
  }
})();
