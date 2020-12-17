/* global
ErrorFormCollision_
ErrorFormDataInvalid_
ErrorFormInvalid_
getUser_
Form_
Item_
Student_
*/
/* exported Database */
var Database = (function () {
  const index = {
    forms: {
      SHEET_ID: "1q8i1VjR8DdBTSl5KGbxVJByCcqQIaRhJXBq89L8h29I",
      SHEET_NAME: "Forms",
      REJECTED_NAME: "Rejected",
      ARCHIVE_NAME: "Archive",
    },
    items: {
      SHEET_ID: "1XYu7fGgmuZ3DTa8y2JNbwwKuHw8_XNJ4VEwgZCf_UME",
      SHEET_NAME: "Inventory",
      MAKE: 3,
      MODEL: 4,
      DESCRIPTION: 5,
      ID: 7,
      BARCODE: 8,
      HISTORY: 11,
      CHECKED_OUT: 13,
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
    getArchivedForms,
    getOpenForms,
    startSignature,
    writeCodabar,
    writeFormToSheet,
    writeRejectedFormToSheet,
    writeSignatureToSheet,
  };

  /**
   * TODO debug and reactivate
   * turned off!
   */
  function checkItems_(form) {
    var sheet = SpreadsheetApp.openById(index.items.SHEET_ID).getSheetByName(
      index.items.SHEET_NAME
    );
    var data = sheet.getDataRange().getValues();
    form.items.forEach(function (item) {
      var id = item.id ? "id" : "barcode";
      var requestingCheckout =
        item.checkOut && !item.checkIn && !item.checkedOut;
      var requestingCheckIn = item.checkIn && item.checkedOut;
      if (!item.isSerialized()) {
        if (requestingCheckout) {
          item.checkedOut = true;
        }
        if (requestingCheckIn) {
          item.checkedOut = false;
        }
        return;
      }
      const row = data.findIndex(
        (row) => row[index.items[id.toUpperCase()]] === item[id]
      );
      if (row < 0) {
        throw new ErrorFormInvalid_(
          item.description + " " + item.id + " cannot be found."
        );
      }
      if (requestingCheckout) {
        if (!data[row][index.items.CHECKED_OUT]) {
          sheet.getRange(row + 1, index.items.CHECKED_OUT + 1).setValue(true);
          item.checkedOut = true;
          return;
        }
        throw new ErrorFormInvalid_(
          item.description + item.id + " is already checked out"
        );
      }
      if (requestingCheckIn) {
        if (data[row][index.items.CHECKED_OUT]) {
          sheet.getRange(row + 1, index.items.CHECKED_OUT + 1).clear();
          item.checkedOut = false;
          return;
        }
        throw new ErrorFormInvalid_(
          item.description + item.id + " is already checked in"
        );
      }
    });
  }

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
      .map((itemData) => new Item_(itemData));
  }

  function getAllStudents() {
    var sheet = SpreadsheetApp.openById(index.students.SHEET_ID).getSheetByName(
      index.students.SHEET_NAME
    );
    var data = sheet.getDataRange().getValues();
    data.shift();
    var students = [];
    data.forEach(function getArrayOfStudents(studentData) {
      students.push(new Student_(studentData));
    });
    return students;
  }

  function getArchivedForms(lastRow = 0) {
    const chunkSize = 50; // each call retrieves, at most, one chunk of forms
    const sheet = SpreadsheetApp.openById(index.forms.SHEET_ID).getSheetByName(
      index.forms.ARCHIVE_NAME
    );
    if (!lastRow) lastRow = sheet.getLastRow();
    // minimum data row is #2 because #1 is the header row
    const firstRow = lastRow - chunkSize < 2 ? 2 : lastRow - chunkSize;
    var data = sheet.getRange(firstRow, 1, chunkSize, 13).getValues();
    return {
      firstRow,
      formList: JSON.stringify(data.map((row) => new Form_(row))),
    };
  }

  /** @return {[]} an array of Forms */
  function getOpenForms() {
    var formsSpreadSheet = SpreadsheetApp.openById(index.forms.SHEET_ID);
    var formsSheet = formsSpreadSheet.getSheetByName(index.forms.SHEET_NAME);
    var data = formsSheet.getDataRange().getValues(),
      forms = [];
    // don't shift and start at row 1 to allow Sheet manipulation, if required
    for (var row = 1; row < data.length; ++row) {
      try {
        forms.push(new Form_(data[row]).setHash());
      } catch (error) {
        if (error instanceof ErrorFormDataInvalid_) {
          var rejectedSheet = formsSpreadSheet.getSheetByName(
            index.forms.REJECTED_NAME
          );
          rejectedSheet.appendRow(data[row]);
          formsSheet.deleteRow(row + 1);
          data.splice(row, 1);
        } else {
          throw error;
        }
      }
    }
    return forms;
  }

  /* ********* WRITERS *********** */

  function writeCodabar(netId, codabar) {
    var sheet = SpreadsheetApp.openById(index.students.SHEET_ID).getSheetByName(
      index.students.SHEET_NAME
    );
    var data = sheet.getDataRange().getValues();
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
    var ss = SpreadsheetApp.openById(index.forms.SHEET_ID);
    var formSheet = ss.getSheetByName(index.forms.REJECTED_NAME);
    var values = form.getAsArray();
    values.push(getUser_());
    formSheet.appendRow(values);
  }

  function writeFormToSheet(form, closeAndArchive) {
    const ss = SpreadsheetApp.openById(index.forms.SHEET_ID);
    const formSheet = ss.getSheetByName(index.forms.SHEET_NAME);
    const data = formSheet.getDataRange().getValues();
    const id = form.id;
    const values = form.getAsArray();

    if (!id) {
      // create
      values[0] = form.createId();
      formSheet.appendRow(values);
      // see TODO below for more info on why this is necessary
      return new Form_(
        formSheet.getRange(formSheet.getLastRow(), 1, 1, 13).getValues()[0]
      ).setHash();
    }

    // Note: do not shift data
    const i = data.findIndex((row) => row[0] === id);
    if (i < 0) {
      throw "could not find form " + form;
    }
    const row = i + 1;

    // Do not allow write unless user was editing most
    // recent form.  Use try/catch around call to this function
    // to handle this error
    const storedForm = new Form_(data[i]).setHash();
    if (form.hash !== storedForm.hash) {
      throw new ErrorFormCollision_(storedForm, form);
    }

    if (closeAndArchive) {
      ss.getSheetByName(index.forms.ARCHIVE_NAME).appendRow(values);
      // 'Close' form by deleting from active sheet
      formSheet
        .getRange(row, 1, 1, 13)
        .deleteCells(SpreadsheetApp.Dimension.ROWS);
      return;
    }

    var column = 1,
      numRows = 1,
      numColumns = 13,
      range;
    range = formSheet.getRange(row, column, numRows, numColumns);
    range.setValues([values]);
    // TODO this retrieves the correct hash.  Trying to skip a step and hash the
    //   `values` variable directly comes up with a different hash due to
    //   Sheet converting numbers and dates. Consider plain text format to eliminate
    //   the extra retrieval step.
    return new Form_(range.getValues()[0]).setHash();
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
      throw "Could not match " + id;
    }
    sheet.getRange(i + 1, index.students.SIGNATURE + 1).setValue(dataURL);
  }

  // TODO don't hardcode A1; just append a row with the Net ID
  function startSignature(netid) {
    var sheet = SpreadsheetApp.openById(index.students.SHEET_ID).getSheetByName(
      index.students.SIGNATURE_SHEET_NAME
    );
    sheet.getRange("A1").setValue(netid);
  }

  // TODO don't hardcode A1; search for the Net ID to clear off
  // TODO reactivate or delete
  function clearSignatureValidation() {
    return;
    // var sheet = SpreadsheetApp.openById(index.students.SHEET_ID).getSheetByName(
    //   index.students.SIGNATURE_SHEET_NAME
    // );
    // sheet.getRange("A1").clear();
  }
})();
