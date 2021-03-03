import { hexString, getSequentialNumber } from "./Utility";

export default class Item {
  constructor({
    barcode = "",
    description = "",
    id = "",
    missing = false,
    notes = "",
    timeCheckedInByClient = "",
    timeCheckedInByServer = "",
    timeCheckedOutByClient = "",
    timeCheckedOutByServer = "",
  }) {
    this.barcode = String(barcode);
    this.description = String(description);
    this.id = String(id);
    this.missing = Boolean(missing);
    this.notes = String(notes);
    this.timeCheckedInByClient = timeCheckedInByClient;
    this.timeCheckedInByServer = timeCheckedInByServer;
    this.timeCheckedOutByClient = timeCheckedOutByClient;
    this.timeCheckedOutByServer = timeCheckedOutByServer;

    return Object.freeze(this);
  }

  get serialized() {
    return this.barcode && (+this.barcode < 10000 || +this.barcode > 10100);
  }

  // item has been reserved in advance on the form, it has no time info
  get reserved() {
    return !this.missing && !this.timeCheckedOutByClient;
  }

  get stagedForOut() {
    return (
      !this.missing &&
      this.timeCheckedOutByClient &&
      !this.timeCheckedOutByServer
    );
  }

  get isOut() {
    return (
      !this.missing &&
      this.timeCheckedOutByServer &&
      !this.timeCheckedInByClient
    );
  }

  get stagedForIn() {
    return (
      !this.missing && this.timeCheckedInByClient && !this.timeCheckedInByServer
    );
  }

  get isIn() {
    return this.missing || this.timeCheckedInByServer;
  }

  // sequential number keeps serialized items separate (unique)
  get key() {
    return (
      this.barcode + this.id + (this.serialized ? getSequentialNumber() : "")
    );
  }

  static getManualPrefix() {
    return "MANUAL-";
  }

  static isManualEntryId(id) {
    return new RegExp("^" + Item.getManualPrefix()).test(id);
  }

  static getManualEntryId(hash) {
    return Item.getManualPrefix() + hexString(hash).substring(0, 5);
  }

  static similar(a, b) {
    return (
      a.barcode === b.barcode &&
      a.id === b.id &&
      a.description === b.description
    );
  }
}
