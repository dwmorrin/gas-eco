/* global
Form_
checkItemsGAS_
clearSignatureValidationGAS_
createDailyBookingFormsGAS_
getAllItemsGAS_
getAllStudentsGAS_
getArchivedFormsGAS_
getOpenFormsGAS_
startSignature_
writeCodabarGAS_
writeFormToSheetGAS_
writeSignatureToSheetGAS_
*/

/**
 * This runs on a time driver trigger.
 * Replaces the printing of the physical forms.
 * @todo setup daily trigger
 */
/* exported createDailyForms_ */
function createDailyForms_() {
  createDailyBookingFormsGAS_();
}

/**
 * @see doPost
 * @todo - I'd rather see this under postForm_ than parallel to it
 */
function closeForm_(form) {
  return writeFormToSheetGAS_(isValidForm_(form), true);
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
  if (! request.get) {
    webpage = HtmlService.createTemplateFromFile('html/index');
    webpage = webpage.evaluate();
    webpage.setTitle('Equipment Check-Out');
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
    case 'checkForms': // fallthrough
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
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (lockError) {
    // throwing will let whatever withErrorHandler is attached to handle this
    // the user should get some kind of "please try again" message
    throw lockError;
  }
  // we have the lock
  // we must check that there is no collision first, i.e. that thing we are trying
  // to update wasn't already updated by someone else.
  switch (request.post) {
    case 'codabar':
      postCodabar_(request);
      response.students = getAllStudents_();
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
      try {
        if (isFormReadyToClose_(form) || isNoShow_(form)) {
          closeForm_(form);
          request.post = 'openForms';
          response.formList = getOpenForms_();
        } else {
          response.form = JSON.stringify(postForm_(form));
        }
      } catch (error) {
        if (/^form collision/i.test(error.message)) {
          lock.releaseLock();
          response.target = "collision";
          response.form = error.ECO_storedForm; // already JSON stringed
          response.submittedForm = error.ECO_submittedForm;
          return response;
        } else {
          throw error;
        }
      }
      break;
    case 'unload':
      handleUnload_();
      break;
  }
  lock.releaseLock();
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
  return JSON.stringify(getAllItemsGAS_());
}

/** @see doGet */
function getAllStudents_() {
  return JSON.stringify(getAllStudentsGAS_());
}

function getArchive_(dateRangeJSON) {
  return JSON.stringify(getArchivedFormsGAS_(dateRangeJSON));
}

/** @see doGet */
function getOpenForms_() {
  return JSON.stringify(getOpenFormsGAS_());
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
  // clear signature validation
  clearSignatureValidationGAS_();
  return;
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
    if (item.checkOut) {
      return item.checkIn || item.missing;
    }
    return true;
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
  if (! isCheckOutStudentOk_(form)) {
    return false;
  }
  return form.students.some(
    function(student) { return student.checkIn; }
  ) && form.students.every(
    function(student) {
      if (student.checkIn) {
        return student.checkOut || student.left;
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
  if (! form.id) {
    return false;
  }
  var gracePeriod = 30, // minutes
      start = new Date(form.startTime),
      now   = Date.now();

  var checkedIn = function(student) { return student.checkIn; };

  start.setMinutes(start.getMinutes() + gracePeriod);

  if (now > start.getTime() && ! form.students.some(checkedIn)) {
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
    if (student.checkIn) {
      return student.checkOut;
    } else {
      return true; // never checked-in
    }
  };
  var end = new Date(form.endTime);
  if (Date.now() > end.getTime() && ! form.students.every(isCheckedOut)) {
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
    if (student.checkIn && !(student.checkOut || student.left)) {
      return count + 0;
    } else {
      return count;
    }
  }, 0);
  return activeStudents > 1;
}

/**
 * Form validation
 * @see doPost
 */
function isValidForm_(form) {
  if (form.items) {
    form = checkItemsGAS_(form);
  }
  return form;
}

/**
 * @param {obj} request - .netId{string}, .codabar{string}, .update{bool}
 */
function postCodabar_(request) {
  try {
    writeCodabarGAS_(request.netId, request.codabar, request.update);
  } catch (error) {
    if (/ID EXISTS/.test(error)) {
      throw new Error("Oops, we have another ID saved for " + request.netId +
        ". Trying refreshing your browser."
      );
    }
    throw error;
  }
}

/** @see doPost */
function postForm_(form) {
  form = isValidForm_(form);
  return writeFormToSheetGAS_(form);
}

// //run.doPost({ post: 'signature', dataURL: dataURL, id: studentId });
function postSignature_(request) {
  return writeSignatureToSheetGAS_(request);
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
  if (! formObj.id) {
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
    .setNotes(formObj.notes)
    .setHash(formObj.hash);
  return form;
}

var utility = { date: {}, hash: {} };

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

utility.hash.make = function(string) {
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.MD2, string);
  return Utilities.base64EncodeWebSafe(digest);
};
