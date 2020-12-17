/* global
ErrorFormCollision_
ErrorFormInvalid_
Form_
Database
*/

/**
 * Runs on HTTP GET request.
 * Initial visit to the app URL triggers this function and returns a webpage.
 * Within the app, client requests for reading information come here.
 * External programs can access this function with HTTP GET as an API.
 * @see {@link https://developers.google.com/apps-script/guides/triggers/}
 */
/* exported doGet */
function doGet({ get, lastClosedFormRow }) {
  if (!get) {
    return HtmlService.createTemplateFromFile("html/index")
      .evaluate()
      .setTitle("Equipment Check-Out")
      .addMetaTag("viewport", "width=device-width");
  }

  const response = (data) => ({ ...data, target: get });

  switch (get) {
    case "archive":
      return response({
        ...Database.getArchivedForms(lastClosedFormRow),
      });
    case "items":
      return response({
        items: JSON.stringify(Database.getAllItems()),
      });
    case "students":
      return response({
        students: JSON.stringify(Database.getAllStudents()),
      });
    case "user":
      return response({
        user: getUser_(),
      });
    case "checkForms": // fallthrough
    case "openForms": // fallthrough
    case "openFormsQuiet":
      return response({
        formList: JSON.stringify(Database.getOpenForms()),
      });
  }

  return { error: { message: `unhandled request for ${get}` } };
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
    return {
      error:
        "Oops, the database is unavailable at the moment. " +
        "Try refreshing the browser.  Contact admin if the problem continues.",
    };
  }
  // we have the lock
  // we must check that there is no collision first, i.e. that thing we are trying
  // to update wasn't already updated by someone else.
  switch (request.post) {
    case "codabar":
      Database.writeCodabar(request.netId, request.codabar);
      response.students = JSON.stringify(Database.getAllStudents());
      response.target = "codabar";
      break;
    case "deleteForm":
      var form = new Form_(JSON.parse(request.form));
      try {
        Database.writeFormToSheet(form, true);
        response.target = "openForms";
        response.formList = JSON.stringify(Database.getOpenForms());
      } catch (error) {
        if (error instanceof ErrorFormCollision_) {
          Database.writeRejectedFormToSheet(form);
          lock.releaseLock();
          response.target = "collision";
          response.storedForm = JSON.stringify(error.saved);
          response.submittedForm = JSON.stringify(error.submitted);
          return response;
        }
        lock.releaseLock();
        throw error;
      }
      break;
    case "rejected":
      Database.writeRejectedFormToSheet(new Form_(request.form));
      response.target = "rejected";
      break;
    case "signature":
      Database.writeSignatureToSheet(request);
      response.students = JSON.stringify(Database.getAllStudents());
      response.target = "signature";
      break;
    case "signatureTimeout":
      Database.clearSignatureValidation();
      response.target = "signatureTimeout";
      break;
    case "startSignature":
      Database.startSignature(request.netid);
      response.target = "startSignature";
      break;
    case "updateForm":
      form = new Form_(JSON.parse(request.form));
      try {
        form.validate(); // throws ErrorFormInvalid_
        if (form.isReadyToClose() || form.isNoShow()) {
          Database.writeFormToSheet(form, true); // throws ErrorFormCollision_
          response.target = "openForms";
          response.formList = JSON.stringify(Database.getOpenForms());
        } else {
          response.form = JSON.stringify(Database.writeFormToSheet(form)); // throws ErrorFormCollision_
          response.target = "updateForm";
        }
      } catch (error) {
        if (error instanceof ErrorFormCollision_) {
          Database.writeRejectedFormToSheet(form);
          lock.releaseLock();
          response.target = "collision";
          response.storedForm = JSON.stringify(error.saved);
          response.submittedForm = JSON.stringify(error.submitted);
          return response;
        } else if (error instanceof ErrorFormInvalid_) {
          Database.writeRejectedFormToSheet(form);
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
    case "unload":
      handleUnload_();
      break;
  }
  lock.releaseLock();

  return response;
}

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
  Database.clearSignatureValidation();
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
