/* global
ErrorFormCollision
ErrorFormInvalid
Form
Database
*/
/* exported doGet */

/**
 * @typedef {Object} Action
 * @property {string} type identifies the action
 * @property {*=} payload data the receiver consumes to complete the action
 * @property {*=} meta additional info that is neither type nor payload
 * @property {boolean=} error if and only if true, there is an error
 */

/**
 * Runs on HTTP GET request.
 * Initial visit to the app URL triggers this function and returns a webpage.
 * Within the app, client requests for reading information come here.
 * External programs can access this function with HTTP GET as an API.
 * @see {@link https://developers.google.com/apps-script/guides/triggers/}
 */
function doGet({ type, payload = {} }) {
  if (!type) {
    return HtmlService.createTemplateFromFile("html/index")
      .evaluate()
      .setTitle("Equipment Check-Out")
      .addMetaTag("viewport", "width=device-width");
  }

  const response = (payload) => ({ payload, type });

  switch (type) {
    case "closedForms":
      return response({
        ...Database.getClosedForms(payload.lastClosedFormRow),
      });
    case "items":
      return response({
        items: JSON.stringify(Database.getAllItems()),
      });
    case "openForms":
      return response({
        formList: JSON.stringify(Database.getOpenForms()),
      });
    case "students":
      return response({
        students: JSON.stringify(Database.getAllStudents()),
      });
    case "userName":
      return response({
        userName: getUserName_(),
      });
  }

  return {
    error: true,
    type,
    payload: { message: `unhandled request for ${type}` },
  };
}

/**
 * Runs on HTTP POST request.
 * Within the app, client requests for updating data come here.
 * External programs can access this function with HTTP POST as an API.
 * @see {@link https://developers.google.com/apps-script/guides/triggers/}
 */
/* exported doPost */
function doPost({ type, payload }) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (lockError) {
    console.error(lockError);
    return {
      error: true,
      payload: {
        message:
          "Oops, the database is unavailable at the moment. " +
          "Try refreshing the browser. Contact admin if the problem continues.",
      },
    };
  }

  const response = (action) => {
    lock.releaseLock();
    return action;
  };

  switch (type) {
    case "codabar":
      Database.writeCodabar(payload);
      return response({
        type: "codabar",
        students: JSON.stringify(Database.getAllStudents()),
      });
    case "deleteForm": {
      const form = new Form(JSON.parse(payload));
      try {
        Database.writeFormToSheet(form, true);
        return response({
          type: "openForms",
          payload: { formList: JSON.stringify(Database.getOpenForms()) },
        });
      } catch (error) {
        if (error instanceof ErrorFormCollision) {
          Database.writeRejectedFormToSheet(form);
          return response({
            type: "collision",
            payload: {
              storedForm: JSON.stringify(error.saved),
              submittedForm: JSON.stringify(error.submitted),
            },
          });
        }
        return response({ error: true, payload: error });
      }
    }
    case "rejected": // NOT USED BY CLIENT
      Database.writeRejectedFormToSheet(new Form(payload));
      return response({ type: "rejected" });
    case "signature": // NOT USED BY CLIENT
      Database.writeSignatureToSheet(payload);
      return response({
        payload: { students: JSON.stringify(Database.getAllStudents()) },
        type: "signature",
      });
    case "signatureTimeout": // NOT USED BY CLIENT
      Database.clearSignatureValidation();
      return response({ type: "signatureTimeout" });
    case "startSignature":
      Database.startSignature(payload);
      return response({ type: "startSignature" });
    case "updateForm": {
      const form = new Form(JSON.parse(payload));
      try {
        form.validate(); // throws ErrorFormInvalid
        if (form.isReadyToClose() || form.isNoShow()) {
          Database.writeFormToSheet(form, true); // throws ErrorFormCollision
          return response({
            type: "openForms",
            payload: { formList: JSON.stringify(Database.getOpenForms()) },
          });
        } else {
          return response({
            type: "updateForm",
            payload: JSON.stringify(Database.writeFormToSheet(form)), // throws ErrorFormCollision
          });
        }
      } catch (error) {
        if (error instanceof ErrorFormCollision) {
          Database.writeRejectedFormToSheet(form);
          return response({
            type: "collision",
            payload: {
              storedForm: JSON.stringify(error.saved),
              submittedForm: JSON.stringify(error.submitted),
            },
          });
        } else if (error instanceof ErrorFormInvalid) {
          Database.writeRejectedFormToSheet(form);
          return response({
            type: "invalid",
            payload: { form: JSON.stringify(form), message: error.message },
          });
        }
        throw error;
      }
    }
    case "unload": // NOT USED BY CLIENT
      handleUnload_();
      return response();
  }
}

function getUserName_() {
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
