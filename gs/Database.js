/* global
env
ErrorFormCollision
ErrorFormDataInvalid
getUser_
Form
Item
Student
*/
/* exported Database */
var Database = (function () {
  return {
    getAllItems,
    getAllStudents,
    getClosedForms,
    getOpenForms,
    signatureEnd,
    signatureStart,
    writeCodabar,
    writeFormToSheet,
    writeRejectedFormToSheet,
  };

  /* ********* GETTERS *********** */

  function getAllItems() {
    return SpreadsheetApp.openById(env.items.SHEET_ID)
      .getSheetByName(env.items.SHEET_NAME)
      .getDataRange()
      .getValues()
      .slice(1)
      .filter(
        (itemData) =>
          /^\d+$/.test(itemData[env.items.BARCODE]) ||
          /[A-Za-z]+-[A-Za-z0-9]+/.test(itemData[env.items.ID])
      )
      .map((itemData) => new Item(itemData));
  }

  function getAllStudents() {
    return SpreadsheetApp.openById(env.students.SHEET_ID)
      .getSheetByName(env.students.SHEET_NAME)
      .getDataRange()
      .getValues()
      .slice(1)
      .map((studentData) => new Student(studentData));
  }

  function getClosedForms(lastRow = 0) {
    const chunkSize = 50; // each call retrieves, at most, one chunk of forms
    const sheet = SpreadsheetApp.openById(env.forms.SHEET_ID).getSheetByName(
      env.forms.ARCHIVE_NAME
    );
    if (!lastRow) lastRow = sheet.getLastRow();
    // minimum data row is #2 because #1 is the header row
    const firstRow = lastRow - chunkSize < 2 ? 2 : lastRow - chunkSize;
    return {
      firstRow,
      formList: JSON.stringify(
        sheet
          .getRange(firstRow, 1, chunkSize, 13)
          .getValues()
          .map((row) => new Form(row))
      ),
    };
  }

  /** @return {[]} an array of Forms */
  function getOpenForms() {
    const formsSpreadSheet = SpreadsheetApp.openById(env.forms.SHEET_ID);
    const formsSheet = formsSpreadSheet.getSheetByName(env.forms.SHEET_NAME);
    const data = formsSheet.getDataRange().getValues();
    const forms = [];
    // don't shift and start at row 1 to allow Sheet manipulation, if required
    for (let row = 1; row < data.length; ++row) {
      try {
        forms.push(new Form(data[row]).setHash());
      } catch (error) {
        if (error instanceof ErrorFormDataInvalid) {
          formsSpreadSheet
            .getSheetByName(env.forms.REJECTED_NAME)
            .appendRow(data[row]);
          formsSheet.deleteRow(row + 1);
          data.splice(row, 1);
        } else throw error;
      }
    }
    return forms;
  }

  /* ********* WRITERS *********** */

  function writeCodabar({ netId, codabar }) {
    const sheet = SpreadsheetApp.openById(env.students.SHEET_ID).getSheetByName(
      env.students.SHEET_NAME
    );
    const data = sheet.getDataRange().getValues();
    const i = data.findIndex((row) => row[env.students.NETID] === netId);
    if (i < 0) {
      throw new Error("Could not write codabar for " + netId);
    }
    sheet.getRange(i + 1, env.students.ID + 1).setValue(codabar);
  }

  /**
   * collisions result in rejected forms which are written to their own
   *   sheet for safekeeping.  Rejected forms are stored with an additional
   *   column containing the email address of the user whose form was rejected.
   *   Users can access their own rejected forms to view and delete them.
   */
  function writeRejectedFormToSheet(form) {
    const ss = SpreadsheetApp.openById(env.forms.SHEET_ID);
    const formSheet = ss.getSheetByName(env.forms.REJECTED_NAME);
    const values = form.toArray();
    values.push(getUser_());
    formSheet.appendRow(values);
  }

  function writeFormToSheet(form, close) {
    const ss = SpreadsheetApp.openById(env.forms.SHEET_ID);
    const formSheet = ss.getSheetByName(env.forms.SHEET_NAME);
    const data = formSheet.getDataRange().getValues();
    const id = form.id;
    const values = form.toArray();

    if (!id) {
      // create
      values[0] = Form.createId();
      formSheet.appendRow(values);
      // see TODO below for more info on why this is necessary
      return new Form(
        formSheet.getRange(formSheet.getLastRow(), 1, 1, 13).getValues()[0]
      ).setHash();
    }

    // Note: do not shift data
    const i = data.findIndex((row) => String(row[0]) === id);
    if (i < 0) {
      throw new Error(`could not find form ID: ${id}`);
    }
    const row = i + 1;

    // Do not allow write unless user was editing most
    // recent form.  Use try/catch around call to this function
    // to handle this error
    const storedForm = new Form(data[i]).setHash();
    if (form.hash !== storedForm.hash) {
      throw new ErrorFormCollision(storedForm, form);
    }

    if (close) {
      ss.getSheetByName(env.forms.ARCHIVE_NAME).appendRow(values);
      // 'Close' form by deleting from active sheet
      formSheet
        .getRange(row, 1, 1, 13)
        .deleteCells(SpreadsheetApp.Dimension.ROWS);
      return;
    }

    const range = formSheet.getRange(row, 1, 1, 13);
    range.setValues([values]);
    // must retrieve values from Sheet to get correct hash
    return new Form(range.getValues()[0]).setHash();
  }

  function signatureStart(netId) {
    SpreadsheetApp.openById(env.students.SHEET_ID)
      .getSheetByName(env.students.SIGNATURE_SHEET_NAME)
      .appendRow([netId]);
  }

  function signatureEnd(netId) {
    const sheet = SpreadsheetApp.openById(env.students.SHEET_ID).getSheetByName(
      env.students.SIGNATURE_SHEET_NAME
    );
    const rows = sheet
      .getDataRange()
      .getValues()
      .filter(([id]) => id !== netId);
    sheet.clear();
    if (rows.length) sheet.getRange(1, 1, rows.length, 1).setValues(rows);
  }
})();
