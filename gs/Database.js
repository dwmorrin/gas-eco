/* global
ErrorFormCollision
ErrorFormDataInvalid
getUser_
Form
Item
Student
*/
/* exported Database */
var Database = (function () {
  const index = {
    forms: {
      SHEET_ID: "1q8i1VjR8DdBTSl5KGbxVJByCcqQIaRhJXBq89L8h29I",
      SHEET_NAME: "Forms",
      REJECTED_NAME: "Rejected",
      ARCHIVE_NAME: "Archive",
      ID: 0,
      START_TIME: 1,
      END_TIME: 2,
      LOCATION: 3,
      BOOKING_ID: 4,
      BOOKED_STUDENTS: 5,
      CONTACT: 6,
      PROJECT: 7,
      TAPE: 8,
      OVERNIGHT: 9,
      STUDENTS: 10,
      ITEMS: 11,
      NOTES: 12,
    },
    items: {
      SHEET_ID: "1XYu7fGgmuZ3DTa8y2JNbwwKuHw8_XNJ4VEwgZCf_UME",
      SHEET_NAME: "Inventory",
      MAKE: 3,
      MODEL: 4,
      DESCRIPTION: 5,
      ID: 7,
      BARCODE: 8,
    },
    students: {
      SHEET_ID: "1q5AW6L1Cya7PhSe1o4UmTjHw4qCE6e0LArVLycv8xKE",
      SHEET_NAME: "Students",
      SIGNATURE_SHEET_NAME: "Validation",
      ID: 0,
      NAME: 1,
      NETID: 2,
      CONTACT: 3,
      SIGNATURE: 4,
    },
  };

  return {
    clearSignatureValidation,
    getAllItems,
    getAllStudents,
    getClosedForms,
    getOpenForms,
    index,
    startSignature,
    writeCodabar,
    writeFormToSheet,
    writeRejectedFormToSheet,
    writeSignatureToSheet,
  };

  /* ********* GETTERS *********** */

  function getAllItems() {
    return SpreadsheetApp.openById(index.items.SHEET_ID)
      .getSheetByName(index.items.SHEET_NAME)
      .getDataRange()
      .getValues()
      .slice(1)
      .filter(
        (itemData) =>
          /^\d+$/.test(itemData[index.items.BARCODE]) ||
          /[A-Za-z]+-[A-Za-z0-9]+/.test(itemData[index.items.ID])
      )
      .map((itemData) => new Item(itemData));
  }

  function getAllStudents() {
    return SpreadsheetApp.openById(index.students.SHEET_ID)
      .getSheetByName(index.students.SHEET_NAME)
      .getDataRange()
      .getValues()
      .slice(1)
      .map((studentData) => new Student(studentData));
  }

  function getClosedForms(lastRow = 0) {
    const chunkSize = 50; // each call retrieves, at most, one chunk of forms
    const sheet = SpreadsheetApp.openById(index.forms.SHEET_ID).getSheetByName(
      index.forms.ARCHIVE_NAME
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
    const formsSpreadSheet = SpreadsheetApp.openById(index.forms.SHEET_ID);
    const formsSheet = formsSpreadSheet.getSheetByName(index.forms.SHEET_NAME);
    const data = formsSheet.getDataRange().getValues();
    const forms = [];
    // don't shift and start at row 1 to allow Sheet manipulation, if required
    for (let row = 1; row < data.length; ++row) {
      try {
        forms.push(new Form(data[row]).setHash());
      } catch (error) {
        if (error instanceof ErrorFormDataInvalid) {
          formsSpreadSheet
            .getSheetByName(index.forms.REJECTED_NAME)
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
    const sheet = SpreadsheetApp.openById(
      index.students.SHEET_ID
    ).getSheetByName(index.students.SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    const i = data.findIndex((row) => row[index.students.NETID] === netId);
    if (i < 0) {
      throw new Error("Could not write codabar for " + netId);
    }
    sheet.getRange(i + 1, index.students.ID + 1).setValue(codabar);
  }

  /**
   * collisions result in rejected forms which are written to their own
   *   sheet for safekeeping.  Rejected forms are stored with an additional
   *   column containing the email address of the user whose form was rejected.
   *   Users can access their own rejected forms to view and delete them.
   */
  function writeRejectedFormToSheet(form) {
    const ss = SpreadsheetApp.openById(index.forms.SHEET_ID);
    const formSheet = ss.getSheetByName(index.forms.REJECTED_NAME);
    const values = form.toArray();
    values.push(getUser_());
    formSheet.appendRow(values);
  }

  function writeFormToSheet(form, close) {
    const ss = SpreadsheetApp.openById(index.forms.SHEET_ID);
    const formSheet = ss.getSheetByName(index.forms.SHEET_NAME);
    const data = formSheet.getDataRange().getValues();
    const id = form.id;
    const values = form.toArray();

    if (!id) {
      // create
      values[0] = form.createId();
      formSheet.appendRow(values);
      // see TODO below for more info on why this is necessary
      return new Form(
        formSheet.getRange(formSheet.getLastRow(), 1, 1, 13).getValues()[0]
      ).setHash();
    }

    // Note: do not shift data
    const i = data.findIndex((row) => row[0] === id);
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
      ss.getSheetByName(index.forms.ARCHIVE_NAME).appendRow(values);
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

  function writeSignatureToSheet({ id, dataURL }) {
    const sheet = SpreadsheetApp.openById(
      index.students.SHEET_ID
    ).getSheetByName(index.students.SHEET_NAME);
    const i = sheet
      .getDataRange()
      .getValues()
      .findIndex((row) => row[index.students.NETID] === id);
    if (i < 0) {
      throw new Error(`Could not match ID: ${id}`);
    }
    sheet.getRange(i + 1, index.students.SIGNATURE + 1).setValue(dataURL);
  }

  // TODO don't hardcode A1; just append a row with the Net ID
  function startSignature(netid) {
    SpreadsheetApp.openById(index.students.SHEET_ID)
      .getSheetByName(index.students.SIGNATURE_SHEET_NAME)
      .getRange("A1")
      .setValue(netid);
  }

  // TODO don't hardcode A1; search for the Net ID to clear off
  // TODO reactivate or delete
  function clearSignatureValidation() {
    return;
    // SpreadsheetApp.openById(index.students.SHEET_ID)
    //   .getSheetByName(index.students.SIGNATURE_SHEET_NAME)
    //   .getRange("A1")
    //   .clear();
  }
})();
