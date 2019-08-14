/* exported defaults */
/**
 * defaults contains strings for property keys
 * and configurations for the data spreadsheets
 *
 * Each property that can be stored needs a type and a key.
 * A value is optional.  The type is to be used as a hint to the
 * client side code and user.
 *
 * any property ending in "Sheet" should have nested properties
 * with keys, types and optional values (no type, key, or value
 * keys directly under a "Sheet" property)
 * Client side code tests these names for /Sheet$/
 */
var defaults = {
  locations: {
    key: "locations",
    type: "string[]"
  },
  manualEntryBarcode: {
    key: "manualEntryBarcode",
    type: "string"
  },
  adminSheet: {
    id: {
      key: "adminSheetID",
      type: "string"
    },
    name: {
      key: "adminSheetName",
      type: "string",
      value: "Admin Settings"
    },
    url: {
      key: "adminSheetUrl",
      type: "string"
    },
  },
  formsSheet: {
    headerRow: {
      key: "formsSheetHeaderRow",
      type: "string[]",
      value: [
        "ID", "Start Time", "End Time", "Location", "Booking ID",
        "Booked Students", "Contact", "Project", "Tape", "Overnight",
        "Students", "Items", "Notes"
      ]
    },
    id: {
      key: "formsSheetID",
      type: "string"
    },
    index: {
      key: "formsSheetIndex",
      type: "string=integer{}",
      value: {
        ID: 0,
        START_TIME: 1,
        END_TIME: 2,
        LOCATION: 3,
        BOOKING_ID: 4,
        BOOKED_STUDENTS: 5,
        CONTACT: 6,
        PROJECT: 7,
        TAPE: 8,
        OVERNIGHT: 9,
        STUDENTS: 10,
        ITEMS: 11,
        NOTES: 12
      }
    },
    name: {
      key: "formsSheetName",
      type: "string",
      value: "Equipment Check Out Forms"
    },
    url: {
      key: "formsSheetUrl",
      type: "string"
    },
  },
  inventorySheet: {
    headerRow: {
      key: "inventorySheetHeaderRow",
      type: "string[]",
      value: [
        "Location", "Category", "Sub Category", "Manufacturer", "Model",
        "Description", "Quantity", "Serial", "Item ID", "Barcode",
        "Reserveable", "Reservations", "Check-Out History", "Repair History",
        "Checked Out", "Alt ID", "Notes"
      ]
    },
    id: {
      key: "inventorySheetID",
      type: "string"
    },
    index: {
      key: "inventorySheetIndex",
      type: "string=integer{}",
      value: {
        MAKE: 3,
        MODEL: 4,
        DESCRIPTION: 5,
        ID: 7,
        BARCODE: 8,
        HISTORY: 11,
        CHECKED_OUT: 13
      }
    },
    name: {
      key: "inventorySheetName",
      type: "string",
      value: "Equipment Check Out Inventory"
    },
    url: {
      key: "inventorySheetUrl",
      type: "string"
    },
  },
  usersSheet: {
    headerRow: {
      key: "usersSheetHeaderRow",
      type: "string[]",
      value: [
        "ID Card", "Name", "Company ID", "Contact", "Signature"
      ]
    },
    id: {
      key: "usersSheetID",
      type: "string"
    },
    index: {
      key: "usersSheetIndex",
      type: "string=integer{}",
      value: {
        ID: 0,
        NAME: 1,
        NETID: 2,
        CONTACT: 3,
        SIGNATURE: 4
      }
    },
    name: {
      key: "usersSheetName",
      type: "string",
      value: "Equipment Check Out Users"
    },
    url: {
      key: "usersSheetUrl",
      type: "string"
    },
  }
};
