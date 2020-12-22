/* exported  Item */
class Item {
  constructor(itemData) {
    // Initially created from String[] from Google Sheets
    if (Array.isArray(itemData)) {
      const MAKE = 3;
      const MODEL = 4;
      const DESCRIPTION = 5;
      const ID = 7;
      const BARCODE = 8;
      const CHECKED_OUT = 13;
      this.barcode = itemData[BARCODE]; // {string}
      this.id = itemData[ID]; // {string}
      this.checkedOut = Boolean(itemData[CHECKED_OUT]);
      this.checkIn = ""; // {string} formatted date
      this.checkOut = ""; // {string} formatted date
      this.description = ""; // {string} make, model, etc
      this.notes = ""; // {string} saves the notes for the item
      this.missing = false; // {bool} true if item cannot be found when form is closed
      this.quantity = 1;

      if (itemData[MAKE] && itemData[MODEL]) {
        this.description = itemData[MAKE] + " " + itemData[MODEL];
      } else {
        this.description = itemData[DESCRIPTION];
      }
    } else {
      // copying another item
      this.barcode = String(itemData.barcode || "");
      this.id = String(itemData.id || "");
      this.checkedOut = Boolean(itemData.checkedOut);
      this.checkIn = String(itemData.checkIn || "");
      this.checkOut = String(itemData.checkOut || "");
      this.description = String(itemData.description || "");
      this.notes = String(itemData.notes || "");
      this.missing = Boolean(itemData.missing);
      this.quantity = Number(itemData.quantity || 1);
    }
  }

  isSerialized() {
    return this.barcode && (+this.barcode < 10000 || +this.barcode > 10100);
  }
}
