/* global
          Form_
          checkItemsDemo_
          checkItemsGAS_
          clearSignatureValidationGAS_
          createDailyBookingFormsGAS_
          getAllItemsDemo_
          getAllItemsGAS_
          getAllStudentsGAS_
          getArchivedFormsDEMO_
          getOpenFormsDEMO_
          getOpenFormsGAS_
          resetDEMO_
          startSignature_
          writeCodabarGAS_
          writeFormToSheetDEMO_
          writeFormToSheetGAS_
          writeSignatureToSheetGAS_
*/
var runWith = 'demo';
//var runWith = 'GAS';

/**
 * This runs on a time driver trigger.
 * Replaces the printing of the physical forms.
 * @todo setup daily trigger
 */
/* exported createDailyForms_ */
function createDailyForms_() {
  switch (runWith) {
    case 'demo':
      break;
    case 'GAS':
      createDailyBookingFormsGAS_();
      break;
  }
}

/**
 * @see doPost
 * @todo - I'd rather see this under postForm_ than parallel to it
 */
function closeForm_(form) {
  form = isValidForm_(form);
  switch (runWith) {
    case 'demo':
      return writeFormToSheetDEMO_(form, true);
    case 'GAS':
      return writeFormToSheetGAS_(form, true);
    case 'SQL':
      return;
  }
}

/**
 * Runs on HTTP GET request.
 * Initial visit to the app URL triggers this function and returns a webpage.
 * Within the app, client requests for reading information come here.
 * External programs can access this function with HTTP GET as an API.
 * @see {@link https://developers.google.com/apps-script/guides/triggers/}
 */
/* exported doGet */
function doGet(request) {
  var response = {};
  var  webpage;
  if (!request.get) {
    webpage = HtmlService.createTemplateFromFile('html/index').evaluate();  
    webpage.setTitle('Equipment Check-Out');
    if (runWith == 'demo') {
      resetDEMO_();
    }
    return webpage;
  }
  
  switch (request.get) {
    case 'archive':
      response.formList = getArchive_(request.dateRangeJSON);
      break;
    case 'items':
      response.items = getAllItems_();
      break;
    case 'students':
      response.students = getAllStudents_();
      break;
    case 'user':
      response.user = getUser_();
      break;
    case 'openForms':
      response.formList = getOpenForms_();
      break;
  }
  
  if (request.init) {
    response.unlock = true;
  }
  
  response.target = request.get;
  
  return response;
}

/**
 * Runs on HTTP POST request.
 * Within the app, client requests for updating data come here.
 * External programs can access this function with HTTP POST as an API.
 * @see {@link https://developers.google.com/apps-script/guides/triggers/}
 */
/* exported doPost */
function doPost(request) {
  var response = {};
  switch (request.post) {
    case 'codabar':
      postCodabar_(request.netId, request.codabar);
      response.students = getAllStudents_();
      break;
    case 'demo':
      resetDEMO_();
      request.post = 'openForms';
      response.formList = getOpenForms_();
      break;
    case 'signature':
      postSignature_(request);
      response.students = getAllStudents_();
      break;
    case 'signatureTimeout':
      clearSignatureValidationGAS_();
      break;
    case 'startSignature':
      startSignature_(request.netid);
      break;
    case 'updateForm':
      var form = readForm_(request.form);
      if (isFormReadyToClose_(form) || isNoShow_(form)) {
        closeForm_(form);
        request.post = 'openForms';
        response.formList = getOpenForms_();
      } else {
        response.form = JSON.stringify(postForm_(form));
      }
      break;
    case 'unload':
      handleUnload_();
      break;
  }

  response.target = request.post;
  
  return response;
}

/** @todo - most likely will be called by doPost */
/* exported deleteForm_ */
function deleteForm_() {
  throw 'not implemented';
}

/** @see doGet */
function getAllItems_() {
  switch (runWith) {
    case 'demo':
      return JSON.stringify(getAllItemsDemo_());
    case 'GAS':
      return JSON.stringify(getAllItemsGAS_());
    case 'SQL':
      return;
  }
}

/** @see doGet */
function getAllStudents_() {
  switch (runWith) {
    case 'demo':
      // fallthrough
    case 'GAS':
      return JSON.stringify(getAllStudentsGAS_());
    case 'SQL':
      return;
  }
}

function getArchive_(dateRangeJSON) {
  switch (runWith) {
    case 'demo':
      return JSON.stringify(getArchivedFormsDEMO_(dateRangeJSON));
    case 'GAS':
      throw new Error('GAS function not set at getArchive_');
  }
}

/** @see doGet */
function getOpenForms_() {
  switch (runWith) {
    case 'demo':
      return JSON.stringify(getOpenFormsDEMO_());
    case 'GAS':
      return JSON.stringify(getOpenFormsGAS_());
    case 'SQL':
      return;
  }
}

/** @see doGet */
function getUser_() {
  return Session.getActiveUser().getEmail();
}

/**
 * This is called when the user closes the page in their browser.
 * Any clean up functions can be called from here.
 * @see doPost
 */
function handleUnload_() {
  switch (runWith) {
    case 'demo':
      // Reset demo
      resetDEMO_();
      // fallthrough
    case 'GAS':
      // clear signature validation
      clearSignatureValidationGAS_();
      return;
    case 'SQL':
      return;
  }
}

/**
 * Utility function to keep separate HTML, CSS, and JS files
 * @see {@link https://developers.google.com/apps-script/guides/html/best-practices}
 */
/* exported include_ */
function include_(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function isAllGearReturned_(form) {
  return form.items.every(function(item) {
    if (item.checkOut) return item.checkIn; else return true;
  });
}

/** 
 * Form validation
 * @see doPost
 */
function isCheckOutStudentOk_(form) {
  // is there another student still on the form? If not, is all gear returned?
  return isThereAnActiveStudent_(form) || isAllGearReturned_(form);
}

/** 
 * Form validation
 * @see doPost
 */
function isFormReadyToClose_(form) {
  if (!isCheckOutStudentOk_(form)) return false;
  return form.students.some(
    function(student) { return student.checkIn; }
  ) && form.students.every(
    function(student) {
      if (student.checkIn) { 
        return student.checkOut;
      }
      return true;
    }
  );
}

/**
 * @see doPost
 * check if the form has no students checked-in after the grace period
 */
function isNoShow_(form) {
  if (!form.id) return false;
  var gracePeriod = 30, // minutes
    start = new Date(form.startTime),
    now   = Date.now();
  
  var checkedIn = function(student) { return student.checkIn; };
  
  start.setMinutes(start.getMinutes() + gracePeriod);
  
  if (now > start.getTime() && !form.students.some(checkedIn)) {
    return true;
  } else {
    return false;
  }
}

/**
 * check if the end time has past but students have not checked out
 */
/* exported isMissingStudentCheckout_ */
function isMissingStudentCheckout_(form) {
  var isCheckedOut = function(student) {
    if (student.checkIn) return student.checkOut;
    else return true; // never checked-in
  };
  var end = new Date(form.endTime);
  if (Date.now() > end.getTime() && !form.students.every(isCheckedOut)) {
    return true;
  } else {
    return false;
  }
}

/**
 * counts number of students, returns true for 2 or more active students
 */
function isThereAnActiveStudent_(form) {
  var activeStudents = form.students.reduce(function(count, student) {
    if (student.checkIn && !student.checkOut) return count + 0;
    else return count;
  }, 0);
  return activeStudents > 1;
}

/** 
 * Form validation
 * @see doPost
 */
function isValidForm_(form) {
  if (form.items) {
    switch (runWith) {
      case 'demo':
        form = checkItemsDemo_(form);
        break;
      case 'GAS':
        form = checkItemsGAS_(form);
        break;
    }
  }
  return form;
}

function postCodabar_(netId, codabar) {
  writeCodabarGAS_(netId, codabar);
}

/** @see doPost */
function postForm_(form) {
  form = isValidForm_(form);
  switch (runWith) {
    case 'demo':
      return writeFormToSheetDEMO_(form);
    case 'GAS':
      return writeFormToSheetGAS_(form);
    case 'SQL':
      return;
  }
}

// //run.doPost({ post: 'signature', dataURL: dataURL, id: studentId }); 
function postSignature_(request) {
  switch (runWith) {
    case 'demo': // fallthrough
    case 'GAS':
      return writeSignatureToSheetGAS_(request);
  }
}

/**
 * This helper function restores a proper form with functions when the client transmits a form
 * that has been stripped of functions
 * @see doPost
 * @param {object} formObj - this object should be a Form without functions, sent from the client
 * @return {Form}
 */
function readForm_(formObj) {
  formObj = JSON.parse(formObj);
  var form;
  if (!formObj.id) {
    form = new Form_();
  } else {
    form = new Form_(formObj.id);
  }
  form.setBookedStudents(formObj.bookedStudents)
    .setBookingId(formObj.bookingId)
    .setContact(formObj.contact)
    .setEndTime(formObj.endTime)
    .setStartTime(formObj.startTime)
    .setLocation(formObj.location)
    .setProject(formObj.project)
    .setTape(formObj.tape)
    .setOvernight(formObj.overnight)
    .setStudents(formObj.students)
    .setItems(formObj.items)
    .setNotes(formObj.notes);
  return form;
}

var utility = { date: {} };

/**
 * Utility to get 'mm/dd/yyyy hh:mm am' format
 * @param {Date} date
 * @return {string}
 */
utility.date.getFormattedDate = function(date) {
  var year = date.getFullYear(),
    month = (date.getMonth() + 1), // zero indexed
    day = date.getDate(),
    hour = date.getHours(),
    minutes = date.getMinutes(),
    ampm = 'am';
    
  if (hour > 11) {
    ampm = 'pm';
    hour = hour % 12;
  }
  if (hour == 0) {
    hour = 12;
  }
  return utility.date.zeropad(month) + '/' + utility.date.zeropad(day) + '/' +
           year + ' ' + utility.date.zeropad(hour) + ':' +
           utility.date.zeropad(minutes) + ' ' + ampm;
};

/**
 * @param {string} dateString
 * @return {Date}
 */
utility.date.parseFormattedDate = function(dateString) {
  // mm/dd/yyyy hh:mm am
  var month   = dateString.slice(0,2),
    day     = dateString.slice(3,5),
    year    = dateString.slice(6,10),
    hour    = dateString.slice(11,13),
    minutes = dateString.slice(14,16),
    ampm    = dateString.slice(17,19);
  // convert ampm to 24 hour
  if (ampm == 'pm') {
    ampm = 12;
  } else {
    ampm = 0;
  }
  hour = hour % 12 + ampm;
  
  return new Date(year + '-' + utility.date.zeropad(month) + '-' +
           utility.date.zeropad(day) + 'T' + utility.date.zeropad(hour) + ':' +
           utility.date.zeropad(minutes) + ':00'
  );
};

/** Helper function for handling date strings */
utility.date.zeropad = function(x) {
  x = +x;
  if (x < 10) {
    return '0' + x;
  } else {
    return x;
  }
};
