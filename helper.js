module.exports = {
  MathRandom(from = 0, to = 1) {
    // Generate random number in a given range

    // Generate it and add it to the from
    var randomNumber = from + Math.random() * (to - from);
    // Return it ceiled
    return Math.trunc(randomNumber);
  }
}

Object.prototype.fillDefaults = function(defaults) {
  Object.keys(defaults).forEach(key => {
    if (!(key in this)) {
      this[key] = defaults[key];
    }
    else if (typeof defaults[key] == "object" && defaults[key] != null) {
      this[key] = this[key].fillDefaults(defaults[key]);
    }
  });
  return this;
}
