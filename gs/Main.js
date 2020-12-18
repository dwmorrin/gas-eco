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
    case "closedForms":
      return response({
        ...Database.getClosedForms(lastClosedFormRow),
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

  const response = (data = {}) => {
    lock.releaseLock();
    return data;
  };
  // we have the lock
  // we must check that there is no collision first, i.e. that thing we are trying
  // to update wasn't already updated by someone else.
  switch (request.post) {
    case "codabar":
      Database.writeCodabar(request.netId, request.codabar);
      return response({
        students: JSON.stringify(Database.getAllStudents()),
        target: "codabar",
      });
    case "deleteForm": {
      const form = new Form_(JSON.parse(request.form));
      try {
        Database.writeFormToSheet(form, true);
        return response({
          target: "openForms",
          formList: JSON.stringify(Database.getOpenForms()),
        });
      } catch (error) {
        if (error instanceof ErrorFormCollision_) {
          Database.writeRejectedFormToSheet(form);
          return response({
            target: "collision",
            storedForm: JSON.stringify(error.saved),
            submittedForm: JSON.stringify(error.submitted),
          });
        }
        return response({ error });
      }
    }
    case "rejected":
      Database.writeRejectedFormToSheet(new Form_(request.form));
      return response({ target: "rejected" });
    case "signature":
      Database.writeSignatureToSheet(request);
      return response({
        students: JSON.stringify(Database.getAllStudents()),
        target: "signature",
      });
    case "signatureTimeout":
      Database.clearSignatureValidation();
      return response({ target: "signatureTimeout" });
    case "startSignature":
      Database.startSignature(request.netid);
      return response({ target: "startSignature" });
    case "updateForm": {
      const form = new Form_(JSON.parse(request.form));
      try {
        form.validate(); // throws ErrorFormInvalid_
        if (form.isReadyToClose() || form.isNoShow()) {
          Database.writeFormToSheet(form, true); // throws ErrorFormCollision_
          return response({
            target: "openForms",
            formList: JSON.stringify(Database.getOpenForms()),
          });
        } else {
          return response({
            form: JSON.stringify(Database.writeFormToSheet(form)), // throws ErrorFormCollision_
            target: "updateForm",
          });
        }
      } catch (error) {
        if (error instanceof ErrorFormCollision_) {
          Database.writeRejectedFormToSheet(form);
          return response({
            target: "collision",
            storedForm: JSON.stringify(error.saved),
            submittedForm: JSON.stringify(error.submitted),
          });
        } else if (error instanceof ErrorFormInvalid_) {
          Database.writeRejectedFormToSheet(form);
          return response({
            target: "invalid",
            form: JSON.stringify(form),
            message: error.message,
          });
        } else {
          return response({ error });
        }
      }
    }
    case "unload":
      handleUnload_();
      return response();
  }
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
