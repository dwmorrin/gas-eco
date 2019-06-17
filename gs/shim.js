/**
 * Utility for searching double arrays
 * @param {integer} column - optional column to search by, otherwise search all
 * @param {bool} findIndex - if true then returns index of row only
 * @returns {mixed} - int, sheet[], or undefined if not found
 */
Array.prototype.findRowContaining = function(value, column, findIndex) {
  if (column) {
    for (var i = 0, l1 = this.length; i < l1; i++) {
      if (this[i][column] == value) {
        if (findIndex) {
          return i;
        }
        return this[i];
      }
    }
  } else {
    for (i = 0, l1 = this.length; i < l1; i++) {
      for (var j = 0, l2 = this[i].length; j < l2; j++) {
        if (this[i][j] == value) {
          if (findIndex) {
            return i;
          }
          return this[i];
        }
      }
    }
  }
};
