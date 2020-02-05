/* global utility */
/* exported Booking_ */
/**
 * @param {array} bookingData
 */
function Booking_(bookingData) {
  if (! bookingData) {
    throw 'Booking cannot be generated without booking data';
  }

  function handleSQLnull(input) {
    return input === 'NULL' ? null : input;
  }

  this.id = bookingData[this.dataIndex.ID];
  this.startTime = utility.date.getFormattedDate(bookingData[this.dataIndex.START_TIME]);
  this.endTime = utility.date.getFormattedDate(bookingData[this.dataIndex.END_TIME]);
  this.location = bookingData[this.dataIndex.LOCATION];
  this.studentIDs = bookingData[this.dataIndex.STUDENT_IDS];
  this.bookedStudents = bookingData[this.dataIndex.STUDENTS];
  this.contact = handleSQLnull(bookingData[this.dataIndex.CONTACT]);
  this.project = bookingData[this.dataIndex.PROJECT];
  this.tape = Boolean(bookingData[this.dataIndex.TAPE]);
  this.items = handleSQLnull(bookingData[this.dataIndex.ITEMS]);
}

Booking_.prototype.dataIndex = {
  ID         : 0,
  START_TIME : 1,
  END_TIME   : 2,
  LOCATION   : 3,
  STUDENT_IDS: 4,
  STUDENTS   : 5,
  CONTACT    : 6,
  PROJECT    : 7,
  TAPE       : 8,
  DOLBY      : 9,
  LIVE_ROOM  : 10,
  ITEMS      : 11
};

// Getters
/**
 * @returns {string[][]} - 2d array of item info, null if no items
 */
Booking_.prototype.getItems = function() {
  if (typeof this.items != "string") {
    return null;
  }
  var items = this.items.split(',');
  items.forEach(function(item, index, array) {
    array[index] = item.split(';');
  });
  return items;
};
/**
 * @returns {string[]} - array of student names
 */
Booking_.prototype.getBookedStudents = function() {
  return this.bookedStudents.replace(/, /g, ',').split(',');
};

/**
 * @returns {string[]} - array of student IDs (NetIDs)
 */
Booking_.prototype.getStudentIDs = function() {
  return this.studentIDs.split(',');
};

/**
 * TODO this is a cut and paste from the booking form script
 *      index could be moved to prototype (shared with constructor)
 *      see TODO below regarding loops... it almost certainly could be improved
 *      try sorting the forms first?
 *      alternatively: get the MySQL query to concatenate the sessions
 * @param {string[][]} data - sheet data, no header row
 */
Booking_.concatenateSessions = function(data) {
  var START    = 1,
      END      = 2,
      STUDIO   = 3,
      STUDENTS = 4,
      GEAR     = 10;
  // IF NO DATA, RETURN
  if (! data[0] || typeof data[0][START] === "undefined") {
    // eslint-disable-next-line no-console
    console.log("No booking data was found");
    return;
  }

  // CHECK FIRST DATE, if this is not today, then throw error
  if (data[0][START].getDate() != new Date().getDate()) {
    throw "booking data dates incorrect, aborting";
  }

  // TODO: These blocks are suspiciously nested.  Can this be rewritten?
  for (var i = 0; i < data.length; i++) {
    var studioA = data[i][STUDIO];
    var studentsA = data[i][STUDENTS];
    for (var j = 0; j < data.length; j++) {
      var studioB = data[j][STUDIO];
      var studentsB = data[j][STUDENTS];
      if (i != j && studioA == studioB && studentsA == studentsB) {
        if (isSameTime(data[i][END],data[j][START])) { // if stopA == startB
          data[i][END] = data[j][END]; // change stopA to stopB
          // Check for gear, move any non-duplicate gear from B to A
          if (data[j][GEAR] != "NULL") {
            if (data[i][GEAR] != "NULL") {
              var gearA = Utilities.parseCsv(data[i][GEAR]);
              var gearB = Utilities.parseCsv(data[j][GEAR]);
              for (var b = 0; b < gearB[0].length; b++) {
                for (var a = 0; a < gearA[0].length; a++) {
                  if (gearA[0][a] == gearB[0][b]) {
                    gearB[0].splice(b, 1); // delete duplicate item
                  }
                }
              }
              data[i][GEAR] += ',' + gearB[0].toString(); // append non-duplicate items
            } else {
              data[i][GEAR] = data[j][GEAR]; // replace NULL with gear
            }
          }
          data.splice(j, 1); // delete row B
        }
      }
    }
  }
  return data;

  function isSameTime(a,b) {
    if ((a.getHours() == b.getHours()) && (a.getMinutes == b.getMinutes)) {
      return true;
    }
    return false;
  }
};
