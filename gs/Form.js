/* global utility */
/* exported Form_ */
function Form_(id) {
  // Static properties
  this.bookedStudents = null;  // string
  this.bookingId = null;       // string
  this.contact = null;         // string
  this.endTime = null;         // formatted date string
  this.id = (id || null);      // string
  this.location = null;        // string
  this.project = null;         // string
  this.overnight = null;       // boolean
  this.startTime = null;       // formatted date string
  this.tape = null;            // boolean
  this.hash = null;            // string
  
  // Dynamic properties
  this.items =  null;          // []Item
  this.notes = null;           // []Note
  this.students = null;        // []Student
  
  // Getters
  
  this.getBookedStudents = function() { return this.bookedStudents; };
  this.getBookingId = function() { return this.bookingId; };
  this.getContact = function() { return this.contact; };
  this.getEndTime = function() { return this.endTime; };
  this.getHash = function() { return this.hash; };
  this.getId = function() { return this.id; };
  this.getItems = function() { return this.items; };
  this.getLocation = function() { return this.location; };
  this.getNotes = function() { return this.notes; };
  this.getOvernight = function() { return this.overnight; };
  this.getProject = function() { return this.project; };
  this.getStartTime = function() { return this.startTime; };
  this.getStudents = function() { return this.students; };
  this.getTape = function() { return this.tape; };
  
  // Setters
  
  /** @param {string} */
  this.setBookedStudents = function(students) {
    this.bookedStudents = students;
    return this;
  };
  
  /** @param {string} */
  this.setBookingId = function(id) { this.bookingId = id; return this; };
  
  /** @param {string} */
  this.setContact = function(contact) {
    this.contact = contact;
    return this;
  };
  
  // Note: setId not allowed, use new Form(id) as setId
  this.createId = function() {
    this.id = "" + Date.now();
    return this.id;
  };
  
  /** @param {string} - formatted date */
  this.setEndTime = function(endTime) {
    this.endTime = String(endTime);
    return this;
  };

  this.setHash = function(hash) {
    if (hash) {
      this.hash = hash;
    } else {
      this.hash = null;
      this.hash = utility.hash.make(JSON.stringify(this));
    }
    return this;
  };
  
  /** @param {[]Item} */
  this.setItems = function(items) {
    this.items = (items || []);
    return this;
  };
  
  /** @param {string} */
  this.setLocation = function(location) {
    this.location = location;
    return this;
  };
  
  /** @param {[]Note} */
  this.setNotes = function(notes) {
    this.notes = (notes || []);
    return this;
  };
  
  /** @param {boolean} */
  this.setOvernight = function(overnight) {
    this.overnight = Boolean(overnight);
    return this;
  };
  
  /** @param {string} */
  this.setProject = function(project) {
    this.project = project;
    return this;
  };
  
  /** @param {string} - formatted date */
  this.setStartTime = function(startTime) {
    this.startTime = String(startTime);
    return this;
  };
  
  /** @param {[]Student} */
  this.setStudents = function(students) {
    this.students = (students || []);
    return this;
  };
  
  /** @param {boolean} */
  this.setTape = function(tape) {
    this.tape = Boolean(tape);
    return this;
  };
  
  return this;
}
