/* global utility Inventory_ */
/* exported Form_ */
function Form_(form) {
  var dataIndex = {
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
  };
  if (Array.isArray(form)) {
    this.bookedStudents = form[dataIndex.BOOKED_STUDENTS] || "";
    this.bookingId = form[dataIndex.BOOKING_ID] || "";
    this.contact = form[dataIndex.CONTACT] || "";
    this.endTime = utility.date.getFormattedDate(form[dataIndex.END_TIME]) || "";
    this.id = form[dataIndex.ID] || "";
    this.location = form[dataIndex.LOCATION] || "";
    this.project = form[dataIndex.PROJECT] || "";
    this.overnight = form[dataIndex.OVERNIGHT] || false;
    this.startTime = utility.date.getFormattedDate(form[dataIndex.START_TIME]) || "";
    this.tape = form[dataIndex.TAPE] || false;
    this.hash = "";
    
    // Dynamic properties
    this.items = new Inventory_(JSON.parse(form[dataIndex.ITEMS]));
    this.notes = JSON.parse(form[dataIndex.NOTES]) || [];       // []Note
    this.students = JSON.parse(form[dataIndex.STUDENTS]) || []; // []Student
  } else {
    // Static properties
    this.bookedStudents = form.bookedStudents || "";
    this.bookingId = form.bookingId || "";
    this.contact = form.contact || "";
    this.endTime = form.endTime || "";
    this.id = form.id || "";
    this.location = form.location || "";
    this.project = form.project || "";
    this.overnight = form.overnight || false;
    this.startTime = form.startTime || "";
    this.tape = form.tape || false;
    this.hash = form.hash || "";
    
    // Dynamic properties
    this.items = form.items instanceof Inventory_ ?
      form.items :
      new Inventory_(form.items);
    this.notes = form.notes || [];       // []Note
    this.students = form.students || []; // []Student
  }
}
Form_.prototype.createId = function() {
  this.id = "" + Date.now();
  return this.id;
};
  
Form_.prototype.setHash = function(hash) {
  if (hash) {
    this.hash = hash;
  } else {
    this.hash = "";
    this.hash = utility.hash.make(JSON.stringify(this));
  }
  return this;
};

Form_.prototype.archive = function() {
  var items = this.items.archive();
  var copy = Object.assign({}, this);
  copy.items = items;
  return copy;
};

Form_.prototype.stringify = function() {
  var items = this.items.archive();
  var copy = Object.assign({}, this);
  copy.items = items;
  return JSON.stringify(copy);
};

Form_.prototype.getAsArray = function() {
  return [
    this.id,
    this.startTime,
    this.endTime,
    this.location,
    this.bookingId,
    this.bookedStudents,
    this.contact,
    this.project,
    this.tape,
    this.overnight,
    JSON.stringify(this.students),
    this.items.stringify(),
    JSON.stringify(this.notes)
  ];
};
