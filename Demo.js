// Copy a preloaded (advanced bookings) forms sheet for each user to play with
// Don't make advanced bookings in real time because parsing gear takes a few seconds

/** End everything with Demo */

function makeFakeArchive() {
  // step through dates from Jan 1 to now
  var today = new Date();
  var makeDays = function() {
    var d = new Date('2018-01-01T00:00:00');
    function nextDay() {
      d.setDate(d.getDate() + 1);
      return d;
    }
    return function() { return nextDay() };
  }
  var day = makeDays(),
      time;
  while (time = day().getTime() < today.getTime()) {
    makeRandomForm(time);
  }
}

/** range is [0-max) */
function rndNumber(max) {
  return Math.floor(Math.floor(max) * Math.random());
}

function makeRandomForm(time) {
  var startTime = new Date(time);
  var students = [];
  var studentIds = ['jjv298', 'ajb814', 'sy1470', 'vq435', 'dls2135', 'abc651', 'jpk385'];
  for(var i = 0; i < rndNumber(3)+1; i++) {
    var studentData = getSheetDataByIdGAS_(studentIds[rndNumber(studentIds.length + 1)],
                                           index.students.SHEET_ID, index.students.SHEET_NAME,
                                          index.students.NETID);
    students.push(makeStudentFromDataGAS_(studentData));
    Logger.log(students[i].name);
  }
}

function lookAtAnArchive() {
  var sheet = SpreadsheetApp.openById(index.forms.DEMO_ID).getSheetByName('dm187@nyu.edu_Archive');
  var notes = sheet.getRange(3, 13).getValue();
  notes = JSON.parse(notes);
//  Logger.log(notes);
  notes.forEach(function(note){
    Logger.log(JSON.parse(note.body));
  });
}

/**
 Temp function just for making the fake archive!
 */
function fixArchives() {
  var sheet = SpreadsheetApp.openById(index.forms.DEMO_ID).getSheetByName('Archive');
  var data = sheet.getDataRange().getValues();
  data.shift();
  data.forEach(updateRow);
}

function updateRow(row) {
  var testRow = row;
  var testForm = makeFormFromDataGAS_(testRow);

  // checkin and checkout
  var stamp = {};
  var start = new Date(testForm.startTime);  
  stamp.start = start.getTime();
  var end = new Date(testForm.endTime);
  stamp.end = end.getTime();
  
  var changes = {};
  changes.start = [];
  changes.end = [];
  
  testForm.students.forEach(function(student){
    // make each checkin and check out
    student.checkIn = testForm.startTime;
    student.checkOut = testForm.endTime;
    // log each change
    changes.start.push({
      name: 'students',
      value: student.name + ' check-in',
      timestamp: stamp.start
    });
    changes.end.push({
      name: 'students',
      value: student.name + ' check-out',
      timestamp: stamp.end
    });
  });
  
  testForm.items.forEach(function(item){
    item.checkOut = testForm.startTime;
    item.checkIn = testForm.endTime;
    changes.start.push({
      name: 'items',
      value: item.id + ' check-out',
      timestamp: stamp.start
    });
    changes.end.push({
      name: 'items',
      value: item.id + ' check-in',
      timestamp: stamp.end
    });
  });
  var startNote = new Note_(stamp.start);
  var endNote = new Note_(stamp.end);
  var staff = [
    'dm187@nyu.edu', 'jtp6@nyu.edu', 'jte221@nyu.edu', 'di20@nyu.edu'
  ];
  startNote.author = staff[Math.floor(staff.length * Math.random())];
  endNote.author = staff[Math.floor(staff.length * Math.random())];
  startNote.body = JSON.stringify(changes.start);
  endNote.body = JSON.stringify(changes.end);
  var notes = [startNote, endNote];
  testForm.setNotes(notes);
  writeFormToSheetDEMO_(testForm, false, true);
}


/**
 * Change fake booked sessions to today's date
 * trigger set for daily 3am-4am
 */
function updateBookingDatesDemo() {
  var today = new Date();
  var makeId = function() {
    var timestamp = Date.now();
    function increment(value) {
      timestamp += value;
    }
    return function() {
      increment(100);
      return timestamp;
    };
  }
  var id = makeId();
  var masterSheet = SpreadsheetApp.openById(index.forms.DEMO_ID).getSheetByName(index.forms.SHEET_NAME);
  var range = masterSheet.getRange(2, 1, 5, 3); // all bookings, id, start and end columns
  var values = range.getValues();
  values.forEach(function(dates) {
    dates[0] = id();
    dates[1].setDate(today.getDate());
    dates[1].setMonth(today.getMonth());
    dates[1].setFullYear(today.getFullYear());
    dates[2].setTime(dates[1].getTime() + (1000 * 60 * 60 * 3));
  });
  range.setValues(values);
}

function checkItemsDemo_(form) {  
  form.items.forEach(function(item) {
    if(!item.checkIn && item.checkOut && !item.checkedOut) { // requesting checkout
      // @todo
      // Real version with multiple instances of Equipment Check-Outs requires real validation here
      item.checkedOut = true;
    } else if(item.checkIn && item.checkedOut) { // requesting check-in
      // @todo also validation here
      item.checkedOut = false;
    }
  });
  return form;
}

/**
 * Converts an example set of bookings into forms.
 * Only needs to run once for the demo to create a master form list.
 * Each user copies the master form to create their own forms for their session.
 * @return undefined
 */
function createDailyFormsDEMO_() {
  var bookingSheet = SpreadsheetApp.openById(index.bookings.DEMO_ID).getSheetByName(index.bookings.SHEET_NAME);
  var data = bookingSheet.getDataRange().getValues();
  data.shift();
  data.forEach(function(bookingData) {
    createBookingFormDEMO_(makeBookingFromDataGAS_(bookingData));
  });
}

/**
 * Converts a 600+ set of bookings into forms for the archive.
 * @return undefined
 */
function createFormsArchiveDEMO() {
  var bookingSheet = SpreadsheetApp.openById(index.bookings.FALL_17).getSheetByName(index.bookings.SHEET_NAME);
  var data = bookingSheet.getDataRange().getValues();
  data.shift();
  data.forEach(function(bookingData) {
    createBookingFormDEMO_(makeBookingFromDataGAS_(bookingData), true);
  });
}

/** @see createDailyFormsDEMO_ */
function createBookingFormDEMO_(booking, forArchive) {
  var form = new Form_(),
      bookedStudents = booking.getBookedStudents(),
      itemStringArray = booking.getItems(),
      items = [],
      studentStringArray,
      students = [];
  
  // handle booking students -> form students
  studentStringArray = bookedStudents.replace(/, /g, ',').split(',');
  studentStringArray.forEach(function getArrayOfStudentsByName(studentName) {
    var data = getSheetDataByIdGAS_(studentName, index.students.SHEET_ID, index.students.SHEET_NAME, index.students.NAME);
    students.push(makeStudentFromDataGAS_(data));
  });
  
  // handle booking items -> form items
  if(itemStringArray) {
    itemStringArray = itemStringArray.split(',');
    itemStringArray.forEach(function getArrayOfItemsById(stringData) {
      var bookingData = stringData.split(';'); // [desc, id, qty]
      var itemData = getSheetDataByIdGAS_(bookingData[1], index.items.SHEET_ID, index.items.SHEET_NAME, index.items.ID);
      try {
        var item = makeItemFromDataGAS_(itemData);
        item.setDescription(bookingData[0])
            .setQuantity(bookingData[2]);
        items.push(item);
      } catch(e) {
        ;
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
  
  if(!forArchive) {
    writeFormToSheetDEMO_(form);
  } else {
    writeFormToSheetDEMO_(form, false, true);
  }
  
  return form;
}

function getAllItemsDemo_() {
  var sheet = SpreadsheetApp.openById(index.items.DEMO_ID).getSheetByName(index.items.DEMO_NAME);
  var data = sheet.getDataRange().getValues();
  data.shift();
  var items = [];
  var itemIdregex = /[A-Za-z]+-[A-Za-z0-9]+/; // one or more letters, hyphen, one or more digits/letters
  data.forEach(function(itemData) {
    // @todo just stuff with an item ID to start - reevaluate later
    if(itemIdregex.test(itemData[index.items.ID])) {
      items.push(makeItemFromDataGAS_(itemData));
    }
  });
  return items;
}

/**
 * Creates or finds a personal set of forms for the user.
 * This is just a trick for the demo so that each team member can play
 * with the app data independently of each other and
 * easily reset the data at any time.
 * @param {boolean} reset - indicates the user is requesting a reset of the data.
 * @see resetDEMO_ 
 */
function getSheetDEMO_(reset) {
  var user = getUser_();
  var ss = SpreadsheetApp.openById(index.forms.DEMO_ID);
  var formsSheet = ss.getSheetByName(user);   // try to pull sheet, undefined if does not exist
  if(!formsSheet || reset) {                  // doesn't exist or we want to reset
    var masterSheet = ss.getSheetByName('Forms');  // @see createDailyBookingFormsDEMO_
    if(!formsSheet) formsSheet = ss.insertSheet(user); // this creates a sheet with a name 'user@nyu.edu'
    var range = formsSheet.getRange(1, 1, 6, 13);  // grab the range we're going to copy
    masterSheet.getRange(1,1,6,13).copyTo(range);  // copy onto the user's sheet
  }
  return formsSheet;
}

function getArchiveDEMO_(reset) {
  var user = getUser_();
  var ss = SpreadsheetApp.openById(index.forms.DEMO_ID);
  var archiveSheet = ss.getSheetByName(user + '_Archive');   // try to pull sheet, undefined if does not exist
  if(!archiveSheet || reset) {                  // doesn't exist or we want to reset
    var masterSheet = ss.getSheetByName('Archive');
    if(!archiveSheet) {
      archiveSheet = ss.insertSheet(user + '_Archive'); // this creates a sheet with a name 'user@nyu.edu_Archive'
    } else {
      archiveSheet.clear();
    }
    var lastRow = masterSheet.getLastRow();
    var range = archiveSheet.getRange(1, 1, lastRow, 13);
    masterSheet.getRange(1, 1, lastRow, 13).copyTo(range);
  }
  return archiveSheet;
}

function getArchivedFormsDEMO_(dateRangeJSON) {
  var dateRange = JSON.parse(dateRangeJSON); // dateRange.start, dateRange.end
  dateRange.start = utility.date.parseFormattedDate(dateRange.start);
  dateRange.end = utility.date.parseFormattedDate(dateRange.end);
  var sheet = getArchiveDEMO_();
  var data = sheet.getDataRange().getValues(),
      forms = [];
  data.shift();
  data.forEach(function(row) { forms.push(makeFormFromDataGAS_(row)); });
  forms = forms.filter(function(form) {
    var start = utility.date.parseFormattedDate(form.startTime);
    var end = utility.date.parseFormattedDate(form.endTime);
    return (start.getTime() >= dateRange.start.getTime() && end.getTime() <= dateRange.end.getTime());
  });
  return forms;
}

/** @see getOpenFormsGAS_ */
function getOpenFormsDEMO_() {
  var formsSheet = getSheetDEMO_();
  var data = formsSheet.getDataRange().getValues(),
      forms = [];
  data.shift();
  data.forEach(function getArrayOfForms(sheetData) {
    forms.push(makeFormFromDataGAS_(sheetData));
  });
  return forms;
}

/** a driver for getSheetDEMO_ */
function resetDEMO_() {
  var formSheet = getSheetDEMO_();
  formSheet.clear();
  getSheetDEMO_(true);
}

function writeFormToSheetDEMO_(form, closeAndArchive, forArchive) {
  var formSheet;
  if(!forArchive) {
    formSheet = getSheetDEMO_();
  } else {
    formSheet = SpreadsheetApp.openById(index.bookings.FALL_17).getSheetByName('ArchivedFix');
  }
  var data = formSheet.getDataRange().getValues();
  var row;
  var values = [
    form.getId(),
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
  
  if(closeAndArchive) {
    var archive = getArchiveDEMO_();
    archive.appendRow(values);
    // Note: do not shift data
    row = data.findRowContaining(form.id, 0, true);
  
    if(!row) {
      throw 'could not delete form ' + form;
    } else {
      row++;
    }
    formSheet.getRange(row, 1, 1, 13).deleteCells(SpreadsheetApp.Dimension.ROWS);
    return;
  }

  if(!form.id) { // create
    values[0] = form.createId();
    formSheet.appendRow(values);
  } else if(forArchive) {
    formSheet.appendRow(values);
  } else { // update
    var column = 1,
        numRows = 1,
        numColumns = 13,
        data = formSheet.getDataRange().getValues(),
        range,
        row;
    
    // Note: do not shift data
    row = data.findRowContaining(form.id, 0, true);

    if(!row) {
      throw 'could not find form ' + form;
    } else {
      row++;
    }
    range = formSheet.getRange(row, column, numRows, numColumns);
    range.setValues([values]);
  }
  
  return form;
}