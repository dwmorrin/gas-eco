/* global Item_ */
/* exported Inventory_ */
function Inventory_(array) {
  var items = [];
  this.setItems = function(array) {
    if (! Array.isArray(array)) {
      throw new Error(array + "is not an array");
    }
    items = array;
    if (! (items[0] instanceof Item_)) {
      items.forEach(function (obj, index, array) {
        array[index] = new Item_(obj);
      });
    }
  };
  if (array) {
    this.setItems(array);
  }
  this.push = function(item) {
    if (! (item instanceof Item_)) {
      throw new Error(item + "is not an Item_");
    }
    items.push(item);
  };
  this.slice = function() {
    return items.slice();
  };
  /**
   * non-mutating wrapper for reverse
   * returns a copy (slice) of the private variable
   */
  this.reverse = function() {
    return items.slice().reverse();
  };
  this.getByBarcode = function(barcode) {
    return items.find(function(item) {
      if (! item.barcode) {
        return false;
      }
      return item.barcode.toLowerCase() == barcode;
    });
  };
  this.getById = function(id) {
    id = id.toLowerCase().replace(/-0+/, '-');
    return items.find(function(item) {
      if (! item.id) {
        return false;
      }
      return item.id.toLowerCase().replace(/-0+/, '-') === id;
    });
  };
  this.find = function(func) {
    return items.find(func);
  };
  this.archive = function() {
    var copy = [];
    items.forEach(function(item) {
      copy.push(item.archive());
    });
    return copy;
  };
  this.stringify = function() {
    var copy = [];
    items.forEach(function(item) {
      copy.push(item.archive());
    });
    return JSON.stringify(copy);
  };
  this.forEach = function(func) {
    items.forEach(func);
  };
  this.getLength = function() { return items.length; };
}
