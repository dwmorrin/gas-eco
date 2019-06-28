/* exported  Item_ */
function Item_(itemData) {
  // Inventory cheat sheet: [[Location, Category, Sub Category, Manufacturer , Model,
  //  Description, Serial, Item ID, Barcode No., Reserveable, Reservations, Check-Out History, Repair History, Checked-Out, ID, Qnty, Notes]]
  var dataIndex = {
    SHEET_ID    : '1XYu7fGgmuZ3DTa8y2JNbwwKuHw8_XNJ4VEwgZCf_UME',
    SHEET_NAME  : 'Inventory',
    MAKE        : 3,
    MODEL       : 4,
    DESCRIPTION : 5,
    ID          : 7,
    BARCODE     : 8,
    HISTORY     : 11,
    CHECKED_OUT : 13
  };
  this.barcode = itemData[dataIndex.BARCODE];// {string}
  this.id = itemData[dataIndex.ID];          // {string}
  this.checkedOut = Boolean(itemData[dataIndex.CHECKED_OUT]);
  this.checkIn = null;   // {string} formatted date
  this.checkOut = null;  // {string} formatted date
  this.description;      // {string} make, model, etc
  this.quantity = 1;     // {int}
  this.notes = '';       // {string} saves the notes for the item
  this.missing = false;  // {bool} true if item cannot be found when form is closed

  if (itemData[dataIndex.MAKE] && itemData[dataIndex.MODEL]) {
    this.description = itemData[dataIndex.MAKE] + ' ' + itemData[dataIndex.MODEL];
  } else {
    this.description = itemData[dataIndex.DESCRIPTION];
  }

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
  };
  this.setSerialized();
}
