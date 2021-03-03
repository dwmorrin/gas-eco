import env from "./env.js";

export default class Item {
  constructor(itemData) {
    // Initially created from String[] from Google Sheets
    if (Array.isArray(itemData)) {
      const { BARCODE, ID, MAKE, MODEL, DESCRIPTION } = env.items;
      this.barcode = String(itemData[BARCODE]);
      this.id = String(itemData[ID]);
      this.description = "";
      this.notes = "";
      this.missing = false; // true if item cannot be found when form is closed
      this.timeCheckedInByClient = "";
      this.timeCheckedInByServer = "";
      this.timeCheckedOutByClient = "";
      this.timeCheckedOutByServer = "";
      this.description =
        itemData[MAKE] && itemData[MODEL]
          ? `${itemData[MAKE]} ${itemData[MODEL]}`
          : String(itemData[DESCRIPTION]);
    } else {
      // copying another item
      this.barcode = String(itemData.barcode);
      this.id = String(itemData.id);
      this.description = String(itemData.description);
      this.notes = String(itemData.notes);
      this.missing = Boolean(itemData.missing);
      this.timeCheckedInByClient = String(itemData.timeCheckedInByClient);
      this.timeCheckedInByServer = String(itemData.timeCheckedInByServer);
      this.timeCheckedOutByClient = String(itemData.timeCheckedOutByClient);
      this.timeCheckedOutByServer = String(itemData.timeCheckedOutByServer);
    }

    return Object.freeze(this);
  }

  get serialized() {
    return this.barcode && (+this.barcode < 10000 || +this.barcode > 10100);
  }
}
