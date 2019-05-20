/* exported  Item_ */
function Item_(id) {
  this.barcode;          // string
  this.id = id;          // string or undefined
  this.checkedOut;       // boolean
  this.checkIn = null;   // string formatted date
  this.checkOut = null;  // string formatted date
  this.description;      // string, let implementation handle merging make, model, etc into this
  this.quantity = 1;     // 1 if there is an id, else integer
  this.notes = '';
  this.missing = null;


  this.getId = function() { return this.id; };
  this.getQuantity = function() { return this.quantity; };
  this.getDescription = function() { return this.description; };
  this.isCheckedOut = function() { return this.checkedOut; };

  this.incrementQuantity = function() {
    if (this.serialized) {
      // cannot change quantity
      throw new Error(this.id + " is serialized and cannot have quantity changed, increment method called");
    } else {
      this.quantity++;
      return this;
    }
  };
  this.decrementQuantity = function () {
    if (this.serialized) {
      // cannot change quantity
      throw new Error(this.id + " is serialized and cannot have quantity changed, decrement method called");
    } else if (this.quantity == 1) {
      throw new Error(this.id + " cannot have quantity less than 1, decrement method called");
    } else {
      this.quantity--;
      return this;
    }
  };
  this.setQuantity = function(integer) {
    if (this.serialized) {
      // cannot have quantity > 1 if item Id exists, silent fail
      return this;
    } else {
      if (integer != Math.floor(integer) || integer != Math.abs(integer)) { // not a good input
        throw new Error('item.setQuantity requires positive integer values only, recieved ' + integer);
      }
      this.quantity = integer;
      return this;
    }
  };
  this.setBarcode = function(str) { this.barcode = str; return this; };
  this.setDescription = function(str) { this.description = str; return this; };
  this.setCheckedOut = function(bool) { this.checkedOut = Boolean(bool); return this; };
  this.setSerialized = function() { // TODO bug: do not run this before setting barcode!!
    if (! this.barcode ) {
      this.serialized = false;
    }
    if (+this.barcode > 9999 && +this.barcode < 10101) { // reserved barcode range TODO put in config settings
      this.serialized = false;
    } else {
      this.serialized = true;
    }
    return this;
  }
}
