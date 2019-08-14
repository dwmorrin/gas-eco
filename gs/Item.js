/* global defaults */
/* exported Item_ */
function Item_(itemData) {
  if (! (this instanceof Item_)) {
    throw new Error("Item_() needs to be called with new");
  }

  /**
   * quantity is only mutable for non-serialized items
   *   must be a positive integer e.g. [1,inf)
   * @private
   */
  var quantity = 1;

  // Initially created from String[] from Google Sheets
  if (Array.isArray(itemData)) {
    this.barcode = itemData[this.dataIndex.BARCODE];// {string}
    this.id = itemData[this.dataIndex.ID];          // {string}
    this.checkedOut = Boolean(itemData[this.dataIndex.CHECKED_OUT]);
    this.checkIn = "";    // {string} formatted date
    this.checkOut = "";   // {string} formatted date
    this.description = "";// {string} make, model, etc
    this.notes = "";      // {string} saves the notes for the item
    this.missing = false; // {bool} true if item cannot be found when form is closed

    if (itemData[this.dataIndex.MAKE] && itemData[this.dataIndex.MODEL]) {
      this.description = itemData[this.dataIndex.MAKE] + ' ' + itemData[this.dataIndex.MODEL];
    } else {
      this.description = itemData[this.dataIndex.DESCRIPTION];
    }
  } else { // When creating from obj as parsed JSON from client:
    this.barcode = itemData.barcode ? "" + itemData.barcode : "";
    this.id = itemData.id ? "" + itemData.id : "";
    this.checkedOut = Boolean(itemData.checkedOut);
    this.checkIn = itemData.checkIn ? "" + itemData.checkIn : "";
    this.checkOut = itemData.checkOut ? "" + itemData.checkOut : "";
    this.description = itemData.description ? "" + itemData.description : "";
    this.notes = itemData.notes ? "" + itemData.notes : "";
    this.missing = Boolean(itemData.missing);
    quantity = itemData.quantity;
  }
  /**
   * serialized identifies non-fungible items
   * an item is serialized if it has a barcode NOT in the range 10000-10100
   *
   * items with item IDs are sometimes non-serialized if they are manual entries
   * @private
   */
  var serialized = Boolean(this.barcode) &&
    (+this.barcode < 10000 || +this.barcode > 10100);

  this.isSerialized = function() { return serialized; };

  this.getQuantity = function() { return quantity; };
  this.changeQuantity = function(integer) {
    if (serialized) {
      throw new Error("Cannot change quantity of a serialized item");
    }
    if (! isPositiveInteger(quantity + integer)) {
      throw new Error("Invalid quantity: " + integer);
    }
    quantity += integer;
    return this;
  };
  this.setQuantity = function(integer) {
    if (serialized) {
      throw new Error("Cannot change quantity of a serialized item");
    }
    if (! isPositiveInteger(integer)) {
      throw new Error("Invalid quantity: " + integer);
    }
    quantity = integer;
    return this;
  };

  // private helper functions
  function isPositiveInteger(integer) {
    return ! isNaN(integer) &&
      Math.floor(integer) === integer &&
      Math.abs(integer) === integer;
  }
}

Item_.prototype.dataIndex = JSON.parse(
  PropertiesService.getScriptProperties()
    .getProperty(defaults.inventorySheet.index.key)
);

/**
 * archive returns a plain object with the quantity made public
 * used by Inventory when stringifying
 */
Item_.prototype.archive = function() {
  var obj = Object.assign({}, this);
  obj.quantity = this.getQuantity();
  return obj;
};
