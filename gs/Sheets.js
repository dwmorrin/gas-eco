/** End all functions in this file with GAS_ */
/* global
getUser_
Form_
Booking_
utility
Inventory_
Item_
Stack_
Student_
*/
/* ********* GLOBAL VARIABLES *********** */
var index = {
  bookings: {
    SHEET_ID   : '1zl4FBglYgCdR_FMdfbIQOOpnt9b8TwgnjxzRwcekPrY',
    SHEET_NAME : 'Daily Booking Data'
  },
  forms: {
    SHEET_ID        : '1yMDg9w-vjZxeOYgES-XsicoWp9VvjV3xqCmdZhAyNI4',
    SHEET_NAME      : 'Forms',
    REJECTED_NAME   : 'Rejected',
    ARCHIVE_NAME    : 'Archive'
  },
  items: {
    SHEET_ID    : '1XYu7fGgmuZ3DTa8y2JNbwwKuHw8_XNJ4VEwgZCf_UME',
    SHEET_NAME  : 'Inventory',
    MAKE        : 3,
    MODEL       : 4,
    DESCRIPTION : 5,
    ID          : 7,
    BARCODE     : 8,
    HISTORY     : 11,
    CHECKED_OUT : 13
  },
  students: {
    SHEET_ID              : '126XmGFPuNPJpJPF7aKNFSeaOAgvFNerMYdnFg2F7YAA',
    SHEET_NAME            : 'Students',
    SIGNATURE_SHEET_NAME  : 'Validation',
    ID                    : 0,
    NAME                  : 1,
    NETID                 : 2,
    CONTACT               : 3,
    SIGNATURE             : 4
  }
};

/* exported checkItemsGAS_ */
function checkItemsGAS_(form) {
  var sheet = SpreadsheetApp.openById(index.items.SHEET_ID)
    .getSheetByName(index.items.SHEET_NAME);
  var data = sheet.getDataRange().getValues();
  form.items.forEach(checkItems);
  function checkItems(item) {
    var id = item.id ? "id" : "barcode";
    if (! item.checkIn && item.checkOut && ! item.checkedOut) { // requesting checkout
      if (! item.isSerialized()) {
        item.checkedOut = true;
        return;
      }
      for (var i = 0, l = data.length; i < l; i++) {
        if (data[i][index.items[id.toUpperCase()]] != item[id]) {
          continue;
        }
        if (! data[i][index.items.CHECKED_OUT]) {
          sheet.getRange(i + 1, index.items.CHECKED_OUT + 1).setValue(true);
          item.checkedOut = true;
          return;
        } else {
          throw item.description + item.id + ' is already checked out';
        }
      }
    } else if (item.checkIn && item.checkedOut) { // requesting check-in
      if (! item.isSerialized()) {
        item.checkedOut = false;
        return;
      }
      for (i = 0, l = data.length; i < l; i++) {
        if (data[i][index.items[id.toUpperCase()]] != id) {
          continue;
        }
        if (data[i][index.items.CHECKED_OUT]) {
          sheet.getRange(i + 1, index.items.CHECKED_OUT + 1).clear();
          item.checkedOut = false;
          return;
        } else {
          throw item.description + item.id + ' is already checked in';
        }
      }
    }
  }
  return form;
}

/* ********* CREATORS *********** */

/**
 * Loops createBookingFormGAS_ for each daily booking
 */
/* exported createDailyBookingFormsGAS_ */
function createDailyBookingFormsGAS_() {
  var bookingSheet = SpreadsheetApp.openById(index.bookings.SHEET_ID)
    .getSheetByName(index.bookings.SHEET_NAME);
  var data = bookingSheet.getDataRange().getValues();
  data.shift();
  data.forEach(function getArrayOfBookingForms(bookingData) {
    createBookingFormGAS_(new Booking_(bookingData));
  });
}

/**
 * @param {Booking}
 * @return {Form}
 */
function createBookingFormGAS_(booking) {
  var bookedStudents = booking.getBookedStudents(),
      bookedItems = booking.getItems(),
      items = new Inventory_(),
      students = [];

  // handle booking students -> form students
  bookedStudents.forEach(function getArrayOfStudentsByName(studentName) {
    var data = getSheetDataByIdGAS_(
      studentName,
      index.students.SHEET_ID,
      index.students.SHEET_NAME,
      index.students.NAME
    );
    students.push(makeStudentFromDataGAS_(data));
  });

  // handle booking items -> form items
  if (bookedItems) {
    bookedItems.forEach(function (itemRecord) {
      var id = itemRecord[1],
          qty = itemRecord[2];
      var itemData = getSheetDataByIdGAS_(
        id,
        index.items.SHEET_ID,
        index.items.SHEET_NAME,
        index.items.ID
      );
      var item = new Item_(itemData);
      item.setQuantity(qty);
      items.push(item);
    });
  }

  var form = new Form_({
    bookedStudents: bookedStudents,
    bookingId: booking.id,
    items: items,
    startTime: booking.startTime,
    endTime: booking.endTime,
    location: booking.location,
    contact: booking.contact,
    tape: booking.tape,
    project: booking.project,
    students: students
  }).setHash();

  writeFormToSheetGAS_(form);

  return form;
}

/* ********* GETTERS *********** */

/* exported getAllItemsGAS_ */
function getAllItemsGAS_() {
  var sheet = SpreadsheetApp.openById(index.items.SHEET_ID)
    .getSheetByName(index.items.SHEET_NAME);
  var data = sheet.getDataRange().getValues();
  data.shift();
  var items = new Inventory_();
  var itemIdregex = /[A-Za-z]+-[A-Za-z0-9]+/; // one or more letters, hyphen, one or more digits/letters
  var itemBarcode = /^\d+$/;
  data.forEach(function (itemData) {
    if (itemBarcode.test(itemData[index.items.BARCODE]) ||
        itemIdregex.test(itemData[index.items.ID])    ) {
      items.push(new Item_(itemData));
    }
  });
  return items;
}

/* exported getAllStudentsGAS_ */
function getAllStudentsGAS_() {
  var sheet = SpreadsheetApp.openById(index.students.SHEET_ID)
    .getSheetByName(index.students.SHEET_NAME);
  var data = sheet.getDataRange().getValues();
  data.shift();
  var students = [];
  data.forEach(function getArrayOfStudents(studentData) {
    students.push(makeStudentFromDataGAS_(studentData));
  });
  return students;
}

/* exported getArchivedFormsGAS_ */
function getArchivedFormsGAS_(dateRangeJSON) {
  var dateRange = JSON.parse(dateRangeJSON); // dateRange.start, dateRange.end
  dateRange.start = utility.date.parseFormattedDate(dateRange.start);
  dateRange.end = utility.date.parseFormattedDate(dateRange.end);
  var sheet = SpreadsheetApp.openById(index.forms.SHEET_ID)
    .getSheetByName(index.forms.ARCHIVE_NAME);
  var data = sheet.getDataRange().getValues(),
      forms = new Stack_();
  data.shift();
  data.forEach(function(row) { forms.push(new Form_(row).setHash()); });
  forms = forms.filter(function(form) {
    var start = utility.date.parseFormattedDate(form.startTime);
    var end = utility.date.parseFormattedDate(form.endTime);
    return (
      start.getTime() >= dateRange.start.getTime() &&
      end.getTime()   <= dateRange.end.getTime()
    );
  });
  return forms.archive();
}

/** @return {[]} an array of Forms */
/* exported getOpenFormsGAS_ */
function getOpenFormsGAS_() {
  var formsSheet = SpreadsheetApp.openById(index.forms.SHEET_ID)
    .getSheetByName(index.forms.SHEET_NAME);
  var data = formsSheet.getDataRange().getValues(),
      forms = new Stack_();
  data.shift();
  data.forEach(function getArrayOfForms(sheetData) {
    forms.push(new Form_(sheetData).setHash());
  });
  return forms.archive();
}

/**
 * @param {string} value - search value to match
 * @param {string} sheetId - to lookup spreadsheet
 * @param {string} sheetName - to lookup which sheet within spreadsheet
 * @param {integer} idIndex - optional if index != 0
 * @return {[]} row - raw Sheet data
 * row will be returned as undefined if not found
 */
function getSheetDataByIdGAS_(value, sheetId, sheetName, idIndex) {
  var sheet = SpreadsheetApp.openById(sheetId).getSheetByName(sheetName);
  var data = sheet.getDataRange().getValues();
  data.shift();
  var sheetData = data.findRowContaining(value, idIndex);
  if (typeof sheetData == "undefined") {
    throw new Error("could not find data for" +
      " Value: " + value + ", Sheet ID: " + sheetId +
     ", Sheet Name: " + sheetName + ", IDINDEX: " + idIndex
    );
  }
  return sheetData;
}

/* ********* MAKERS *********** */
function makeStudentFromDataGAS_(studentData) {
  var student = new Student_(studentData[index.students.ID]),
      signature = false;

  if (studentData[index.students.SIGNATURE]) {
    signature = true;
  }

  student.setName(studentData[index.students.NAME])
    .setNetId(studentData[index.students.NETID])
    .setSignatureOnFile(signature)
    .setContact(studentData[index.students.CONTACT]);
  return student;
}

/* ********* WRITERS *********** */

/* exported writeCodabarGAS_ */
function writeCodabarGAS_(netId, codabar) {
  var sheet = SpreadsheetApp.openById(index.students.SHEET_ID)
    .getSheetByName(index.students.SHEET_NAME);
  var data = sheet.getDataRange().getValues();
  var i = data.findRowContaining(netId, index.students.NETID, true);
  if (typeof i == "undefined") {
    throw new Error ('Could not write codabar for ' + netId);
  }
  sheet.getRange(i + 1, index.students.ID + 1).setValue(codabar);
}

/**
 * collisions result in rejected forms which are written to their own
 *   sheet for safekeeping.  Rejected forms are stored with an additional
 *   column containing the email address of the user whose form was rejected.
 *   Users can access their own rejected forms to view and delete them.
 */
/* exported writeRejectedFormToSheetGAS_ */
function writeRejectedFormToSheetGAS_(form) {
  var ss = SpreadsheetApp.openById(index.forms.SHEET_ID);
  var formSheet = ss.getSheetByName(index.forms.REJECTED_NAME);
  var values = form.getAsArray();
  values.push(getUser_());
  formSheet.appendRow(values);
}

function writeFormToSheetGAS_(form, closeAndArchive) {
  var ss = SpreadsheetApp.openById(index.forms.SHEET_ID);
  var formSheet = ss.getSheetByName(index.forms.SHEET_NAME);
  var data = formSheet.getDataRange().getValues();
  var id = form.id;
  var values = form.getAsArray();

  if (! id) { // create
    values[0] = form.createId();
    formSheet.appendRow(values);
    // see TODO below for more info on why this is necessary
    return new Form_(
      formSheet.getRange(formSheet.getLastRow(), 1, 1, 13).getValues()[0]
    ).setHash();
  }

  // Note: do not shift data
  var index_ = data.findRowContaining(id, 0, true);
  if (typeof index_ == "undefined") {
    throw 'could not find form ' + form;
  }
  var row = index_ + 1;

  // Do not allow write unless user was editing most
  // recent form.  Use try/catch around call to this function
  // to handle this error
  var storedForm = new Form_(data[index_]).setHash();
  if (form.hash != storedForm.hash) {
    var error = new Error("form collision: " + form.id);
    error.ECO_storedForm = JSON.stringify(storedForm);
    error.ECO_submittedForm = JSON.stringify(form);
    throw error;
  }

  if (closeAndArchive) {
    var archive = ss.getSheetByName(index.forms.ARCHIVE_NAME);
    archive.appendRow(values);
    // 'Close' form by deleting from active sheet
    formSheet.getRange(row, 1, 1, 13).deleteCells(SpreadsheetApp.Dimension.ROWS);
    return;
  }

  var column = 1,
      numRows = 1,
      numColumns = 13,
      range;
  range = formSheet.getRange(row, column, numRows, numColumns);
  range.setValues([values]);
  // TODO this retrieves the correct hash.  Trying to skip a step and hash the
  //   `values` variable directly comes up with a different hash due to
  //   Sheet converting numbers and dates. Consider plain text format to eliminate
  //   the extra retrieval step.
  return new Form_(range.getValues()[0]).setHash();
}

/* exported writeSignatureToSheetGAS_ */
function writeSignatureToSheetGAS_(request) {
  var sheet = SpreadsheetApp.openById(index.students.SHEET_ID)
    .getSheetByName(index.students.SHEET_NAME);
  var data = sheet.getDataRange().getValues();
  var i = data.findRowContaining(request.id, index.students.NETID, true);
  if (typeof i == "undefined") {
    throw 'Could not match ' + request.id;
  }
  sheet.getRange(i + 1, index.students.SIGNATURE + 1).setValue(request.dataURL);
}

/* exported startSignature_ */
// TODO don't hardcode A1; just append a row with the Net ID
function startSignature_(netid) {
  var sheet = SpreadsheetApp.openById(index.students.SHEET_ID)
    .getSheetByName(index.students.SIGNATURE_SHEET_NAME);
  sheet.getRange('A1').setValue(netid);
}

/* exported clearSignatureValidationGAS_ */
// TODO don't hardcode A1; search for the Net ID to clear off
function clearSignatureValidationGAS_() {
  var sheet = SpreadsheetApp.openById(index.students.SHEET_ID)
    .getSheetByName(index.students.SIGNATURE_SHEET_NAME);
  sheet.getRange('A1').clear();
}
