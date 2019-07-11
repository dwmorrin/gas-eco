/* global utility */
/* exported Booking_ */
/**
 * @param {array} bookingData
 */
function Booking_(bookingData) {
  if (! bookingData) {
    throw 'Booking cannot be generated without booking data';
  }
  var dataIndex = {
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
  };

  function handleSQLnull(input) {
    return input === 'NULL' ? null : input;
  }

  this.id = bookingData[dataIndex.ID];
  this.startTime = utility.date.getFormattedDate(bookingData[dataIndex.START_TIME]);
  this.endTime = utility.date.getFormattedDate(bookingData[dataIndex.END_TIME]);
  this.location = bookingData[dataIndex.LOCATION];
  this.bookedStudents = bookingData[dataIndex.STUDENTS];
  this.contact = handleSQLnull(bookingData[dataIndex.CONTACT]);
  this.project = bookingData[dataIndex.PROJECT];
  this.tape = Boolean(bookingData[dataIndex.TAPE]);
  this.items = handleSQLnull(bookingData[dataIndex.ITEMS]);
  
}
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
