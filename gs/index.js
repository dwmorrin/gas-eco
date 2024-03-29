/* global globalThis */

import { ErrorFormCollision, ErrorFormInvalid } from "./Errors";
import { getUserName } from "./User";
import Form from "./Form";
import {
  getAllItems,
  getAllStudents,
  getClosedForms,
  getOpenForms,
  writeCodabar,
  writeFormToSheet,
  writeRejectedFormToSheet,
} from "./Database";

/**
 *! These seemingly frivolous assignments are to make both
 *! ESLint and Rollup happy with the non-exported functions in this file.
 * Why? Rollup will ignore the file without export or side-effects.
 * GAS chokes on keyword "export" so harmless side-effects.
 * Why not put these assignments in an IIFE? Web app will work,
 * but HTMLService will not include these functions in google.script.run,
 * thus breaking client-server communications.
 */
globalThis.doGet = doGet;
globalThis.doPost = doPost;
globalThis.include_ = include_;

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
    return HtmlService.createTemplateFromFile("index")
      .evaluate()
      .setTitle("Equipment Check-Out")
      .addMetaTag("viewport", "width=device-width");
  }

  const response = (payload) => ({ payload, type });

  switch (type) {
    case "closedForms":
      return response({
        ...getClosedForms(payload.lastClosedFormRow),
      });
    case "items":
      return response({
        items: JSON.stringify(getAllItems()),
      });
    case "openForms":
      return response({
        formList: JSON.stringify(getOpenForms()),
      });
    case "students":
      return response({
        students: JSON.stringify(getAllStudents()),
      });
    case "userName":
      return response({
        userName: getUserName(),
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
      writeCodabar(payload);
      return response({
        type,
        students: JSON.stringify(getAllStudents()),
      });
    case "deleteForm": {
      const form = new Form(JSON.parse(payload));
      try {
        writeFormToSheet(form, true);
        return response({
          type: "openForms",
          payload: { formList: JSON.stringify(getOpenForms()) },
        });
      } catch (error) {
        if (error instanceof ErrorFormCollision) {
          writeRejectedFormToSheet(form);
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
      writeRejectedFormToSheet(new Form(payload));
      return response({ type });
    case "updateForm": {
      const form = new Form(JSON.parse(payload));
      try {
        form.validate(); // throws ErrorFormInvalid
        if (form.isReadyToClose || form.isNoShow) {
          writeFormToSheet(form, true); // throws ErrorFormCollision
          return response({
            type: "openForms",
            payload: { formList: JSON.stringify(getOpenForms()) },
          });
        } else {
          return response({
            type,
            payload: JSON.stringify(writeFormToSheet(form)), // throws ErrorFormCollision
          });
        }
      } catch (error) {
        if (error instanceof ErrorFormCollision) {
          writeRejectedFormToSheet(form);
          return response({
            type: "collision",
            payload: {
              storedForm: JSON.stringify(error.saved),
              submittedForm: JSON.stringify(error.submitted),
            },
          });
        } else if (error instanceof ErrorFormInvalid) {
          writeRejectedFormToSheet(form);
          return response({
            type: "invalid",
            payload: { form: JSON.stringify(form), message: error.message },
          });
        }
        throw error;
      }
    }
  }
}

/**
 * Utility function to keep separate HTML, CSS, and JS files
 * @see {@link https://developers.google.com/apps-script/guides/html/best-practices}
 */
function include_(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
