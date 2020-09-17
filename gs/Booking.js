/* global utility */
/* exported Booking_ */

/**
 * @param {array} bookingData
 */
function Booking_(bookingData) {
  if (!bookingData) {
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
 * @param {string[][]} data - sheet data, no header row
 */
Booking_.concatenateSessions = function(data) {
  var START = 1;
  if (!data[0] || typeof data[0][START] === "undefined") {
    // eslint-disable-next-line no-console
    console.log("No booking data was found");
    return [];
  }
  // CHECK FIRST DATE, if this is not today, then throw error
  if (data[0][START].getDate() != new Date().getDate()) {
    console.log("booking data dates incorrect, aborting");
    return [];
  }

  data.sort(sortByStudioThenStart);
  return data.reduce(concat, []);

  function sortByStudioThenStart(a, b) {
    var start = 1,
        studio = 3;
    if (a[studio] === b[studio]) {
      return a[start].getTime() - b[start].getTime();
    }
    return a[studio] < b[studio] ? -1 : 1;
  }

  function isSameTime(a, b) {
    return (
      a.getHours() === b.getHours() &&
      a.getMinutes() === b.getMinutes()
    );
  }

  // assumes input sorted such that a is earlier than b
  function isSameSession(a, b) {
    var start = 1, end = 2, studio = 3, students = 4;
    return (
      a[studio] === b[studio] &&
      a[students] === b[students] &&
      isSameTime(a[end], b[start])
    );
  }

  /**
   * comma separated items, semicolon separated fields
   * fields are: description, item ID or barcode, quantity
   * Example: "Mic;SHU-1;1,Cable;10009;2"
   * MySQL exports string "NULL" if no gear was reserved.
   * Does not handle adding quantites!
   * Will duplicate the item if quantities differ.
   * @param {string} a 
   * @param {string} b 
   * @returns {string} merge of b into a
   */
  function mergeGear(a, b) {
    if (!a || a === "NULL") {
      return b;
    }
    if (!b || b === "NULL") {
      return a;
    }
    // check if 'a' contains each item of 'b', append as needed
    b.split(",").forEach(function(string) {
      if (!a.match(string)) {
        a += "," + string;
      }
    });
    return a;
  }

  /**
   * Reducer function
   * @param {string[][]} rows 
   * @param {string[]} row 
   */
  function concat(rows, row) {
    var end = 2, gear = 10;
    if (!rows.length) {
      return [row];
    }
    var last = rows[rows.length - 1];
    if (isSameSession(last, row)) {
      // copy row to last and discard row
      last[end] = row[end];
      last[gear] = mergeGear(last[gear], row[gear]);
      return rows;
    }
    rows.push(row);
    return rows;
  }
};
