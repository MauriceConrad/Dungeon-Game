# Game

## Important Note:

Actual a README.md in german because the game was a part of a code competition and this text was the original README used in this context.

This was a part of a code competition in 2017. The develop is still not finished therefore.

Have a look at the running examples within `demo` folder. One implementation is command-line online ;-) The other is working but of course not finished. It is a graphical implementation that runs in electron

### English translation

Yes, I want to translate it in english but at the moment.

Try to get a simple look at the code examples or have a look at the code. The code is commented very detailed in english!

## Einbindung


Als Argument werden Optionen mitgegeben. Mehr dazu im Code-Beispiel Ist dieses valide, wird es verwendet. Wenn nicht, wird das Spiel neu generiert.

```javascript
const Game = require("dungeon");

var myGame = new Game({
  serial: {}, // Serial
  width: 32, // Width of map
  height: 32, // Height of map
  structureSize: 1.3 // Generating value (1.3 is recommended)
});
```

Um Events zu transportieren werden innerhalb der nun erstellen Instanz die Methoden "attack" und "move" aufgerufen die als Argumente die X-Distanz und die Y-Distanz benötigen. Die Zuordnung zu Keyboard Events oder dergleichen passiert also außerhalb.
Ebenso kann man innerhalb der eigenen Instanz direkt über "serialize" einen sauberen Klon des aktuellen Spieles erzeugen der auch als "serial" wieder eingelesen werden kann.

### Move Player

```javascript
// Move player with x and y steps
myGame.move(x, y);
```

### Attack Entity in Fight

```javascript
// Attack with x and y steps (Works only in an active fight)
myGame.attack(x, y);
```

### Serialize Game

```javascript
// Serialize the game
myGame.serialize();
```

Die eigene Instanz feuert noch das elementar wichtige Event "render". Dieses Event signalisiert eine interne, von der Spiellogik kommende Änderung die gerendert werden muss. (Dinge wie Animationen im Rendering selbst beinhaltet das nicht, diese müssen vom Render Prozess intern geregelt sein.


```javascript
myGame.on("render", function() {
  // Render with your rendering methods!
  console.log(myGame);
});
```


## Rendering

Das Rendering ist, wie bereits gesagt, absolut unabhängig. In meinem Fall gibt es von Haus aus zwei Implementierungen die ihrerseits jeweils eine Rendering Möglichkeit haben. Die CLI Implementierung benutzt eine Rendering Methode die in der Datei "render.js" geregelt ist und auf reiner Text Basis rendert. Sie spuckt also einen String aus.

Die zweite von mir verwendete Rendering Methode ist das Modul "RenderCanvas" welches in der "App" Implementierung (Electron) verwendet wird und vollkommen "vanilla" in ein Canvas rendert. Dieser Prozess enthält trotzdem ein eigenes modulares Texturing System welches die betreffenden Texturen und Animationen lädt und berechnet.

Auch die Viewport-Skalierung und Fokusierung wird selbst vom Rendering Prozess geregelt.



## Map Generierung

Die Level-Generierung findet innerhalb der Datei "Level.js" statt. Dabei wird ein Algorithmus verwendet, der in der Game.js am Rande und in der
*Level.js* sehr detailreich erklärt ist.

Ein Kampf ist eine Instanz innerhalb der aktuellen "gameInstance" welche nur dann existiert, wenn der Spieler aktuell in einen Kampf verwickelt ist. Seine Logik ist in der "Fight.js" geregelt. Dabei gibt es zum Beispiel einen "Attacker", ein interval was das Zielen und zeitverzögernde Feuern kontrolliert. Die Datei "Entity.js" löst im groben die Generierung von entities. Es gilt zu sagen dass im Moment das Array entities wie ein Objekt behandelt wird da es aktuell lediglich ein Entity gibt. Nämlich das Monster.


# Spielen

Die Steuerung erfolgt in beiden Umsetzungen über W,A,S,D.

## Kampf

Bewgt sich der Spieler auf ein, an ein Monster angrenzendes Feld, wird er in einen Kampf verwickelt.

Das bedeutet, er befindet sich in einem sogenannten "Kampf-Area". Er kann sich während des kampfes nicht aus diesem heraus bewegen. Dieses Area ist ein naher Umkreis um das Monster und löst sich erst wieder auf, wenn der Kampf zu Ende ist.

Das Monster wird das Spielfeld auf welchem sich der Spieler befindet, anvisieren "targeting". Ab dann hat der Spieler ca. 700 ms Zeit, sich auf ein anderes Feld zu begeben. Schafft er das nicht, wird er "abgeschossen" und verliert einen Lebsnpunkt. Er selbst kann während eines Kampfes auch feuern. Dafür hält er Shift gedrückt und zielt mit W,A,S,D in eine Richtung. Er kann alerdings nur ein Feld neben sich zielen, was bedeuet dass er, um das Monster zu treffen, sich diesem nähern muss.
Dieses verliertt dann auch einen Lebenspunkt.
