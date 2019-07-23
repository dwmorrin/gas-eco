/* global
ErrorFormCollision_
ErrorFormInvalid_
Form_
clearSignatureValidation_
createDailyBookingForms_
getAllItems_
getAllStudents_
getArchivedForms_
getOpenForms_
startSignature_
writeCodabar_
writeFormToSheet_
writeRejectedFormToSheet_
writeSignatureToSheet_
*/

/**
 * This runs on a time driver trigger.
 * Replaces the printing of the physical forms.
 * @todo setup daily trigger
 */
/* exported createDailyForms_ */
function createDailyForms_() {
  createDailyBookingForms_();
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
    webpage.setTitle('Equipment Check-Out')
      .addMetaTag("viewport", "width=device-width");
    return webpage;
  }

  switch (request.get) {
    case 'archive':
      response.formList = getArchivedForms_(request.dateRangeJSON).stringify();
      break;
    case 'items':
      response.items = getAllItems_().stringify();
      break;
    case 'students':
      response.students = JSON.stringify(getAllStudents_());
      break;
    case 'user':
      response.user = getUser_();
      break;
    case 'checkForms': // fallthrough
    case 'openForms':
      response.formList = getOpenForms_().stringify();
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
    // eslint-disable-next-line no-console
    console.error(lockError);
    throw new Error(
      "Whoops, the database is unavailable at the moment. " +
      "You may have to refresh the browser."
    );
  }
  // we have the lock
  // we must check that there is no collision first, i.e. that thing we are trying
  // to update wasn't already updated by someone else.
  switch (request.post) {
    case 'codabar':
      writeCodabar_(request.netId, request.codabar);
      response.students = JSON.stringify(getAllStudents_());
      break;
    case 'rejected':
      writeRejectedFormToSheet_(new Form_(request.form));
      break;
    case 'signature':
      writeSignatureToSheet_(request);
      response.students = JSON.stringify(getAllStudents_());
      break;
    case 'signatureTimeout':
      clearSignatureValidation_();
      break;
    case 'startSignature':
      startSignature_(request.netid);
      break;
    case 'updateForm':
      var form = new Form_(JSON.parse(request.form));
      try {
        form.validate(); // throws ErrorFormInvalid_
        if (form.isReadyToClose() || form.isNoShow()) {
          writeFormToSheet_(form, true); // throws ErrorFormCollision_
          request.post = 'openForms';
          response.formList = getOpenForms_().stringify();
        } else {
          response.form = writeFormToSheet_(form).stringify(); // throws ErrorFormCollision_
        }
      } catch (error) {
        if (error instanceof ErrorFormCollision_) {
          writeRejectedFormToSheet_(form);
          lock.releaseLock();
          response.target = "collision";
          response.storedForm = JSON.stringify(error.saved);
          response.submittedForm = JSON.stringify(error.submitted);
          return response;
        } else if (error instanceof ErrorFormInvalid_) {
          writeRejectedFormToSheet_(form);
          lock.releaseLock();
          response.target = "invalid";
          response.form = form;
          response.message = error.message;
          return response;
        } else {
          lock.releaseLock();
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
  clearSignatureValidation_();
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
