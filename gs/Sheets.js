/** End all functions in this file with GAS_ */
/* global
Form_
Booking_
utility
Item_
Student_
*/
/********** GLOBAL VARIABLES ************/
var index = {
  bookings: {
    SHEET_ID   : '1zl4FBglYgCdR_FMdfbIQOOpnt9b8TwgnjxzRwcekPrY',
    SHEET_NAME : 'Daily Booking Data',
    ID         : 0,
    START_TIME : 1,
    END_TIME   : 2,
    LOCATION   : 3,
    STUDENTS   : 4,
    CONTACT    : 5,
    PROJECT    : 6,
    TAPE       : 7,
    DOLBY      : 8,
    LIVE_ROOM  : 9,
    ITEMS      : 10
  },
  forms: {
    SHEET_ID        : '1pVpSJrX_TlBpalJLCwV8qa7RDMz2CxGkhIMvhYb3w3o',
    SHEET_NAME      : 'Forms',
    ARCHIVE_NAME    : 'Archive',
    ID              : 0,
    START_TIME      : 1,
    END_TIME        : 2,
    LOCATION        : 3,
    BOOKING_ID      : 4,
    BOOKED_STUDENTS : 5,
    CONTACT         : 6,
    PROJECT         : 7,
    TAPE            : 8,
    OVERNIGHT       : 9,
    STUDENTS        : 10,
    ITEMS           : 11,
    NOTES           : 12
  },
  // Inventory cheat sheet: [[Location, Category, Sub Category, Manufacturer , Model,
  //  Description, Serial, Item ID, Barcode No., Reserveable, Reservations, Check-Out History, Repair History, Checked-Out, ID, Qnty, Notes]]
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
  form.items.forEach(function checkItems(item) {
    if (! item.checkIn && item.checkOut && ! item.checkedOut) { // requesting checkout
      for (var i = 0, l = data.length; i < l; i++) {
        if (data[i][index.items.ID] != item.id) {
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
      for (i = 0, l = data.length; i < l; i++) {
        if (data[i][index.items.ID] != item.id) {
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
  });
  return form;
}

/********** CREATORS ************/

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
    createBookingFormGAS_(makeBookingFromDataGAS_(bookingData));
  });
}

/**
 * @param {Booking}
 * @return {Form}
 */
function createBookingFormGAS_(booking) {
  var form = new Form_(),
      bookedStudents = booking.getBookedStudents(),
      itemStringArray = booking.getItems(),
      items = [],
      studentStringArray,
      students = []; 

  // handle booking students -> form students
  studentStringArray = bookedStudents.replace(/, /g, ',').split(',');
  studentStringArray.forEach(function getArrayOfStudentsByName(studentName) {
    var data = getSheetDataByIdGAS_(
      studentName, index.students.SHEET_ID,
      index.students.SHEET_NAME, index.students.NAME
    );
    students.push(makeStudentFromDataGAS_(data));
  });
  
  // handle booking items -> form items
  if (itemStringArray) {
    itemStringArray = itemStringArray.split(',');
    itemStringArray.forEach(function getArrayOfItemsById(stringData) {
      var bookingData = stringData.split(';'); // [desc, id, qty]
      var itemData = getSheetDataByIdGAS_(
        bookingData[1], index.items.SHEET_ID,
        index.items.SHEET_NAME, index.items.ID
      );
      try { // TODO this try block only for proof of concept purposes. debug for production
        var item = makeItemFromDataGAS_(itemData);
        item.setDescription(bookingData[0])
          .setQuantity(bookingData[2]);
        items.push(item);
      } catch(e) {
        // ignoring errors for proof of concept.  Don't ignore this in production.
      }
    });
  }
  
  form.setBookedStudents(bookedStudents)
    .setBookingId(booking.getId())
    .setItems(items)
    .setStartTime(booking.getStartTime())
    .setEndTime(booking.getEndTime())
    .setLocation(booking.getLocation())
    .setContact(booking.getContact())
    .setTape(booking.getTape())
    .setProject(booking.getProject())
    .setStudents(students);
  
  writeFormToSheetGAS_(form);
  
  return form;
}

/********** GETTERS ************/

/* exported getAllItemsGAS_ */
function getAllItemsGAS_() {
  var sheet = SpreadsheetApp.openById(index.items.SHEET_ID)
    .getSheetByName(index.items.SHEET_NAME);
  var data = sheet.getDataRange().getValues();
  data.shift();
  var items = [];
  var itemIdregex = /[A-Za-z]+-[A-Za-z0-9]+/; // one or more letters, hyphen, one or more digits/letters
  data.forEach(function getArrayOfItemsByData(itemData) {
    // @todo just stuff with an item ID to start - reevaluate later
    if (itemIdregex.test(itemData[index.items.ID])) {
      items.push(makeItemFromDataGAS_(itemData));
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
      forms = [];
  data.shift();
  data.forEach(function(row) { forms.push(makeFormFromDataGAS_(row)); });
  forms = forms.filter(function(form) {
    var start = utility.date.parseFormattedDate(form.startTime);
    var end = utility.date.parseFormattedDate(form.endTime);
    return (
      start.getTime() >= dateRange.start.getTime() &&
      end.getTime()   <= dateRange.end.getTime()
    );
  });
  return forms;
}

/** @return {[]} an array of Forms */
/* exported getOpenFormsGAS_ */
function getOpenFormsGAS_() {
  var formsSheet = SpreadsheetApp.openById(index.forms.SHEET_ID)
    .getSheetByName(index.forms.SHEET_NAME);
  var data = formsSheet.getDataRange().getValues(),
      forms = [];
  data.shift();
  data.forEach(function getArrayOfForms(sheetData) {
    forms.push(makeFormFromDataGAS_(sheetData));
  });
  return forms;
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
  return data.findRowContaining(value, idIndex);
}

/********** MAKERS ************/

/**
 * @param {[]} bookingData
 * @return {Booking}
 */
function makeBookingFromDataGAS_(bookingData) {
  var booking = new Booking_(bookingData[index.bookings.ID]);
  
  booking.setBookedStudents(bookingData[index.bookings.STUDENTS])
    .setItems(bookingData[index.bookings.ITEMS])
    .setStartTime(utility.date.getFormattedDate(bookingData[index.bookings.START_TIME]))
    .setEndTime(utility.date.getFormattedDate(bookingData[index.bookings.END_TIME]))
    .setLocation(bookingData[index.bookings.LOCATION])
    .setContact(bookingData[index.bookings.CONTACT])
    .setTape(bookingData[index.bookings.TAPE])
    .setProject(bookingData[index.bookings.PROJECT]);
  
  return booking;
}

/** @param {object []} sheetData - a row pulled from Forms Sheet */ 
function makeFormFromDataGAS_(sheetData) {
  var form = new Form_(sheetData[index.forms.ID]),
      studentInfo = JSON.parse(sheetData[index.forms.STUDENTS]),
      itemsInfo = JSON.parse(sheetData[index.forms.ITEMS]),
      notes = JSON.parse(sheetData[index.forms.NOTES]);
  
  form.setBookingId(sheetData[index.forms.BOOKING_ID])
    .setBookedStudents(sheetData[index.forms.BOOKED_STUDENTS])
    .setItems(itemsInfo)
    .setStartTime(utility.date.getFormattedDate(sheetData[index.forms.START_TIME]))
    .setEndTime(utility.date.getFormattedDate(sheetData[index.forms.END_TIME]))
    .setLocation(sheetData[index.forms.LOCATION])
    .setContact(sheetData[index.forms.CONTACT])
    .setTape(sheetData[index.forms.TAPE])
    .setProject(sheetData[index.forms.PROJECT])
    .setStudents(studentInfo)
    .setNotes(notes)
    .setHash();
  
  return form;
}

function makeItemFromDataGAS_(itemData) {
  var item = new Item_(itemData[index.items.ID]),
      description;
  
  // Item has only a simple 'description' field
  // Sheet implementation (this) must distill available fields into description
  if (itemData[index.items.MAKE] && itemData[index.items.MODEL]) {
    description = itemData[index.items.MAKE] + ' ' + itemData[index.items.MODEL];
  } else {
    description = itemData[index.items.DESCRIPTION];
  }
  
  item.setBarcode(itemData[index.items.BARCODE])
    .setDescription(description)
    .setCheckedOut(itemData[index.items.CHECKED_OUT]);
  
  return item;
}

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

/********** WRITERS ************/

/* exported writeCodabarGAS_ */
function writeCodabarGAS_(netId, codabar) {
  var sheet = SpreadsheetApp.openById(index.students.SHEET_ID)
    .getSheetByName(index.students.SHEET_NAME);
  var data = sheet.getDataRange().getValues();
  var i = data.findRowContaining(netId, index.students.NETID, true);
  if (! i) {
    throw 'Could not match ' + netId;
  } else {
    sheet.getRange(i + 1, index.students.ID + 1).setValue(codabar);
  }
}

function writeFormToSheetGAS_(form, closeAndArchive) {
  var ss = SpreadsheetApp.openById(index.forms.SHEET_ID);
  var formSheet = ss.getSheetByName(index.forms.SHEET_NAME);
  var data = formSheet.getDataRange().getValues();
  var id = form.getId();
  var values = [
    id,
    form.getStartTime(),
    form.getEndTime(),
    form.getLocation(),
    form.getBookingId(),
    form.getBookedStudents(),
    form.getContact(),
    form.getProject(),
    form.getTape(),
    form.getOvernight(),
    JSON.stringify(form.getStudents()),
    JSON.stringify(form.getItems()),
    JSON.stringify(form.getNotes())
  ];

  if (! id) { // create
    values[0] = form.createId();
    formSheet.appendRow(values);
    // see TODO below for more info on why this is necessary
    return makeFormFromDataGAS_(
      formSheet.getRange(formSheet.getLastRow(), 1, 1, 13).getValues()[0]
    ).setHash();
  }

  // Note: do not shift data
  var index_ = data.findRowContaining(id, 0, true);
  if (! index_) {
    throw 'could not find form ' + form;
  }
  var row = index_ + 1;

  // Do not allow write unless user was editing most
  // recent form.  Use try/catch around call to this function
  // to handle this error
  var storedForm = makeFormFromDataGAS_(data[index_]);
  if (form.getHash() != storedForm.getHash()) {
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
  return makeFormFromDataGAS_(range.getValues()[0]).setHash();
}

/* exported writeSignatureToSheetGAS_ */
function writeSignatureToSheetGAS_(request) {
  var sheet = SpreadsheetApp.openById(index.students.SHEET_ID)
    .getSheetByName(index.students.SHEET_NAME);
  var data = sheet.getDataRange().getValues();
  var i = data.findRowContaining(request.id, index.students.NETID, true);
  if (! i) {
    throw 'Could not match ' + request.id;
  } else {
    sheet.getRange(i + 1, index.students.SIGNATURE + 1).setValue(request.dataURL);
  }
}

/* exported startSignature_ */
function startSignature_(netid) {
  var sheet = SpreadsheetApp.openById(index.students.SHEET_ID)
    .getSheetByName(index.students.SIGNATURE_SHEET_NAME);
  sheet.getRange('A1').setValue(netid);
}

/* exported clearSignatureValidationGAS_ */
function clearSignatureValidationGAS_() {
  var sheet = SpreadsheetApp.openById(index.students.SHEET_ID)
    .getSheetByName(index.students.SIGNATURE_SHEET_NAME);
  sheet.getRange('A1').clear();
}
