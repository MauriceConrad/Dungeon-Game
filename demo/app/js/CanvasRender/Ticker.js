module.exports = (function() {
  class Ticker {
    constructor() {
      var self = this;

      this.callbacks = [];

      this.ticker = window.requestAnimationFrame(function(timestamp) {
        self.tick(timestamp);
      });
    }
    tick(timestamp) {
      var self = this;

      if (this) {
        this.callbacks.forEach(function(callback, index) {
          callback(timestamp, index);
        });
      }
      this.ticker = window.requestAnimationFrame(function(timestamp) {
        self.tick(timestamp);
      });
    }
    add(callback) {
      this.callbacks.push(callback);
    }
    remove(index) {
      delete this.callbacks[index];
      this.callbacks = this.callbacks.filter(calback => callback);
    }
  }


  return Ticker;
})();
